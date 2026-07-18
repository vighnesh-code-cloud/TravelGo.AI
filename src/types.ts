export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TravelParams {
  destination?: string;
  budget?: string; // in ₹ INR
  duration?: number; // number of days
  travelers?: number; // number of people
  experience?: string[]; // array of experience tags
}

export interface DestinationSuggestion {
  name: string;
  description: string;
  reason: string;
  matchingScore: number; // e.g. 95 for 95%
}

export interface DayItinerary {
  day: number;
  title: string;
  morning: {
    activity: string;
    attraction: string;
    food: string;
  };
  afternoon: {
    activity: string;
    attraction: string;
    food: string;
  };
  evening: {
    activity: string;
    attraction: string;
    food: string;
  };
  dailyExpense: number; // in ₹ INR
}

export interface BudgetBreakdown {
  transport: number;
  hotel: number;
  food: number;
  activities: number;
  shopping: number;
  emergency: number;
  totalBudget: number;
  estimatedCost: number;
  remainingBudget: number;
}

export interface PackingItem {
  id: string;
  name: string;
  packed: boolean;
}

export interface PackingCategory {
  category: string;
  items: PackingItem[];
}

export interface Restaurant {
  name: string;
  cuisine: string;
  priceRange: string; // e.g. "Low", "Medium", "High"
  mustTry: string;
}

export interface FoodItem {
  name: string;
  description: string;
}

export interface HiddenGem {
  name: string;
  description: string;
}

export interface TravelPlan {
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  experience: string[];
  destinations: DestinationSuggestion[];
  itinerary: DayItinerary[];
  budgetBreakdown: BudgetBreakdown;
  packingList: PackingCategory[];
  hiddenGems: HiddenGem[];
  restaurants: Restaurant[];
  mustTryFoods: FoodItem[];
  safetyTips: string[];
  scamsToAvoid: string[];
  transportationTips: string[];
  weatherAdvice: string;
  bestVisitingHours: string;
  moneySavingTips: string[];
}

export interface SavedTrip {
  id: string;
  plan: TravelPlan;
  createdAt: string;
}
