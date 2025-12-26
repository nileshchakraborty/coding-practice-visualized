/**
 * SignInGate - Component that requires user to sign in before viewing content
 * Used to gate premium features like viewing solutions
 */
import { Lock, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface SignInGateProps {
    feature: string;
    description?: string;
    children: React.ReactNode;
}

export function SignInGate({ feature, description, children }: SignInGateProps) {
    const { isAuthenticated, login, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-purple-400" />
                </div>

                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Sign In Required
                </h3>

                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                    {description || `Sign in to access ${feature} and track your progress.`}
                </p>

                <button
                    onClick={() => login()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5"
                >
                    <LogIn size={18} />
                    Sign in with Google
                </button>

                <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                    Free • No credit card required
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
