import { Types } from 'mongoose'; // Import Types for ObjectId references

// Store Item Types
export enum StoreItemCategory {
  REDEEM_CODE = 'Redeem Codes',
  DIGITAL_REWARD = 'Digital Rewards',
}

export interface StoreItemMetadata {
  redeemCode?: string;
  voucherInfo?: {
    provider: string;
    code: string;
    instructions: string;
  };
  expiryDate?: Date;
  redeemCodes?: string[];
  badgeIds?: string[];
  rewardIds?: string[];
}

export interface StoreItem {
  _id: string;
  name: string;
  description: string;
  category: StoreItemCategory;
  coinCost: number;
  imageUrl?: string;
  redeemCode?: string;
  rewardDetails?: string;
  inventory?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Status for items in user inventory or store listings
export enum StoreItemStatus {
  ACTIVE = 'Active', // Available for use or in store
  USED = 'Used', // Item has been consumed/used
  EXPIRED = 'Expired', // Item has expired
  DRAFT = 'Draft', // Item is not yet published/visible in store
  ARCHIVED = 'Archived' // Item is no longer available but kept for records
}

// Order Types
export enum OrderStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled',
}

export interface OrderItem {
  storeItemId: string;
  name: string;
  category: string;
  coinCost: number;
  quantity: number;
  revealedRedeemCode?: string;
  revealedRewardDetails?: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalCoinCost: number;
  status: OrderStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface CartItem {
  itemId: string;
  quantity: number;
}

// Form Types
export interface StoreItemFormData {
  _id?: string;
  name: string;
  description: string;
  category: StoreItemCategory;
  coinCost: number | '';
  imageUrl?: string;
  redeemCode?: string;
  rewardDetails?: string;
  inventory?: number | null | '';
  isActive: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 