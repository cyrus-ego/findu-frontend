export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'vip' | 'admin';
  isEmailVerified: boolean;
}
