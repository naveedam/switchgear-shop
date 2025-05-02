
export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt?: Date;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyName?: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
