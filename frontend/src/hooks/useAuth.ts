/**
 * Auth Hook
 * Separated from AuthContext.tsx to support Fast Refresh
 */
import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '../context/AuthContextDefinition';

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
