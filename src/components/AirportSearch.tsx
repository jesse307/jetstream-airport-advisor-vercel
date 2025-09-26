import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIVATE_AIRPORTS, type Airport } from "@/data/privateAirports";

// Comprehensive airports database including major commercial airports and private airports
const COMMERCIAL_AIRPORTS = [
  // Major Commercial/Public Airports
  // New York Area
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro, NJ", state: "NJ", runway: "7000 ft", fbo: "Atlantic Aviation, Signature Flight Support, Jet Aviation", type: "Public" },
  { code: "KJFK", name: "John F. Kennedy International", city: "New York, NY", state: "NY", runway: "14511 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLGA", name: "LaGuardia Airport", city: "New York, NY", state: "NY", runway: "7003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KEWR", name: "Newark Liberty International Airport", city: "Newark, NJ", state: "NJ", runway: "11000 ft", fbo: "Signature Flight Support, Atlantic Aviation", type: "Public" },
  { code: "KBDR", name: "Igor I. Sikorsky Memorial", city: "Bridgeport, CT", state: "CT", runway: "4761 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains, NY", state: "NY", runway: "6549 ft", fbo: "Million Air", type: "Public" },
  { code: "KCDW", name: "Essex County Airport", city: "Caldwell, NJ", state: "NJ", runway: "4997 ft", fbo: "Meridian", type: "Public" },

  // Los Angeles Area  
  { code: "KVAN", name: "Van Nuys Airport", city: "Van Nuys, CA", state: "CA", runway: "8001 ft", fbo: "Atlantic Aviation, Clay Lacy Aviation", type: "Public" },
  { code: "KSMO", name: "Santa Monica Airport", city: "Santa Monica, CA", state: "CA", runway: "4973 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBUR", name: "Hollywood Burbank Airport", city: "Burbank, CA", state: "CA", runway: "6886 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KLAX", name: "Los Angeles International", city: "Los Angeles, CA", state: "CA", runway: "12923 ft", fbo: "Atlantic Aviation, Signature Flight Support", type: "Public" },
  { code: "KSNA", name: "John Wayne Airport", city: "Santa Ana, CA", state: "CA", runway: "5701 ft", fbo: "Atlantic Aviation, Clay Lacy Aviation", type: "Public" },
  { code: "KLGB", name: "Long Beach Airport", city: "Long Beach, CA", state: "CA", runway: "10000 ft", fbo: "Atlantic Aviation", type: "Public" },

  // Florida
  { code: "KMCO", name: "Orlando International Airport", city: "Orlando, FL", state: "FL", runway: "12005 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KORL", name: "Orlando Executive Airport", city: "Orlando, FL", state: "FL", runway: "6004 ft", fbo: "Sheltair, Signature Flight Support", type: "Public" },
  { code: "KFLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale, FL", state: "FL", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KOPF", name: "Miami-Opa Locka Executive", city: "Opa-locka, FL", state: "FL", runway: "8002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMIA", name: "Miami International Airport", city: "Miami, FL", state: "FL", runway: "13016 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTMB", name: "Miami-Kendall Tamiami Executive", city: "Miami, FL", state: "FL", runway: "3279 ft", fbo: "Banyan Air Service", type: "Public" },
  { code: "KPBI", name: "Palm Beach International", city: "West Palm Beach, FL", state: "FL", runway: "10008 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTPA", name: "Tampa International Airport", city: "Tampa, FL", state: "FL", runway: "11002 ft", fbo: "Signature Flight Support", type: "Public" },

  // Atlanta Area
  { code: "KPDK", name: "DeKalb-Peachtree Airport", city: "Atlanta, GA", state: "GA", runway: "6001 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta, GA", state: "GA", runway: "12390 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFTY", name: "Fulton County Airport", city: "Atlanta, GA", state: "GA", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },

  // Chicago Area
  { code: "KORD", name: "Chicago O'Hare International", city: "Chicago, IL", state: "IL", runway: "13000 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KMDW", name: "Chicago Midway International", city: "Chicago, IL", state: "IL", runway: "6522 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KPWK", name: "Chicago Executive Airport", city: "Wheeling, IL", state: "IL", runway: "5001 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KDPA", name: "DuPage Airport", city: "West Chicago, IL", state: "IL", runway: "7271 ft", fbo: "Signature Flight Support", type: "Public" },

  // Texas
  { code: "KDAL", name: "Dallas Love Field", city: "Dallas, TX", state: "TX", runway: "8800 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KDFW", name: "Dallas/Fort Worth International", city: "Dallas, TX", state: "TX", runway: "13401 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KADS", name: "Addison Airport", city: "Addison, TX", state: "TX", runway: "7202 ft", fbo: "Atlantic Aviation, Million Air", type: "Public" },
  { code: "KIAH", name: "Houston Intercontinental", city: "Houston, TX", state: "TX", runway: "12001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KAUS", name: "Austin-Bergstrom International", city: "Austin, TX", state: "TX", runway: "12250 ft", fbo: "Signature Flight Support", type: "Public" },

// Major Hubs & International Airports
  { code: "KDEN", name: "Denver International Airport", city: "Denver, CO", state: "CO", runway: "16001 ft", fbo: "Signature Flight Support, Atlantic Aviation", type: "Public" },
  { code: "KLAS", name: "Harry Reid International Airport", city: "Las Vegas, NV", state: "NV", runway: "14514 ft", fbo: "Signature Flight Support, Atlantic Aviation", type: "Public" },
  { code: "KJFK", name: "John F. Kennedy International Airport", city: "New York, NY", state: "NY", runway: "14511 ft", fbo: "Signature Flight Support, Jet Aviation", type: "Public" },
  { code: "KORD", name: "Chicago O'Hare International", city: "Chicago, IL", state: "IL", runway: "13000 ft", fbo: "Atlantic Aviation, Signature Flight Support", type: "Public" },
  { code: "KDFW", name: "Dallas/Fort Worth International", city: "Dallas, TX", state: "TX", runway: "13401 ft", fbo: "Signature Flight Support, Million Air", type: "Public" },
  { code: "KMIA", name: "Miami International Airport", city: "Miami, FL", state: "FL", runway: "13016 ft", fbo: "Signature Flight Support, Sheltair", type: "Public" },
  { code: "KCVG", name: "Cincinnati/Northern Kentucky International", city: "Cincinnati, OH", state: "OH", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPHL", name: "Philadelphia International", city: "Philadelphia, PA", state: "PA", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KAUS", name: "Austin-Bergstrom International", city: "Austin, TX", state: "TX", runway: "12250 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KIAH", name: "Houston Intercontinental", city: "Houston, TX", state: "TX", runway: "12001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSFO", name: "San Francisco International", city: "San Francisco, CA", state: "CA", runway: "11870 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSEA", name: "Seattle-Tacoma International", city: "Seattle, WA", state: "WA", runway: "11901 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KIAD", name: "Washington Dulles International", city: "Washington, DC", state: "DC", runway: "11500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPIT", name: "Pittsburgh International", city: "Pittsburgh, PA", state: "PA", runway: "11500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPHX", name: "Phoenix Sky Harbor International", city: "Phoenix, AZ", state: "AZ", runway: "11489 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSEZ", name: "Sedona Airport", city: "Sedona, AZ", state: "AZ", runway: "5132 ft", fbo: "Sedona Air Tours, Classic Aviation", type: "Public" },
  { code: "KMSP", name: "Minneapolis-St. Paul International", city: "Minneapolis, MN", state: "MN", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPDX", name: "Portland International", city: "Portland, OR", state: "OR", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTPA", name: "Tampa International Airport", city: "Tampa, FL", state: "FL", runway: "11002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSTL", name: "St. Louis Lambert International", city: "St. Louis, MO", state: "MO", runway: "11019 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBWI", name: "Baltimore/Washington International", city: "Baltimore, MD", state: "MD", runway: "10502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBOS", name: "Boston Logan International", city: "Boston, MA", state: "MA", runway: "10083 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLGB", name: "Long Beach Airport", city: "Long Beach, CA", state: "CA", runway: "10000 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KCLT", name: "Charlotte Douglas International", city: "Charlotte, NC", state: "NC", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPBI", name: "Palm Beach International", city: "West Palm Beach, FL", state: "FL", runway: "10008 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KONT", name: "Ontario International Airport", city: "Ontario, CA", state: "CA", runway: "12197 ft", fbo: "Signature Flight Support", type: "Public" },

  // Regional & Business Aviation Airports (5000+ ft runways)
  { code: "KVCV", name: "Southern California Logistics Airport", city: "Victorville, CA", state: "CA", runway: "15049 ft", fbo: "Southern California Aviation", type: "Public" },
  { code: "KABE", name: "Lehigh Valley International Airport", city: "Allentown, PA", state: "PA", runway: "7600 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KABI", name: "Abilene Regional Airport", city: "Abilene, TX", state: "TX", runway: "7250 ft", fbo: "Millionaire Aviation", type: "Public" },
  { code: "KABQ", name: "Albuquerque International Sunport", city: "Albuquerque, NM", state: "NM", runway: "13793 ft", fbo: "Cutter Aviation, Ross Aviation", type: "Public" },
  { code: "KABR", name: "Aberdeen Regional Airport", city: "Aberdeen, SD", state: "SD", runway: "6898 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KABY", name: "Southwest Georgia Regional Airport", city: "Albany, GA", state: "GA", runway: "6001 ft", fbo: "Sheltair", type: "Public" },
  { code: "KACY", name: "Atlantic City International Airport", city: "Atlantic City, NJ", state: "NJ", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KACV", name: "Arcata-Eureka Airport", city: "Arcata, CA", state: "CA", runway: "6050 ft", fbo: "Humboldt Bay Aviation", type: "Public" },
  { code: "KAEX", name: "Alexandria International Airport", city: "Alexandria, LA", state: "LA", runway: "7003 ft", fbo: "Ross Aviation", type: "Public" },
  { code: "KAGS", name: "Augusta Regional Airport", city: "Augusta, GA", state: "GA", runway: "8001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KAFW", name: "Fort Worth Alliance Airport", city: "Fort Worth, TX", state: "TX", runway: "9600 ft", fbo: "Million Air", type: "Public" },
  { code: "KAMA", name: "Rick Husband Amarillo International", city: "Amarillo, TX", state: "TX", runway: "13502 ft", fbo: "Tradewind Aviation", type: "Public" },
  { code: "KBDL", name: "Bradley International Airport", city: "Hartford, CT", state: "CT", runway: "9510 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBDR", name: "Igor I. Sikorsky Memorial Airport", city: "Bridgeport, CT", state: "CT", runway: "4761 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KBED", name: "Laurence G. Hanscom Field", city: "Bedford, MA", state: "MA", runway: "7011 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBFI", name: "Boeing Field/King County International", city: "Seattle, WA", state: "WA", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBFL", name: "Meadows Field Airport", city: "Bakersfield, CA", state: "CA", runway: "10848 ft", fbo: "Sheltair", type: "Public" },
  { code: "KBGR", name: "Bangor International Airport", city: "Bangor, ME", state: "ME", runway: "11440 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBHM", name: "Birmingham-Shuttlesworth International", city: "Birmingham, AL", state: "AL", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBIL", name: "Billings Logan International Airport", city: "Billings, MT", state: "MT", runway: "10519 ft", fbo: "Edwards Jet Center", type: "Public" },
  { code: "KBIS", name: "Bismarck Municipal Airport", city: "Bismarck, ND", state: "ND", runway: "8800 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBJC", name: "Rocky Mountain Metropolitan Airport", city: "Denver, CO", state: "CO", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBLI", name: "Bellingham International Airport", city: "Bellingham, WA", state: "WA", runway: "6700 ft", fbo: "Bellingham Aviation Services", type: "Public" },
  { code: "KBNA", name: "Nashville International Airport", city: "Nashville, TN", state: "TN", runway: "11030 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBOI", name: "Boise Airport", city: "Boise, ID", state: "ID", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBTR", name: "Baton Rouge Metropolitan Airport", city: "Baton Rouge, LA", state: "LA", runway: "7150 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBUF", name: "Buffalo Niagara International Airport", city: "Buffalo, NY", state: "NY", runway: "8828 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KBUR", name: "Hollywood Burbank Airport", city: "Burbank, CA", state: "CA", runway: "6886 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KCAK", name: "Akron-Canton Airport", city: "Akron, OH", state: "OH", runway: "7600 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCHS", name: "Charleston International Airport", city: "Charleston, SC", state: "SC", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCLE", name: "Cleveland Hopkins International", city: "Cleveland, OH", state: "OH", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCLL", name: "Easterwood Airport", city: "College Station, TX", state: "TX", runway: "7000 ft", fbo: "Millionaire Aviation", type: "Public" },
  { code: "KCOS", name: "City of Colorado Springs Municipal", city: "Colorado Springs, CO", state: "CO", runway: "13502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KCRP", name: "Corpus Christi International Airport", city: "Corpus Christi, TX", state: "TX", runway: "8300 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDAY", name: "James M. Cox Dayton International", city: "Dayton, OH", state: "OH", runway: "10711 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDCA", name: "Ronald Reagan Washington National", city: "Washington, DC", state: "DC", runway: "7169 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDEC", name: "Decatur Airport", city: "Decatur, IL", state: "IL", runway: "6000 ft", fbo: "Prairie Aviation", type: "Public" },
  { code: "KDLH", name: "Duluth International Airport", city: "Duluth, MN", state: "MN", runway: "10152 ft", fbo: "Cirrus Aviation Services", type: "Public" },
  { code: "KDPA", name: "DuPage Airport", city: "West Chicago, IL", state: "IL", runway: "7271 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDSM", name: "Des Moines International Airport", city: "Des Moines, IA", state: "IA", runway: "9003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KDTW", name: "Detroit Metropolitan Wayne County", city: "Detroit, MI", state: "MI", runway: "12003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KEAU", name: "Chippewa Valley Regional Airport", city: "Eau Claire, WI", state: "WI", runway: "8100 ft", fbo: "Wipaire", type: "Public" },
  { code: "KELN", name: "Lamoni Municipal Airport", city: "Lamoni, IA", state: "IA", runway: "5000 ft", fbo: "Self-service", type: "Public" },
  { code: "KEND", name: "Vance Brand Airport", city: "Longmont, CO", state: "CO", runway: "5000 ft", fbo: "Independence Aviation", type: "Public" },
  { code: "KEUG", name: "Mahlon Sweet Field", city: "Eugene, OR", state: "OR", runway: "8009 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KEVV", name: "Evansville Regional Airport", city: "Evansville, IN", state: "IN", runway: "8006 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFAR", name: "Hector International Airport", city: "Fargo, ND", state: "ND", runway: "9001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFAT", name: "Fresno Yosemite International Airport", city: "Fresno, CA", state: "CA", runway: "9232 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFLL", name: "Fort Lauderdale-Hollywood International", city: "Fort Lauderdale, FL", state: "FL", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFOE", name: "Topeka Regional Airport", city: "Topeka, KS", state: "KS", runway: "12802 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFSM", name: "Fort Smith Regional Airport", city: "Fort Smith, AR", state: "AR", runway: "8850 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KFTY", name: "Fulton County Airport", city: "Atlanta, GA", state: "GA", runway: "5000 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KFWA", name: "Fort Wayne International Airport", city: "Fort Wayne, IN", state: "IN", runway: "11802 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGEG", name: "Spokane International Airport", city: "Spokane, WA", state: "WA", runway: "11002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGFK", name: "Grand Forks International Airport", city: "Grand Forks, ND", state: "ND", runway: "8300 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGRB", name: "Austin Straubel International Airport", city: "Green Bay, WI", state: "WI", runway: "8700 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGRR", name: "Gerald R. Ford International Airport", city: "Grand Rapids, MI", state: "MI", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KGSP", name: "Greenville-Spartanburg International", city: "Greer, SC", state: "SC", runway: "11001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KHPN", name: "Westchester County Airport", city: "White Plains, NY", state: "NY", runway: "6549 ft", fbo: "Million Air", type: "Public" },
  { code: "KHSV", name: "Huntsville International Airport", city: "Huntsville, AL", state: "AL", runway: "12600 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KICT", name: "Wichita Dwight D. Eisenhower National", city: "Wichita, KS", state: "KS", runway: "10301 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KILN", name: "Wilmington Airport", city: "Wilmington, DE", state: "DE", runway: "7300 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KINW", name: "Winslow-Lindbergh Regional Airport", city: "Winslow, AZ", state: "AZ", runway: "7000 ft", fbo: "Saber Aviation", type: "Public" },
  { code: "KJAC", name: "Jackson Hole Airport", city: "Jackson, WY", state: "WY", runway: "6300 ft", fbo: "Jackson Hole Aviation", type: "Public" },
  { code: "KJAN", name: "Jackson-Medgar Wiley Evers International", city: "Jackson, MS", state: "MS", runway: "9001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KJAX", name: "Jacksonville International Airport", city: "Jacksonville, FL", state: "FL", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLAN", name: "Capital Region International Airport", city: "Lansing, MI", state: "MI", runway: "8500 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLAX", name: "Los Angeles International", city: "Los Angeles, CA", state: "CA", runway: "12923 ft", fbo: "Atlantic Aviation, Signature Flight Support", type: "Public" },
  { code: "KLCK", name: "Rickenbacker International Airport", city: "Columbus, OH", state: "OH", runway: "12101 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLEX", name: "Blue Grass Airport", city: "Lexington, KY", state: "KY", runway: "7003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLGA", name: "LaGuardia Airport", city: "New York, NY", state: "NY", runway: "7003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLIT", name: "Bill and Hillary Clinton National Airport", city: "Little Rock, AR", state: "AR", runway: "8273 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KLNK", name: "Lincoln Airport", city: "Lincoln, NE", state: "NE", runway: "12901 ft", fbo: "Silverhawk Aviation", type: "Public" },
  { code: "KMBG", name: "Mobridge Municipal Airport", city: "Mobridge, SD", state: "SD", runway: "5200 ft", fbo: "Self-service", type: "Public" },
  { code: "KMCD", name: "Mackinac Island Airport", city: "Mackinac Island, MI", state: "MI", runway: "3500 ft", fbo: "Self-service", type: "Public" },
  { code: "KMCI", name: "Kansas City International Airport", city: "Kansas City, MO", state: "MO", runway: "10801 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMCO", name: "Orlando International Airport", city: "Orlando, FL", state: "FL", runway: "12005 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMDW", name: "Chicago Midway International", city: "Chicago, IL", state: "IL", runway: "6522 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KMEM", name: "Memphis International Airport", city: "Memphis, TN", state: "TN", runway: "11120 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMHT", name: "Manchester-Boston Regional Airport", city: "Manchester, NH", state: "NH", runway: "9250 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMKE", name: "Milwaukee Mitchell International Airport", city: "Milwaukee, WI", state: "WI", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMSY", name: "Louis Armstrong New Orleans International", city: "New Orleans, LA", state: "LA", runway: "10104 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KMWH", name: "Grant County International Airport", city: "Moses Lake, WA", state: "WA", runway: "13503 ft", fbo: "Columbia Pacific Aviation", type: "Public" },
  { code: "KOKC", name: "Will Rogers World Airport", city: "Oklahoma City, OK", state: "OK", runway: "10801 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KOMA", name: "Eppley Airfield", city: "Omaha, NE", state: "NE", runway: "9502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KOPF", name: "Miami-Opa Locka Executive", city: "Opa-locka, FL", state: "FL", runway: "8002 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KORL", name: "Orlando Executive Airport", city: "Orlando, FL", state: "FL", runway: "6004 ft", fbo: "Sheltair, Signature Flight Support", type: "Public" },
  { code: "KPDK", name: "DeKalb-Peachtree Airport", city: "Atlanta, GA", state: "GA", runway: "6001 ft", fbo: "Atlantic Aviation, Signature", type: "Public" },
  { code: "KPNS", name: "Pensacola International Airport", city: "Pensacola, FL", state: "FL", runway: "8502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KPWK", name: "Chicago Executive Airport", city: "Wheeling, IL", state: "IL", runway: "5001 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KRDU", name: "Raleigh-Durham International Airport", city: "Raleigh, NC", state: "NC", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KRIC", name: "Richmond International Airport", city: "Richmond, VA", state: "VA", runway: "9003 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KRNO", name: "Reno-Tahoe International Airport", city: "Reno, NV", state: "NV", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KROW", name: "Roswell International Air Center", city: "Roswell, NM", state: "NM", runway: "13123 ft", fbo: "Roswell Flight Services", type: "Public" },
  { code: "KRST", name: "Rochester International Airport", city: "Rochester, MN", state: "MN", runway: "9001 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSAT", name: "San Antonio International Airport", city: "San Antonio, TX", state: "TX", runway: "8502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSAN", name: "San Diego International Airport", city: "San Diego, CA", state: "CA", runway: "9401 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSAT", name: "San Antonio International Airport", city: "San Antonio, TX", state: "TX", runway: "8502 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSAW", name: "Sawyer International Airport", city: "Marquette, MI", state: "MI", runway: "12366 ft", fbo: "Sawyer Aviation", type: "Public" },
  { code: "KSJC", name: "Norman Y. Mineta San José International", city: "San Jose, CA", state: "CA", runway: "11000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSLC", name: "Salt Lake City International Airport", city: "Salt Lake City, UT", state: "UT", runway: "12000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KSLN", name: "Salina Regional Airport", city: "Salina, KS", state: "KS", runway: "12300 ft", fbo: "Sloane Aviation", type: "Public" },
  { code: "KSMO", name: "Santa Monica Airport", city: "Santa Monica, CA", state: "CA", runway: "4973 ft", fbo: "Atlantic Aviation", type: "Public" },
  { code: "KSNA", name: "John Wayne Airport", city: "Santa Ana, CA", state: "CA", runway: "5701 ft", fbo: "Atlantic Aviation, Clay Lacy Aviation", type: "Public" },
  { code: "KSTS", name: "Charles M. Schulz Sonoma County Airport", city: "Santa Rosa, CA", state: "CA", runway: "6000 ft", fbo: "Sonoma Jet Center", type: "Public" },
  { code: "KTEB", name: "Teterboro Airport", city: "Teterboro, NJ", state: "NJ", runway: "7000 ft", fbo: "Atlantic Aviation, Signature Flight Support, Jet Aviation", type: "Public" },
  { code: "KTOL", name: "Toledo Express Airport", city: "Toledo, OH", state: "OH", runway: "10599 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTTS", name: "NASA Shuttle Landing Facility", city: "Titusville, FL", state: "FL", runway: "15000 ft", fbo: "NASA", type: "Government" },
  { code: "KTUL", name: "Tulsa International Airport", city: "Tulsa, OK", state: "OK", runway: "10000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTUS", name: "Tucson International Airport", city: "Tucson, AZ", state: "AZ", runway: "10996 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KTYS", name: "McGhee Tyson Airport", city: "Knoxville, TN", state: "TN", runway: "9000 ft", fbo: "Signature Flight Support", type: "Public" },
  { code: "KVAN", name: "Van Nuys Airport", city: "Van Nuys, CA", state: "CA", runway: "8001 ft", fbo: "Atlantic Aviation, Clay Lacy Aviation", type: "Public" },
  { code: "KBHB", name: "Hancock County-Bar Harbor Airport", city: "Bar Harbor, ME", state: "ME", runway: "5200 ft", fbo: "Bar Harbor Aviation", type: "Public" },
  { code: "KHOU", name: "William P. Hobby Airport", city: "Houston, TX", state: "TX", runway: "7602 ft", fbo: "Atlantic Aviation, Signature Flight Support", type: "Public" }
];

// Combine commercial airports with private airports
const AIRPORTS = [...COMMERCIAL_AIRPORTS, ...PRIVATE_AIRPORTS];

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  label?: string;
}

export function AirportSearch({ value, onChange, placeholder = "Search by city or airport code", label }: AirportSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredAirports = AIRPORTS.filter(airport =>
    airport.code.toLowerCase().includes(query.toLowerCase()) ||
    airport.name.toLowerCase().includes(query.toLowerCase()) ||
    airport.city.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery(airport.code);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(newQuery.length > 0);
    
    if (newQuery === "") {
      onChange(null);
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length > 0)}
          placeholder={placeholder}
          className="pl-10 bg-card shadow-card-custom"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              onChange(null);
              setQuery("");
              setIsOpen(false);
            }}
          >
            ×
          </Button>
        )}
      </div>

      {isOpen && filteredAirports.length > 0 && (
        <Card className="absolute top-full z-50 mt-2 w-full shadow-aviation">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {filteredAirports.map((airport) => (
                <div
                  key={airport.code}
                  className="flex cursor-pointer items-center gap-3 border-b border-border p-4 hover:bg-secondary transition-colors"
                  onClick={() => handleSelect(airport)}
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{airport.code}</span>
                      <Badge 
                        variant={airport.type === "Public" ? "secondary" : airport.type === "Private" ? "outline" : "destructive"}
                        className="text-xs"
                      >
                        {airport.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm font-medium">{airport.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{airport.city}</div>
                    <div className="text-xs text-accent">
                      Runway: {airport.runway} • FBO: {airport.fbo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}