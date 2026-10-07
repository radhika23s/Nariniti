'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Inner component that uses useSearchParams (must be inside Suspense)
function LoginForm() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(identifier, password);
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
    } catch (err: any) {
      setError(
        err?.data?.detail ||
        err?.message ||
        'Invalid credentials. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Logo & heading */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-violet-600 text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-md">
              N
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your Nariniti account</p>
          </div>

          {/* Phone / Email toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            {(['phone', 'email'] as const).map((method) => (
              <button
                key={method}
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  authMethod === method
                    ? 'bg-white text-violet-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => { setAuthMethod(method); setIdentifier(''); setError(''); }}
              >
                {method === 'phone' ? 'Phone Number' : 'Email Address'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Identifier input */}
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                {authMethod === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              <input
                id="identifier"
                type={authMethod === 'phone' ? 'tel' : 'email'}
                required
                autoComplete={authMethod === 'phone' ? 'tel' : 'email'}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow text-sm"
                placeholder={authMethod === 'phone' ? '9876543210' : 'you@example.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow text-sm pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-slate-600">Remember me</span>
              </label>
              <Link href="#" className="text-violet-600 hover:text-violet-700 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-600 hover:text-violet-700 font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Page component wraps the form in Suspense (required for useSearchParams in Next.js 16)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
