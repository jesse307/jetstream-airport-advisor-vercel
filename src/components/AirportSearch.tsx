import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Airport interface for API response
interface Airport {
  code: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  type: string;
  runwayLength?: number | null;
  fbo?: string[] | string | null;
  latitude?: number;
  longitude?: number;
}

interface AirportSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const AirportSearch: React.FC<AirportSearchProps> = ({
  value,
  onChange,
  placeholder = "Search airports...",
  label
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);

  // Search airports via API
  const searchAirports = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAirports([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-airports', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Error searching airports:', error);
        setAirports([]);
      } else {
        setAirports(data.airports || []);
      }
    } catch (error) {
      console.error('Error searching airports:', error);
      setAirports([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAirports(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (airport: Airport) => {
    onChange(`${airport.code} - ${airport.name}, ${airport.city}`);
    setQuery("");
    setIsOpen(false);
    setAirports([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(newQuery.length > 0);
    
    if (newQuery === "") {
      onChange("");
      setAirports([]);
    }
  };

  const clearSearch = () => {
    setQuery("");
    onChange("");
    setIsOpen(false);
    setAirports([]);
  };

  return (
    <div className="relative space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={value || placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query && setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {(query || value) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-gray-500">
                <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
                Searching airports...
              </div>
            ) : airports.length > 0 ? (
              airports.map((airport, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(airport)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {airport.code}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {airport.type}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {airport.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {airport.city}{airport.state && `, ${airport.state}`}
                        {airport.country && airport.country !== 'US' && `, ${airport.country}`}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {airport.runwayLength && (
                        <div>Runway: {airport.runwayLength}'</div>
                      )}
                      {airport.fbo && (
                        <div className="mt-1">
                          FBO: {Array.isArray(airport.fbo) ? airport.fbo.slice(0, 2).join(", ") : airport.fbo}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : query.length >= 2 && !loading ? (
              <div className="px-3 py-4 text-center text-gray-500">
                No airports found for "{query}"
              </div>
            ) : query.length > 0 && query.length < 2 ? (
              <div className="px-3 py-4 text-center text-gray-500">
                Type at least 2 characters to search
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};