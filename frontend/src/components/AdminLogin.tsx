/**
 * Admin Login Component
 * 
 * Supports both production (Google OAuth + TOTP) and local (JWE token) authentication.
 */

import { useState, useEffect, useCallback } from 'react';
import { Shield, Key, AlertCircle, Terminal, CheckCircle, Loader2, Smartphone, Mail, RefreshCw } from 'lucide-react';

interface AdminLoginProps {
    onLogin: (token: string) => void;
    googleToken?: string | null;
    googleEmail?: string | null;
    login?: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

// Auth step constants to avoid duplicate string literals
const AUTH_STEPS = {
    CHECKING: 'checking',
    GOOGLE: 'google',
    TOTP_SETUP: 'totp-setup',
    TOTP_VERIFY: 'totp-verify',
    LOCAL: 'local',
} as const;

type AuthStep = typeof AUTH_STEPS[keyof typeof AUTH_STEPS];

// eslint-disable-next-line complexity, max-lines-per-function
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, googleToken, googleEmail, login }) => {
    const [step, setStep] = useState<AuthStep>(AUTH_STEPS.CHECKING);
    const [adminToken, setAdminToken] = useState('');
    const [jweToken, setJweToken] = useState('');
    const [googleId, setGoogleId] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [totpSecret, setTotpSecret] = useState('');
    const [totpQrCode, setTotpQrCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLocalhost, setIsLocalhost] = useState(false);

    // Check environment on mount
    useEffect(() => {
        const local = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setIsLocalhost(local);

        const checkSession = async () => {
            const savedToken = sessionStorage.getItem('admin_token');
            if (savedToken) {
                try {
                    const res = await fetch(`${API_BASE}/api/admin/status`, {
                        headers: { 'Authorization': `Bearer ${savedToken}` }
                    });
                    const data = await res.json();
                    if (data.active && data.fullyAuthenticated) {
                        onLogin(savedToken);
                        return;
                    }
                    if (data.active && data.totpRequired) {
                        setAdminToken(savedToken);
                        setStep(AUTH_STEPS.TOTP_VERIFY);
                        return;
                    }
                } catch {
                    // Session not valid
                }
                sessionStorage.removeItem('admin_token');
            }

            // Determine initial step
            if (local) {
                setStep(AUTH_STEPS.GOOGLE);
            } else if (googleToken) {
                // Signal that we should auto-authenticate (handled by separate effect)
                setStep(AUTH_STEPS.GOOGLE);
            } else {
                setStep(AUTH_STEPS.GOOGLE);
            }
        };

        checkSession();
    }, [onLogin, googleToken]);



    // Handle Google OAuth authentication for production
    const handleGoogleAuth = useCallback(async () => {
        if (!googleToken) {
            setError('Please sign in with Google first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${googleToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'EMAIL_NOT_ALLOWED') {
                    setError(`Your email (${googleEmail}) is not authorized for admin access.`);
                } else {
                    setError(data.error || 'Authentication failed');
                }
                setLoading(false);
                return;
            }

            setAdminToken(data.token);
            sessionStorage.setItem('admin_token', data.token);

            // Check if TOTP is required
            if (data.totpRequired) {
                if (!data.totpSetup) {
                    setStep(AUTH_STEPS.TOTP_SETUP);
                } else {
                    setStep(AUTH_STEPS.TOTP_VERIFY);
                }
            } else {
                // Localhost or TOTP not required
                setSuccess('Admin access granted!');
                setTimeout(() => onLogin(data.token), 500);
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    }, [googleToken, googleEmail, onLogin]);

    // Auto-trigger Google Auth if token is present
    useEffect(() => {
        if (googleToken && step === AUTH_STEPS.GOOGLE && !loading && !error && !adminToken) {
            handleGoogleAuth();
        }
    }, [googleToken, step, loading, error, adminToken, handleGoogleAuth]);

    // Setup TOTP
    const handleTotpSetup = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/totp/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to setup TOTP');
                setLoading(false);
                return;
            }

            setTotpSecret(data.secret);
            setTotpQrCode(data.qrCodeDataUrl);
            setStep(AUTH_STEPS.TOTP_VERIFY);
        } catch {
            setError('Failed to setup TOTP');
        } finally {
            setLoading(false);
        }
    };

    // Verify TOTP code
    const handleTotpVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!totpCode || totpCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/totp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ code: totpCode })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid code');
                setLoading(false);
                return;
            }

            setSuccess('TOTP verified! Access granted.');
            setTimeout(() => onLogin(adminToken), 500);
        } catch {
            setError('Failed to verify TOTP');
        } finally {
            setLoading(false);
        }
    };

    // Handle local JWE token activation
    const handleLocalActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!jweToken.trim() || !googleId.trim()) {
            setError('Please enter both token and Google ID');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/admin/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: jweToken.trim(), googleId: googleId.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Activation failed');
                setLoading(false);
                return;
            }

            setSuccess('Admin session activated!');
            sessionStorage.setItem('admin_token', data.token);

            setTimeout(() => {
                onLogin(data.token);
            }, 1000);
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (step === AUTH_STEPS.CHECKING) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
                    <p className="text-slate-400">
                        {step === AUTH_STEPS.GOOGLE && 'Sign in with your authorized Google account'}
                        {step === AUTH_STEPS.TOTP_SETUP && 'Set up two-factor authentication'}
                        {step === AUTH_STEPS.TOTP_VERIFY && 'Enter your authenticator code'}
                        {step === AUTH_STEPS.LOCAL && 'Enter your JWE token'}
                    </p>
                </div>

                {/* Error / Success */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

                {/* Google OAuth Step (Production) */}
                {step === AUTH_STEPS.GOOGLE && (
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4">
                        {googleToken ? (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
                                    <Mail className="text-purple-400" size={20} />
                                    <div>
                                        <p className="text-white text-sm">{googleEmail}</p>
                                        <p className="text-xs text-slate-500">Signed in with Google</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGoogleAuth}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
                                    ) : (
                                        <>Continue with Google</>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-slate-400 mb-4">Please sign in with Google to continue</p>
                                {login ? (
                                    <button
                                        onClick={() => login()}
                                        className="w-full bg-white hover:bg-slate-100 text-slate-900 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        Sign in with Google
                                    </button>
                                ) : (
                                    <a href="/" className="text-purple-400 hover:text-purple-300">Go to Home →</a>
                                )}
                            </div>
                        )}

                        {isLocalhost && (
                            <div className="pt-4 border-t border-slate-700">
                                <button
                                    onClick={() => setStep(AUTH_STEPS.LOCAL)}
                                    className="w-full text-sm text-slate-400 hover:text-white py-2"
                                >
                                    Use local JWE token instead
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TOTP Setup Step */}
                {step === AUTH_STEPS.TOTP_SETUP && (
                    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-slate-300 mb-4">
                            <Smartphone size={20} className="text-purple-400" />
                            <span className="font-medium">Setup Two-Factor Authentication</span>
                        </div>

                        {totpQrCode ? (
                            <>
                                <div className="flex justify-center">
                                    <img src={totpQrCode} alt="TOTP QR Code" className="w-48 h-48 rounded-lg" />
                                </div>
                                <p className="text-sm text-center text-slate-400">
                                    Scan with Microsoft Authenticator or any TOTP app
                                </p>
                                <div className="bg-slate-900 rounded-lg p-3">
                                    <p className="text-xs text-slate-500 mb-1">Manual entry code:</p>
                                    <p className="text-sm text-purple-400 font-mono break-all">{totpSecret}</p>
                                </div>
                                <button
                                    onClick={() => setStep(AUTH_STEPS.TOTP_VERIFY)}
                                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl"
                                >
                                    I've added it → Enter Code
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleTotpSetup}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <><Loader2 size={18} className="animate-spin" /> Generating...</>
                                ) : (
                                    <>Generate QR Code</>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* TOTP Verify Step */}
                {step === AUTH_STEPS.TOTP_VERIFY && (
                    <form onSubmit={handleTotpVerify} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-slate-300 mb-4">
                            <Key size={20} className="text-purple-400" />
                            <span className="font-medium">Enter Authentication Code</span>
                        </div>

                        <div>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                autoFocus
                                data-testid="totp-input"
                            />
                            <p className="text-xs text-slate-500 text-center mt-2">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || totpCode.length !== 6}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                            ) : (
                                'Verify & Login'
                            )}
                        </button>

                        {totpQrCode && (
                            <button
                                type="button"
                                onClick={() => setStep(AUTH_STEPS.TOTP_SETUP)}
                                className="w-full text-sm text-slate-400 hover:text-white py-2 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} /> Show QR Code Again
                            </button>
                        )}
                    </form>
                )}

                {/* Local JWE Token Step */}
                {step === AUTH_STEPS.LOCAL && (
                    <form onSubmit={handleLocalActivation} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Google ID
                            </label>
                            <input
                                type="text"
                                value={googleId}
                                onChange={(e) => setGoogleId(e.target.value)}
                                placeholder="Your Google account ID"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                JWE Token
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-slate-500" size={18} />
                                <textarea
                                    value={jweToken}
                                    onChange={(e) => setJweToken(e.target.value)}
                                    placeholder="Paste JWE token from grant-admin.ts script..."
                                    rows={3}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-xs resize-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Activating...</>
                            ) : (
                                'Activate Admin Session'
                            )}
                        </button>

                        {/* Instructions for local */}
                        <div className="mt-4 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-300 mb-3">
                                <Terminal size={16} />
                                <span className="text-sm font-medium">How to get a token</span>
                            </div>
                            <ol className="text-sm text-slate-400 space-y-2">
                                <li className="flex gap-2">
                                    <span className="text-purple-400 font-mono">1.</span>
                                    Sign in with Google on the main site
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-purple-400 font-mono">2.</span>
                                    Get your Google ID from localStorage
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-purple-400 font-mono">3.</span>
                                    Run: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-purple-300">npx tsx scripts/grant-admin.ts &lt;id&gt;</code>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-purple-400 font-mono">4.</span>
                                    Copy the JWE token and paste above
                                </li>
                            </ol>
                        </div>
                    </form>
                )}

                {/* Switch between modes */}
                {isLocalhost && step !== AUTH_STEPS.LOCAL && step !== AUTH_STEPS.TOTP_SETUP && step !== AUTH_STEPS.TOTP_VERIFY && (
                    <button
                        onClick={() => setStep(AUTH_STEPS.LOCAL)}
                        className="mt-4 w-full text-sm text-slate-500 hover:text-slate-300 py-2"
                    >
                        Switch to local JWE token
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;
