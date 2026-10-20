// Shared TypeScript interfaces mirroring the backend's JSON responses.
// Keeping these in one place makes it obvious what the API contract is.

export type TravelMode = 'flights' | 'trains' | 'buses' | 'cruises' | 'hotels';

export interface TravelSearchParams {
  mode: TravelMode;
  origin?: string;
  destination: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
}

export interface TravelOption {
  id: string;
  provider: string;
  carrier: string;
  from: string;
  to: string;
  departTime?: string;
  arriveTime?: string;
  duration?: string;
  stops?: number;
  price: number;
  currency: string;
  notes?: string;
}

export interface TravelSearchResponse {
  mode: TravelMode;
  demoMode: boolean;
  count: number;
  results: TravelOption[];
}

export interface HotSuggestion {
  id: string;
  title: string;
  subtitle: string;
  mythologyTie: string;
  image: string;
}

export interface PlaceSuggestion {
  name: string;
  country: string;
}

export interface WeatherData {
  city: string;
  country?: string;
  tempC: number;
  description: string;
  humidity: number;
  windKph: number;
  deity: string;
  demoMode: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

export interface ItineraryPlan {
  destination: string;
  days: ItineraryDay[];
  summary: string;
  demoMode: boolean;
}

export interface GameStatus {
  gamePlayed: boolean;
  score: number | null;
  discountCode: string | null;
  discountPercent: number | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  gamePlayed: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
