import { User as FirebaseUser } from '@firebase/auth';

export interface User extends FirebaseUser {
  //isPro?: boolean;
  subscription?: {
    plan: string;
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Date;
  };
}

export interface Tool {
  id: string;
  path: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType;
  category: string;
  requiresPro?: boolean;
}
