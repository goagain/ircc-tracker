export interface User {
  email: string;
  role: UserRole;
  exp?: number;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
} 