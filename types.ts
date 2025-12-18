
export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL',
  UNISEX = 'UNISEX'
}

export interface BabyName {
  id: string;
  hebrew: string;
  transliteration: string;
  meaning: string;
  gender: Gender;
  popularity?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  roomId: string; // The shared code
  isPartnerConnected: boolean;
  genderPreference: Gender[];
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
}

export type AppView = 'ONBOARDING' | 'SWIPE' | 'MATCHES' | 'SETTINGS';
