import { createContext } from 'react';
import type { User } from '../utils/auth';

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => void;
    logout: () => void;
}

// Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
