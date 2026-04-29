
export enum Tab {
  Profile = 'Profile',
  Menu = 'Menu',
  Offer = 'Offer',
  Admin = 'Admin',
  Emergency = 'Emergency',
  WavePayment = 'WavePayment',
  Map = 'Map',
  Payment = 'Payment',
  Notifications = 'Notifications',
  UserChat = 'UserChat'
}

export interface User {
  id?: string;
  userId?: string; // Firebase Auth UID
  name: string;
  city: string;
  phone: string;
  role?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  status?: 'active' | 'pending' | 'blocked';
  activeSessionId?: string;
  pin?: string; // 4-digit PIN
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
}

export interface Worker {
  id: string;
  name: string;
  profileImageUrl: string;
  phone: string;
  rating: number;
  description: string;
  category: string;
  isVerified?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface PersonalRequest {
  id: string;
  type: 'Location' | 'Travailleur';
  title: string;
  name: string;
  city: string;
  phone: string;
  description: string;
  interventionPlace?: string; // Specific to Location
  rawAnswers?: Record<string, string | null>;
  totalPrice?: number;
}

export interface FavoriteRequest {
  id: string;
  title: string;
  date: string; // ISO string
  formType: 'worker' | 'location' | 'personal_worker' | 'personal_location' | 'night_service' | 'rapid_building_service';
  answers: Record<string, string | null>;
  userInfo: User;
  totalPrice?: number;
}
