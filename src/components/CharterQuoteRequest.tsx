import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, RefreshCw, Search, Building2 } from "lucide-react";
import { toast } from "sonner";

interface CharterQuoteRequestProps {
  leadData: any;
}

interface Operator {
  id: number;
  name: string;
  country?: string;
  base_airports?: string[];
  avg_response_rate?: number;
  avg_response_time?: number;
  aviapages_validation?: boolean;
}

interface QuoteReply {
  id: number;
  price: number;
  currency: string;
  state: string | { id: number; name: string };
  aircraft?: {
    tail_number: string;
    aircraft_type: string;
    aircraft_class: string;
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

  const handleSearchOperators = async () => {
    setIsSearching(true);
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

      // Build charter search request
      const searchBody = {
        legs: [
          {
            departure_airport,
            arrival_airport,
            pax: leadData.passengers,
            departure_datetime: `${leadData.departure_date}T${leadData.departure_time || '12:00'}`.slice(0, 16) // Remove seconds
          }
        ],
        aircraft: [
          {
            ac_class: "Midsize" // Can be made dynamic
          }
        ]
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
        setOperators(data.data.companies);
        setShowOperators(true);
        toast.success(`Found ${data.data.companies.length} operators`);
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

  const toggleOperator = (operatorId: number) => {
    const newSelected = new Set(selectedOperators);
    if (newSelected.has(operatorId)) {
      newSelected.delete(operatorId);
    } else {
      newSelected.add(operatorId);
    }
    setSelectedOperators(newSelected);
  };

  const handleRequestQuotes = async () => {
    if (selectedOperators.size === 0) {
      toast.error('Please select at least one operator');
      return;
    }

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

      // Build quote request with selected operators
      const quote_messages = Array.from(selectedOperators).map(id => ({
        company: { id }
      }));

      const requestBody = {
        legs: [
          {
            departure_airport,
            arrival_airport,
            pax: leadData.passengers,
            departure_datetime: `${leadData.departure_date}T${leadData.departure_time || '12:00'}`.slice(0, 16) // Remove seconds
          }
        ],
        aircraft: [
          {
            ac_class: "Midsize"
          }
        ],
        quote_messages,
        quote_extension: {
          client_given_name: leadData.first_name,
          client_family_name: leadData.last_name,
          client_email: leadData.email,
          client_phone: leadData.phone
        },
        comment: comment || `Charter request for ${leadData.first_name} ${leadData.last_name}`,
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
        toast.error('Failed to fetch quote replies');
        return;
      }

      if (!data.success) {
        console.error('Failed to fetch replies:', data.error);
        toast.error(data.error || 'Failed to fetch quote replies');
        return;
      }

      console.log('Quote replies:', data.data);
      setQuoteReplies(data.data.results || []);
      
      if (data.data.results && data.data.results.length > 0) {
        toast.success(`Received ${data.data.results.length} quote(s)`);
      } else {
        toast.info('No quotes received yet. Operators typically respond within a few hours.');
      }

    } catch (error) {
      console.error('Exception fetching replies:', error);
      toast.error('An error occurred while fetching quotes');
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
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

  return (
    <div className="space-y-6">
      {/* Step 1: Search for Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Step 1: Find Charter Operators
          </CardTitle>
          <CardDescription>
            Search for available operators for this route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSearchOperators}
            disabled={isSearching}
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
              {operators.map((operator) => (
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
                      <h4 className="font-semibold">{operator.name}</h4>
                      <div className="flex gap-2">
                        {operator.aviapages_validation && (
                          <Badge variant="default" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        {operator.country && (
                          <Badge variant="outline" className="text-xs">
                            {operator.country}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {operator.avg_response_rate !== undefined && (
                        <span className="mr-3">
                          Response rate: {Math.round(operator.avg_response_rate * 100)}%
                        </span>
                      )}
                      {operator.avg_response_time !== undefined && (
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
                  </div>
                </div>
              ))}
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
              onClick={handleRequestQuotes}
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
                  Request Quotes from {selectedOperators.size} Operator(s)
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
                              {reply.aircraft.aircraft_type}
                            </h4>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{reply.aircraft.aircraft_class}</Badge>
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
    </div>
  );
};
