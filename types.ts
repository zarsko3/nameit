
export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL',
  UNISEX = 'UNISEX'
}

// Name style categories
export enum NameStyle {
  MODERN = 'MODERN',           // מודרני
  CLASSIC = 'CLASSIC',         // קלאסי/מסורתי
  INTERNATIONAL = 'INTERNATIONAL', // בינלאומי
  UNIQUE = 'UNIQUE'            // ייחודי/נדיר
}

export interface BabyName {
  id: string;
  hebrew: string;
  transliteration: string;
  meaning: string;
  gender: Gender;
  popularity?: number;
  style?: NameStyle[];  // Name can have multiple styles
  isTrending?: boolean; // Is this name trending right now?
}

export interface UserProfile {
  id: string;
  name: string;
  roomId: string; // The shared code
  isPartnerConnected: boolean;
  genderPreference: Gender[];
  // User preferences
  expectedGender: Gender | null;  // Expected baby gender (Boy/Girl/Unknown)
  nameStyles: NameStyle[];        // Preferred name styles
  showTrendingOnly: boolean;      // Filter to show only trending names
  // Exclusion lists
  blacklist: string[];            // Names to never show (שמות ברשימה שחורה)
  familyNames: string[];          // Existing family names to exclude (שמות משפחה)
}

export interface SwipeRecord {
  nameId: string;
  liked: boolean;
  userId: string;
  roomId: string; // Swipes are now room-bound
  timestamp: number;
}

export interface Match {
  nameId: string;
  timestamp: number;
  rating: number; // 1-5 stars
}

export interface FilterConfig {
  genders: Gender[];
  minLength: number;
  maxLength: number;
  startingLetter: string;
  nameStyles: NameStyle[];     // Filter by name styles
  showTrendingOnly: boolean;   // Show only trending names
}

export type AppView = 'ONBOARDING' | 'SWIPE' | 'MATCHES' | 'SETTINGS';
