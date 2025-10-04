import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CHARTER_AIRCRAFT } from "@/data/aircraftDatabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, RefreshCw, Search, Building2 } from "lucide-react";
import { toast } from "sonner";

interface CharterQuoteRequestProps {
  leadData: any;
}

interface Operator {
  id: number;
  name: string;
  country?: string | { id: number; name: string };
  city?: { id: number; name: string };
  logo_url?: string;
  base_airports?: string[];
  avg_response_rate?: number;
  avg_response_time?: number;
  aviapages_validation?: boolean;
  aircraft?: Array<{
    id: number;
    ac_type: string | { id: number; name: string };
    aircraft_class?: string | { id: number; name: string };
    tail_number: string;
    max_passengers: number;
    location?: {
      iata?: string;
      icao?: string;
      name?: string;
    } | null;
  }>;
}

interface QuoteReply {
  id: number;
  price: number;
  currency: string | { id: number; name: string };
  state: string | { id: number; name: string };
  aircraft?: {
    tail_number: string;
    ac_type: string | { id: number; name: string };
    aircraft_class: string | { id: number; name: string };
    max_passengers: number;
  };
  comment?: string;
  created_at: string;
  quote_message_id: number;
}

export const CharterQuoteRequest = ({ leadData }: CharterQuoteRequestProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [comment, setComment] = useState("");
  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<Set<number>>(new Set());
  const [quoteRequestId, setQuoteRequestId] = useState<number | null>(null);
  const [quoteReplies, setQuoteReplies] = useState<QuoteReply[]>([]);
  const [showOperators, setShowOperators] = useState(false);
  const [selectedAircraftClasses, setSelectedAircraftClasses] = useState<Set<string>>(new Set(['Midsize']));
  const [showPreview, setShowPreview] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<{
    price: number;
    price_min: number | null;
    price_max: number | null;
    currency: string;
  } | null>(null);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [classPriceEstimates, setClassPriceEstimates] = useState<Array<{
    className: string;
    price: number;
    price_min: number | null;
    price_max: number | null;
    isEstimating: boolean;
  }>>([]);

  // Category order for aircraft classes
  const CATEGORY_ORDER = [
    'Light Jet',
    'Super Light Jet',
    'Mid Jet',
    'Super Mid Jet',
    'Heavy Jet',
    'Ultra Long Range'
  ];

  // Calculate distance between airports using great circle formula
  const calculateDistance = (dep: string, arr: string): number => {
    // Extract ICAO/IATA codes
    const extractCode = (airportStr: string) => {
      const match = airportStr.match(/^([A-Z]{3,4})/);
      return match ? match[1] : airportStr;
    };

    const depCode = extractCode(dep);
    const arrCode = extractCode(arr);

    // Simple coordinate lookup (you may want to enhance this with actual airport data)
    const coords: { [key: string]: [number, number] } = {
      'KJFK': [40.6413, -73.7781], 'JFK': [40.6413, -73.7781],
      'KLAX': [33.9425, -118.4081], 'LAX': [33.9425, -118.4081],
      'KLAS': [36.0840, -115.1537], 'LAS': [36.0840, -115.1537],
      'KORD': [41.9742, -87.9073], 'ORD': [41.9742, -87.9073],
      'KDFW': [32.8998, -97.0403], 'DFW': [32.8998, -97.0403],
    };

    const depCoords = coords[depCode] || [40.6413, -73.7781];
    const arrCoords = coords[arrCode] || [33.9425, -118.4081];

    const [lat1, lon1] = depCoords;
    const [lat2, lon2] = arrCoords;

    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  // Get capable aircraft classes for this route
  const getCapableClasses = () => {
    const distance = calculateDistance(leadData.departure_airport, leadData.arrival_airport);
    const passengers = leadData.passengers || 1;
    const minRunway = 5000; // Default assumption

    const capableClasses: string[] = [];

    for (const category of CATEGORY_ORDER) {
      if (category === 'Ultra Long Range') continue; // Exclude ULR as requested

      const aircraftInCategory = CHARTER_AIRCRAFT.filter(a => a.category === category);
      const canComplete = aircraftInCategory.some(a => 
        a.range >= distance * 1.1 && // 10% reserve
        a.passengers >= passengers &&
        a.minRunway <= minRunway
      );

      if (canComplete) {
        capableClasses.push(category);
      }
    }

    // Find minimum capable class and return all from that point onwards (excluding ULR)
    if (capableClasses.length === 0) return [];
    
    const minClassIndex = CATEGORY_ORDER.indexOf(capableClasses[0]);
    return CATEGORY_ORDER.slice(minClassIndex).filter(c => c !== 'Ultra Long Range');
  };

  // Auto-fetch price estimates for all capable classes on mount
  useEffect(() => {
    const fetchAllClassPrices = async () => {
      const capableClasses = getCapableClasses();
      if (capableClasses.length === 0) return;

      // Initialize all classes as estimating
      const initialEstimates = capableClasses.map(className => ({
        className,
        price: 0,
        price_min: null,
        price_max: null,
        isEstimating: true
      }));
      setClassPriceEstimates(initialEstimates);

      // Extract airport codes
      const extractCode = (airportStr: string) => {
        const match = airportStr.match(/^([A-Z]{3,4})/);
        return match ? match[1] : airportStr;
      };

      const depCode = extractCode(leadData.departure_airport);
      const arrCode = extractCode(leadData.arrival_airport);

      const departure_airport: any = {};
      if (depCode.length === 3) {
        departure_airport.iata = depCode;
      } else if (depCode.length === 4) {
        departure_airport.icao = depCode;
      }

      const arrival_airport: any = {};
      if (arrCode.length === 3) {
        arrival_airport.iata = arrCode;
      } else if (arrCode.length === 4) {
        arrival_airport.icao = arrCode;
      }

      // Fetch price for each class
      for (const className of capableClasses) {
        try {
          const getDepartureDateTime = () => {
            if (leadData.departure_datetime) {
              const dt = new Date(leadData.departure_datetime);
              return {
                date: dt.toISOString().split('T')[0],
                time: dt.toTimeString().split(' ')[0]
              };
            }
            return {
              date: leadData.departure_date,
              time: leadData.departure_time || '12:00:00'
            };
          };

          const getReturnDateTime = () => {
            if (leadData.return_datetime) {
              const dt = new Date(leadData.return_datetime);
              return {
                date: dt.toISOString().split('T')[0],
                time: dt.toTimeString().split(' ')[0]
              };
            }
            if (leadData.return_date) {
              return {
                date: leadData.return_date,
                time: leadData.return_time || '12:00:00'
              };
            }
            return null;
          };

          const { date, time } = getDepartureDateTime();
          const isRoundTrip = leadData.trip_type === 'round-trip' || !!leadData.return_date;

          // Map our class names to Aviapages class names
          const classNameMap: { [key: string]: string } = {
            'Light Jet': 'Light',
            'Super Light Jet': 'Midsize',
            'Mid Jet': 'Midsize',
            'Super Mid Jet': 'Super Midsize',
            'Heavy Jet': 'Heavy'
          };

          const aircraft = { aircraft_class: classNameMap[className] || className };

          // Outbound leg
          const outboundBody = {
            legs: [
              {
                departure_airport,
                arrival_airport,
                pax: leadData.passengers,
                departure_datetime: `${date}T${time}`.slice(0, 16)
              }
            ],
            aircraft,
            currency_code: 'USD',
            range: true
          };

          const { data: outboundData, error: outboundError } = await supabase.functions.invoke('get-charter-price', {
            body: outboundBody
          });

          if (outboundError || !outboundData?.success) {
            console.error(`Error fetching price for ${className}:`, outboundError);
            setClassPriceEstimates(prev => 
              prev.map(est => est.className === className 
                ? { ...est, isEstimating: false }
                : est
              )
            );
            continue;
          }

          let totalPrice = outboundData.data.price;
          let totalPriceMin = outboundData.data.price_min || outboundData.data.price;
          let totalPriceMax = outboundData.data.price_max || outboundData.data.price;

          // If round trip, fetch return leg
          if (isRoundTrip) {
            const returnDateTime = getReturnDateTime();
            if (returnDateTime) {
              const returnBody = {
                legs: [
                  {
                    departure_airport: arrival_airport,
                    arrival_airport: departure_airport,
                    pax: leadData.passengers,
                    departure_datetime: `${returnDateTime.date}T${returnDateTime.time}`.slice(0, 16)
                  }
                ],
                aircraft,
                currency_code: 'USD',
                range: true
              };

              const { data: returnData, error: returnError } = await supabase.functions.invoke('get-charter-price', {
                body: returnBody
              });

              if (!returnError && returnData?.success && returnData.data) {
                totalPrice += returnData.data.price;
                totalPriceMin += returnData.data.price_min || returnData.data.price;
                totalPriceMax += returnData.data.price_max || returnData.data.price;
              }
            }
          }

          // Update this specific class estimate
          setClassPriceEstimates(prev => 
            prev.map(est => est.className === className 
              ? {
                  className,
                  price: totalPrice,
                  price_min: totalPriceMin > 0 ? totalPriceMin : null,
                  price_max: totalPriceMax > 0 ? totalPriceMax : null,
                  isEstimating: false
                }
              : est
            )
          );

        } catch (error) {
          console.error(`Error fetching price for ${className}:`, error);
          setClassPriceEstimates(prev => 
            prev.map(est => est.className === className 
              ? { ...est, isEstimating: false }
              : est
            )
          );
        }
      }
    };

    fetchAllClassPrices();
  }, []); // Run once on mount


  const handleSearchOperators = async () => {
    setIsSearching(true);
    setPriceEstimate(null); // Reset price estimate
    setIsFetchingPrice(true); // Start price fetch
    
    try {
      // Extract airport codes
      const extractCode = (airportStr: string) => {
        const match = airportStr.match(/^([A-Z]{3,4})/);
        return match ? match[1] : airportStr;
      };

      const depCode = extractCode(leadData.departure_airport);
      const arrCode = extractCode(leadData.arrival_airport);

      // Build airport objects with only the relevant property
      const departure_airport: any = {};
      if (depCode.length === 3) {
        departure_airport.iata = depCode;
      } else if (depCode.length === 4) {
        departure_airport.icao = depCode;
      }

      const arrival_airport: any = {};
      if (arrCode.length === 3) {
        arrival_airport.iata = arrCode;
      } else if (arrCode.length === 4) {
        arrival_airport.icao = arrCode;
      }

      // Build charter search request with selected aircraft classes
      const aircraft = Array.from(selectedAircraftClasses).map(ac_class => ({ ac_class }));
      
      // Extract date and time for API call
      const getDepartureDateTime = () => {
        if (leadData.departure_datetime) {
          const dt = new Date(leadData.departure_datetime);
          return {
            date: dt.toISOString().split('T')[0],
            time: dt.toTimeString().split(' ')[0]
          };
        }
        return {
          date: leadData.departure_date,
          time: leadData.departure_time || '12:00:00'
        };
      };

      const { date, time } = getDepartureDateTime();

      const searchBody = {
        legs: [
          {
            departure_airport,
            arrival_airport,
            pax: leadData.passengers,
            departure_datetime: `${date}T${time}`.slice(0, 16) // Remove seconds
          }
        ],
        aircraft
      };

      console.log('Searching for charter operators:', searchBody);

      const { data, error } = await supabase.functions.invoke('search-charter-operators', {
        body: searchBody
      });

      if (error) {
        console.error('Error searching operators:', error);
        toast.error('Failed to search for operators');
        return;
      }

      if (!data.success) {
        console.error('Search failed:', data.error);
        toast.error(data.error || 'Failed to search for operators');
        return;
      }

      console.log('Search results:', data.data);
      
      // Extract operators from the response
      if (data.data.companies && Array.isArray(data.data.companies)) {
        const operators = data.data.companies;
        
        // Extract all tail numbers to look up locations
        const allTailNumbers = operators
          .flatMap(op => op.aircraft || [])
          .map(ac => ac.tail_number)
          .filter(Boolean);

        console.log(`Looking up locations for ${allTailNumbers.length} aircraft...`);
        
        // Query local database for aircraft locations
        try {
          const { data: locationData, error: locationError } = await supabase
            .from('aircraft_locations')
            .select('tail_number, home_airport_icao, home_airport_iata, home_airport_name, country_code, operator_name')
            .in('tail_number', allTailNumbers);

          if (locationData && !locationError) {
            console.log(`Found ${locationData.length} aircraft locations in database`);
            
            // Create a map of tail number to location
            const locationMap = new Map(
              locationData.map(item => [
                item.tail_number,
                {
                  icao: item.home_airport_icao,
                  iata: item.home_airport_iata,
                  name: item.home_airport_name
                }
              ])
            );

            // Enrich operators with aircraft location data
            operators.forEach(operator => {
              if (operator.aircraft) {
                operator.aircraft.forEach(aircraft => {
                  const locationInfo = locationMap.get(aircraft.tail_number);
                  if (locationInfo && locationInfo.icao) {
                    aircraft.location = locationInfo;
                  }
                });
              }
            });
          } else if (locationError) {
            console.error('Error querying aircraft locations:', locationError);
          }
        } catch (error) {
          console.error('Error looking up aircraft locations:', error);
          // Continue without enhanced locations
        }

        // Sort operators by location relevance
        const sortedOperators = [...operators].sort((a, b) => {
          const aCountry = typeof a.country === 'string' ? a.country : a.country?.name || '';
          const bCountry = typeof b.country === 'string' ? b.country : b.country?.name || '';
          
          // For US domestic flights, prioritize US operators
          const isUSDomestic = depCode.startsWith('K') || depCode.startsWith('T') || 
                               arrCode.startsWith('K') || arrCode.startsWith('T');
          
          if (isUSDomestic) {
            if (aCountry.includes('United States') && !bCountry.includes('United States')) return -1;
            if (!aCountry.includes('United States') && bCountry.includes('United States')) return 1;
            
            // Among US operators, prioritize those with aircraft near departure or arrival airports
            const aHasLocalAircraft = a.aircraft?.some(ac => {
              const loc = ac.location?.icao || ac.location?.iata || '';
              return loc && (loc === depCode || loc === arrCode);
            });
            const bHasLocalAircraft = b.aircraft?.some(ac => {
              const loc = ac.location?.icao || ac.location?.iata || '';
              return loc && (loc === depCode || loc === arrCode);
            });
            
            if (aHasLocalAircraft && !bHasLocalAircraft) return -1;
            if (!aHasLocalAircraft && bHasLocalAircraft) return 1;
          }
          
          return 0;
        });
        
        console.log('Sorted operators count:', sortedOperators.length);
        setOperators(sortedOperators);
        setShowOperators(true);
        toast.success(`Found ${sortedOperators.length} operators`);
        
        // Fetch price estimate in parallel
        fetchPriceEstimate(departure_airport, arrival_airport, aircraft);
      } else {
        toast.info('No operators found for this route');
        setOperators([]);
      }

    } catch (error) {
      console.error('Exception searching operators:', error);
      toast.error('An error occurred while searching for operators');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchPriceEstimate = async (departure_airport: any, arrival_airport: any, aircraft: any) => {
    try {
      const getDepartureDateTime = () => {
        if (leadData.departure_datetime) {
          const dt = new Date(leadData.departure_datetime);
          return {
            date: dt.toISOString().split('T')[0],
            time: dt.toTimeString().split(' ')[0]
          };
        }
        return {
          date: leadData.departure_date,
          time: leadData.departure_time || '12:00:00'
        };
      };

      const getReturnDateTime = () => {
        if (leadData.return_datetime) {
          const dt = new Date(leadData.return_datetime);
          return {
            date: dt.toISOString().split('T')[0],
            time: dt.toTimeString().split(' ')[0]
          };
        }
        if (leadData.return_date) {
          return {
            date: leadData.return_date,
            time: leadData.return_time || '12:00:00'
          };
        }
        return null;
      };

      const { date, time } = getDepartureDateTime();
      const isRoundTrip = leadData.trip_type === 'round-trip' || !!leadData.return_date;

      // Outbound leg
      const outboundBody = {
        legs: [
          {
            departure_airport,
            arrival_airport,
            pax: leadData.passengers,
            departure_datetime: `${date}T${time}`.slice(0, 16)
          }
        ],
        aircraft,
        currency_code: 'USD',
        range: true
      };

      const { data: outboundData, error: outboundError } = await supabase.functions.invoke('get-charter-price', {
        body: outboundBody
      });

      if (outboundError) {
        console.error('Error fetching outbound price:', outboundError);
        setIsFetchingPrice(false);
        return;
      }

      let totalPrice = 0;
      let totalPriceMin = 0;
      let totalPriceMax = 0;

      if (outboundData?.success && outboundData.data) {
        totalPrice = outboundData.data.price;
        totalPriceMin = outboundData.data.price_min || outboundData.data.price;
        totalPriceMax = outboundData.data.price_max || outboundData.data.price;
      }

      // If round trip, fetch return leg and add prices
      if (isRoundTrip) {
        const returnDateTime = getReturnDateTime();
        if (returnDateTime) {
          const returnBody = {
            legs: [
              {
                departure_airport: arrival_airport, // Reversed
                arrival_airport: departure_airport, // Reversed
                pax: leadData.passengers,
                departure_datetime: `${returnDateTime.date}T${returnDateTime.time}`.slice(0, 16)
              }
            ],
            aircraft,
            currency_code: 'USD',
            range: true
          };

          const { data: returnData, error: returnError } = await supabase.functions.invoke('get-charter-price', {
            body: returnBody
          });

          if (!returnError && returnData?.success && returnData.data) {
            totalPrice += returnData.data.price;
            totalPriceMin += returnData.data.price_min || returnData.data.price;
            totalPriceMax += returnData.data.price_max || returnData.data.price;
          }
        }
      }

      setPriceEstimate({
        price: totalPrice,
        price_min: totalPriceMin > 0 ? totalPriceMin : null,
        price_max: totalPriceMax > 0 ? totalPriceMax : null,
        currency: 'USD'
      });
    } catch (error) {
      console.error('Error fetching price estimate:', error);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const toggleOperator = (operatorId: number) => {
    const newSelected = new Set(selectedOperators);
    if (newSelected.has(operatorId)) {
      newSelected.delete(operatorId);
    } else {
      newSelected.add(operatorId);
    }
    setSelectedOperators(newSelected);
  };

  const handleShowPreview = () => {
    if (selectedOperators.size === 0) {
      toast.error('Please select at least one operator');
      return;
    }
    setShowPreview(true);
  };

  const handleSendQuotes = async () => {
    setShowPreview(false);
    setIsRequesting(true);
    try {
      // Extract airport codes
      const extractCode = (airportStr: string) => {
        const match = airportStr.match(/^([A-Z]{3,4})/);
        return match ? match[1] : airportStr;
      };

      const depCode = extractCode(leadData.departure_airport);
      const arrCode = extractCode(leadData.arrival_airport);

      // Build airport objects with only the relevant property
      const departure_airport: any = {};
      if (depCode.length === 3) {
        departure_airport.iata = depCode;
      } else if (depCode.length === 4) {
        departure_airport.icao = depCode;
      }

      const arrival_airport: any = {};
      if (arrCode.length === 3) {
        arrival_airport.iata = arrCode;
      } else if (arrCode.length === 4) {
        arrival_airport.icao = arrCode;
      }

      // Build quote request with selected operators and aircraft classes
      const quote_messages = Array.from(selectedOperators).map(id => ({
        company: { id }
      }));

      const aircraft = Array.from(selectedAircraftClasses).map(ac_class => ({ ac_class }));

      const requestBody = {
        legs: [
          {
            departure_airport,
            arrival_airport,
            pax: leadData.passengers,
            departure_datetime: `${leadData.departure_date}T${leadData.departure_time || '12:00'}`.slice(0, 16) // Remove seconds
          }
        ],
        aircraft,
        quote_messages,
        given_name: 'Jesse',
        family_name: 'Marsh',
        channels: ['Email', 'Leon', 'Fl3xx', 'Skylegs'], // Operators will receive via their preferred/integrated system
        quote_extension: {
          client_given_name: 'Jesse',
          client_family_name: 'Marsh',
          client_email: 'jesse.marsh@stratosjets.com',
          client_phone: '973-756-6183'
        },
        comment: comment || 'Charter quote request',
        post_to_trip_board: false,
        send_to_self: false
      };

      console.log('Sending charter quote request:', requestBody);

      const { data, error } = await supabase.functions.invoke('request-charter-quotes', {
        body: requestBody
      });

      if (error) {
        console.error('Error requesting quotes:', error);
        toast.error('Failed to request quotes');
        return;
      }

      if (!data.success) {
        console.error('Quote request failed:', data.error);
        toast.error(data.error || 'Failed to request quotes');
        return;
      }

      console.log('Quote request successful:', data);
      setQuoteRequestId(data.data.id);
      toast.success(`Quote request sent to ${selectedOperators.size} operator(s)`);

      // Immediately try to fetch replies
      setTimeout(() => fetchQuoteReplies(data.data.id), 2000);

    } catch (error) {
      console.error('Exception requesting quotes:', error);
      toast.error('An error occurred while requesting quotes');
    } finally {
      setIsRequesting(false);
    }
  };

  const fetchQuoteReplies = async (requestId?: number) => {
    const idToUse = requestId || quoteRequestId;
    if (!idToUse) {
      toast.error('No quote request ID available');
      return;
    }

    setIsLoadingReplies(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-charter-quote-replies', {
        body: { quote_request_id: idToUse }
      });

      if (error) {
        console.error('Error fetching quote replies:', error);
        toast.error('Quotes will be sent to your email (jesse.marsh@stratosjets.com) as operators respond');
        return;
      }

      if (!data.success) {
        console.error('Failed to fetch replies:', data.error, data.details);
        
        // Check if it's a permissions issue
        if (data.details?.includes('permission')) {
          toast.info('Quote request sent! Operators will reply to your email (jesse.marsh@stratosjets.com)');
        } else {
          toast.error(data.error || 'Failed to fetch quote replies');
        }
        return;
      }

      console.log('Quote replies:', data.data);
      console.log('First reply structure:', JSON.stringify(data.data.results?.[0], null, 2));
      setQuoteReplies(data.data.results || []);
      
      if (data.data.results && data.data.results.length > 0) {
        toast.success(`Received ${data.data.results.length} quote(s)`);
      } else {
        toast.info('No quotes received yet. Operators typically respond within a few hours to your email.');
      }

    } catch (error) {
      console.error('Exception fetching replies:', error);
      toast.error('An error occurred while fetching quotes');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const formatPrice = (price: number, currency: string | { id: number; name: string }) => {
    const currencyCode = typeof currency === 'string' ? currency : currency.name;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD'
    }).format(price);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'OK': return 'bg-green-500';
      case 'Not available': return 'bg-red-500';
      case 'Removed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const aircraftClasses = [
    'Light',
    'Midsize',
    'Super Midsize',
    'Heavy',
    'Ultra Long Range',
    'VIP Airliner'
  ];

  const toggleAircraftClass = (className: string) => {
    const newSelected = new Set(selectedAircraftClasses);
    if (newSelected.has(className)) {
      newSelected.delete(className);
    } else {
      newSelected.add(className);
    }
    setSelectedAircraftClasses(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Price Estimates by Aircraft Class - Prominent Top Section */}
      {classPriceEstimates.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              💰 Price Estimates by Aircraft Class
            </CardTitle>
            <CardDescription>
              Estimated prices for {leadData.departure_airport.match(/^([A-Z]{3,4})/)?.[1]} → {leadData.arrival_airport.match(/^([A-Z]{3,4})/)?.[1]} 
              {leadData.trip_type === 'round-trip' || leadData.return_date ? ' (Round Trip)' : ' (One Way)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classPriceEstimates.map((estimate, index) => (
                <Card key={estimate.className} className={`${index === 0 ? 'border-2 border-primary' : 'border'}`}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{estimate.className}</h4>
                        {index === 0 && (
                          <Badge variant="default" className="text-xs">Minimum</Badge>
                        )}
                      </div>
                      {estimate.isEstimating ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Calculating...</span>
                        </div>
                      ) : estimate.price > 0 ? (
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            {estimate.price_min && estimate.price_max ? (
                              <>
                                ${Math.round(estimate.price_min / 1000)}k - ${Math.round(estimate.price_max / 1000)}k
                              </>
                            ) : (
                              `$${Math.round(estimate.price / 1000)}k`
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Total Trip Cost</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">Price unavailable</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <p>✈️ Showing estimates for capable aircraft classes (excluding Ultra Long Range)</p>
              <p className="mt-1">📊 {leadData.passengers} passenger{leadData.passengers > 1 ? 's' : ''} • {new Date(leadData.departure_date).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Info Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Route</p>
              <p className="font-semibold">{leadData.departure_airport} → {leadData.arrival_airport}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <p className="font-semibold">{new Date(leadData.departure_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Passengers</p>
              <p className="font-semibold">{leadData.passengers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Est. Price (USD)</p>
              {isFetchingPrice ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm text-muted-foreground">Calculating...</span>
                </div>
              ) : priceEstimate ? (
                <p className="font-semibold text-primary">
                  {priceEstimate.price_min && priceEstimate.price_max ? (
                    `$${priceEstimate.price_min.toLocaleString()} - $${priceEstimate.price_max.toLocaleString()}`
                  ) : (
                    `$${priceEstimate.price.toLocaleString()}`
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Search to see estimate</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Search for Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Step 1: Find Charter Operators
          </CardTitle>
          <CardDescription>
            Search for available operators for this route and selected aircraft types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Aircraft Classes ({selectedAircraftClasses.size} selected)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {aircraftClasses.map((className) => (
                <div
                  key={className}
                  className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleAircraftClass(className)}
                >
                  <Checkbox
                    checked={selectedAircraftClasses.has(className)}
                    onCheckedChange={() => toggleAircraftClass(className)}
                  />
                  <label className="text-sm cursor-pointer flex-1">
                    {className}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSearchOperators}
            disabled={isSearching || selectedAircraftClasses.size === 0}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching Operators...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Charter Operators
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Select Operators */}
      {showOperators && operators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Step 2: Select Operators ({selectedOperators.size} selected)
            </CardTitle>
            <CardDescription>
              Choose operators to send your quote request to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {operators.map((operator) => {
                // All aircraft returned from API are already filtered by selected classes
                const matchingAircraft = operator.aircraft || [];
                const operatorName = operator.name || 'Unknown Operator';
                const countryName = operator.country 
                  ? (typeof operator.country === 'string' ? operator.country : operator.country?.name || 'Unknown')
                  : 'Unknown';

                console.log('Rendering operator:', operatorName, 'Aircraft count:', matchingAircraft.length);

                return (
                  <div
                    key={operator.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleOperator(operator.id)}
                  >
                    <Checkbox
                      checked={selectedOperators.has(operator.id)}
                      onCheckedChange={() => toggleOperator(operator.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{operatorName}</h4>
                        <div className="flex gap-2">
                          {operator.aviapages_validation && (
                            <Badge variant="default" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {countryName}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {operator.avg_response_rate !== undefined && (
                          <span className="mr-3">
                            Response rate: {Math.round(operator.avg_response_rate * 100)}%
                          </span>
                        )}
                        {operator.avg_response_time !== undefined && operator.avg_response_time !== null && (
                          <span>
                            Avg response: {Math.round(operator.avg_response_time / 60)}h
                          </span>
                        )}
                      </div>
                      {operator.base_airports && operator.base_airports.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Bases: {operator.base_airports.join(', ')}
                        </div>
                      )}
                      {matchingAircraft.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="text-xs font-medium mb-1">
                            Available Aircraft ({matchingAircraft.length}):
                          </div>
                          <div className="space-y-2">
                            {(() => {
                              // Group aircraft by type
                              const groupedAircraft = matchingAircraft.reduce((acc, ac) => {
                                const acType = typeof ac.ac_type === 'string' 
                                  ? ac.ac_type 
                                  : ac.ac_type?.name || 'Unknown';
                                
                                if (!acc[acType]) {
                                  acc[acType] = {
                                    count: 0,
                                    locations: new Set<string>(),
                                    tailNumbers: []
                                  };
                                }
                                
                                acc[acType].count++;
                                acc[acType].tailNumbers.push(ac.tail_number);
                                
                                if (ac.location) {
                                  const loc = ac.location.iata || ac.location.icao || ac.location.name;
                                  if (loc) acc[acType].locations.add(loc);
                                }
                                
                                return acc;
                              }, {} as Record<string, { count: number; locations: Set<string>; tailNumbers: string[] }>);

                              return Object.entries(groupedAircraft).slice(0, 5).map(([type, data], idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <Badge variant="secondary">
                                    {type}
                                    {data.count > 1 && ` (×${data.count})`}
                                  </Badge>
                                  {data.locations.size > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      📍 {Array.from(data.locations).join(', ')}
                                    </Badge>
                                  )}
                                </div>
                              ));
                            })()}
                            {Object.keys(matchingAircraft.reduce((acc, ac) => {
                              const acType = typeof ac.ac_type === 'string' ? ac.ac_type : ac.ac_type?.name || 'Unknown';
                              acc[acType] = true;
                              return acc;
                            }, {} as Record<string, boolean>)).length > 5 && (
                              <div className="text-xs text-muted-foreground">
                                +{Object.keys(matchingAircraft.reduce((acc, ac) => {
                                  const acType = typeof ac.ac_type === 'string' ? ac.ac_type : ac.ac_type?.name || 'Unknown';
                                  acc[acType] = true;
                                  return acc;
                                }, {} as Record<string, boolean>)).length - 5} more types
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Request Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Step 3: Request Charter Quotes
          </CardTitle>
          <CardDescription>
            {selectedOperators.size > 0 
              ? `Send quote request to ${selectedOperators.size} selected operator(s)`
              : 'Search and select operators first'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Comments for Operators (Optional)
            </label>
            <Textarea
              placeholder="Add any special requirements or notes for operators..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleShowPreview}
              disabled={isRequesting || selectedOperators.size === 0}
              className="flex-1"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to {selectedOperators.size} operator(s)...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Preview & Send to {selectedOperators.size} Operator(s)
                </>
              )}
            </Button>

            {quoteRequestId && (
              <Button
                onClick={() => fetchQuoteReplies()}
                disabled={isLoadingReplies}
                variant="outline"
              >
                {isLoadingReplies ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {quoteRequestId && (
            <div className="text-sm text-muted-foreground">
              Quote Request ID: <span className="font-mono">{quoteRequestId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {quoteReplies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Charter Quote Responses</CardTitle>
            <CardDescription>
              {quoteReplies.length} quote(s) received from operators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quoteReplies.map((reply) => (
                <Card key={reply.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {reply.aircraft && (
                          <div className="space-y-1">
                            <h4 className="font-semibold text-lg">
                              {typeof reply.aircraft.ac_type === 'string' 
                                ? reply.aircraft.ac_type 
                                : reply.aircraft.ac_type.name}
                            </h4>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">
                                {typeof reply.aircraft.aircraft_class === 'string' 
                                  ? reply.aircraft.aircraft_class 
                                  : reply.aircraft.aircraft_class.name}
                              </Badge>
                              <Badge variant="outline">{reply.aircraft.tail_number}</Badge>
                              <Badge variant="outline">
                                Max {reply.aircraft.max_passengers} pax
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPrice(reply.price, reply.currency)}
                        </div>
                        <Badge className={getStateColor(typeof reply.state === 'string' ? reply.state : reply.state.name)}>
                          {typeof reply.state === 'string' ? reply.state : reply.state.name}
                        </Badge>
                      </div>
                    </div>

                    {reply.comment && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm">{reply.comment}</p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      Received: {new Date(reply.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Review Quote Request</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  ✕
                </Button>
              </div>

              {/* Flight Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Flight Details</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Route:</strong> {leadData.departure_airport} → {leadData.arrival_airport}</p>
                  <p><strong>Departure:</strong> {leadData.departure_date} at {leadData.departure_time || '12:00'}</p>
                  {leadData.return_date && (
                    <p><strong>Return:</strong> {leadData.return_date} {leadData.return_time ? `at ${leadData.return_time}` : ''}</p>
                  )}
                  <p><strong>Passengers:</strong> {leadData.passengers}</p>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Client Information</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Name:</strong> {leadData.first_name} {leadData.last_name}</p>
                  <p><strong>Email:</strong> {leadData.email}</p>
                  <p><strong>Phone:</strong> {leadData.phone}</p>
                </div>
              </div>

              {/* Aircraft Classes */}
              {selectedAircraftClasses.size > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Aircraft Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedAircraftClasses).map(className => (
                      <span key={className} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Operators */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Selected Operators ({selectedOperators.size})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {operators
                    .filter(op => selectedOperators.has(op.id))
                    .map(operator => (
                      <div key={operator.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {operator.logo_url && (
                          <img 
                            src={operator.logo_url} 
                            alt={operator.name}
                            className="w-12 h-12 object-contain"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{operator.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {operator.city?.name}, {typeof operator.country === 'string' ? operator.country : operator.country?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Comment */}
              {comment && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Additional Comments</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">{comment}</p>
                  </div>
                </div>
              )}

              {/* What Operators Will See */}
              <div className="space-y-2 border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground">📩 What Operators Will Receive</h4>
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">QUOTE REQUEST FROM</p>
                    <p className="text-sm"><strong>Broker:</strong> Jesse Marsh</p>
                    <p className="text-sm"><strong>Contact:</strong> jesse.marsh@stratosjets.com • 973-756-6183</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">FLIGHT DETAILS</p>
                    <p className="text-sm"><strong>Route:</strong> {leadData.departure_airport.match(/^([A-Z]{3,4})/)?.[1] || leadData.departure_airport} → {leadData.arrival_airport.match(/^([A-Z]{3,4})/)?.[1] || leadData.arrival_airport}</p>
                    <p className="text-sm"><strong>Departure:</strong> {
                      leadData.departure_datetime 
                        ? new Date(leadData.departure_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : `${leadData.departure_date} at ${leadData.departure_time || '12:00'}`
                    }</p>
                    {(leadData.return_datetime || leadData.return_date) && (
                      <p className="text-sm"><strong>Return:</strong> {
                        leadData.return_datetime
                          ? new Date(leadData.return_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : `${leadData.return_date} ${leadData.return_time ? `at ${leadData.return_time}` : ''}`
                      }</p>
                    )}
                    <p className="text-sm"><strong>Passengers:</strong> {leadData.passengers}</p>
                    {selectedAircraftClasses.size > 0 && (
                      <p className="text-sm"><strong>Aircraft Classes:</strong> {Array.from(selectedAircraftClasses).join(', ')}</p>
                    )}
                  </div>

                  {comment && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">SPECIAL REQUESTS</p>
                        <p className="text-sm italic">{comment}</p>
                      </div>
                    </>
                  )}

                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                    💡 Operators will respond directly to you (Jesse Marsh) and can follow up for more details
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendQuotes}
                  disabled={isRequesting}
                  className="flex-1"
                >
                  {isRequesting ? 'Sending...' : 'Send Quote Requests'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
