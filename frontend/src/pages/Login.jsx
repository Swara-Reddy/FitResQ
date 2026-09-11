import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Clock,
  ReceiptText,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FitResQLogo from '../components/common/FitResQLogo';
import Button from '../components/common/Button';

export const Login = () => {
  const { login, signup, isLoading, isCallback, authError, isAuthenticated, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated with a genuine Cognito session, redirect to destination or /dashboard
  const destination = location.state?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, destination]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)] flex flex-col justify-between transition-colors duration-200 selection:bg-brand-500 selection:text-white">
      {/* Top Brand Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <FitResQLogo size="md" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Cognito Secure Gateway</span>
        </div>
      </header>

      {/* Main Login Presentation Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-250">
          
          {/* Card Surface */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-10 shadow-xl space-y-6">
            
            {/* Active Callback / Exchanging Code State */}
            {isCallback ? (
              <div className="text-center space-y-6 py-6 animate-in fade-in duration-300">
                <div className="inline-block animate-pulse">
                  <FitResQLogo size="lg" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Signing you in...
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Exchanging authorization code and establishing your encrypted AWS Cognito session.
                  </p>
                </div>
                <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 rounded-full animate-indeterminate" />
                </div>
              </div>
            ) : (
              <>
                {/* Header / Intro */}
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs border border-brand-100 dark:border-brand-900/60">
                    <Lock className="w-6 h-6" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Welcome to FitResQ
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Support that actually resolves. Sign in to access your cases, refund ledger, and 24h SLA guarantees.
                    </p>
                  </div>
                </div>

                {/* Error Message if present */}
                {authError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="flex-1 leading-relaxed">
                        <span className="font-bold block text-rose-800 dark:text-rose-200">
                          Sign In Notice
                        </span>
                        <span>{authError}</span>
                      </div>
                    </div>
                    {authError.includes('redirect_mismatch') && (
                      <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-600 dark:text-rose-400 space-y-1">
                        <p className="font-semibold">AWS Console Configuration:</p>
                        <p>In Cognito User Pool <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">ap-south-1_7WbqGdro8</code> &gt; App Client <code className="bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded">FitResQWebApp</code>:</p>
                        <p>Add <code className="font-mono bg-rose-100 dark:bg-rose-900/60 px-1 py-0.5 rounded text-rose-900 dark:text-rose-100 font-bold">http://localhost:3000/login</code> to <strong>Allowed callback URLs</strong> and <strong>Allowed sign-out URLs</strong>.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary CTA Buttons to Cognito Managed Login & Signup */}
                <div className="space-y-3 pt-1">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={login}
                    disabled={isLoading}
                    className="w-full justify-center py-3.5 text-sm font-bold bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-md shadow-brand-500/20"
                    icon={ArrowRight}
                  >
                    {isLoading ? 'Connecting to Cognito...' : 'Sign In with FitResQ Account'}
                  </Button>

                  <button
                    type="button"
                    onClick={signup}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50/80 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 border border-brand-200/80 dark:border-brand-800/60 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-brand-500" />
                    <span>Create New Account (Hosted UI)</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                    Redirects to AWS Cognito Hosted UI with OAuth 2.0 PKCE.
                  </p>
                </div>

                {/* Core Platform Highlights */}
                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Strict 24h SLA resolution & supervisor escalation</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ReceiptText className="w-3.5 h-3.5" />
                    </div>
                    <span>Direct UPI & bank refund gateway verification</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>End-to-end encrypted session & customer privacy</span>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Test Account Helper */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              User Pool: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">ap-south-1_7WbqGdro8</span> | Region: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">ap-south-1</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Client ID: <span className="font-mono text-slate-600 dark:text-slate-400">7d8h6cnruek38rjv6dlp2ggt4k</span> | Scopes: <span className="font-mono text-slate-600 dark:text-slate-400">email openid phone</span>
            </p>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 dark:text-slate-600">
        © 2026 FitResQ Inc. All rights reserved. Support that actually resolves.
      </footer>
    </div>
  );
};

export default Login;
