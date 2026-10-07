'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PasswordStrength from '@/components/ui/PasswordStrength';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'bn', label: 'Bengali' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'or', label: 'Odia' },
  { code: 'as', label: 'Assamese' },
  { code: 'ur', label: 'Urdu' },
];

const STATES = [
  { code: 'AP', label: 'Andhra Pradesh' },
  { code: 'AR', label: 'Arunachal Pradesh' },
  { code: 'AS', label: 'Assam' },
  { code: 'BR', label: 'Bihar' },
  { code: 'CG', label: 'Chhattisgarh' },
  { code: 'GA', label: 'Goa' },
  { code: 'GJ', label: 'Gujarat' },
  { code: 'HR', label: 'Haryana' },
  { code: 'HP', label: 'Himachal Pradesh' },
  { code: 'JH', label: 'Jharkhand' },
  { code: 'KA', label: 'Karnataka' },
  { code: 'KL', label: 'Kerala' },
  { code: 'MP', label: 'Madhya Pradesh' },
  { code: 'MH', label: 'Maharashtra' },
  { code: 'MN', label: 'Manipur' },
  { code: 'ML', label: 'Meghalaya' },
  { code: 'MZ', label: 'Mizoram' },
  { code: 'NL', label: 'Nagaland' },
  { code: 'OR', label: 'Odisha' },
  { code: 'PB', label: 'Punjab' },
  { code: 'RJ', label: 'Rajasthan' },
  { code: 'SK', label: 'Sikkim' },
  { code: 'TN', label: 'Tamil Nadu' },
  { code: 'TG', label: 'Telangana' },
  { code: 'TR', label: 'Tripura' },
  { code: 'UP', label: 'Uttar Pradesh' },
  { code: 'UK', label: 'Uttarakhand' },
  { code: 'WB', label: 'West Bengal' },
  { code: 'AN', label: 'Andaman and Nicobar Islands' },
  { code: 'CH', label: 'Chandigarh' },
  { code: 'DL', label: 'Delhi' },
  { code: 'JK', label: 'Jammu and Kashmir' },
  { code: 'LA', label: 'Ladakh' },
  { code: 'LD', label: 'Lakshadweep' },
  { code: 'PY', label: 'Puducherry' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',           // ← matches Django field name
    email: '',
    preferred_language: 'en',   // ← language code
    state: 'MH',                // ← state code
    password: '',
    confirm_password: '',       // ← matches Django field name
    accept_terms: false,        // ← matches Django field name
    receive_updates: false,     // ← fully wired
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.accept_terms) {
      setError('You must agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);   // send everything — Django ignores confirm_password internally
      router.push('/login?registered=true');
    } catch (err: any) {
      const errData = err?.data || {};
      // Show the first validation error from Django
      const firstKey = Object.keys(errData)[0];
      const firstMsg = firstKey
        ? (Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey])
        : err?.message || 'Registration failed. Please try again.';
      setError(String(firstMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 flex justify-center bg-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-violet-600 text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-md">
              N
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 mt-1 text-sm">Join thousands of women entrepreneurs on Nariniti</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name *</label>
                <input
                  type="text" name="first_name" required autoComplete="given-name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="Priya"
                  value={formData.first_name} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name *</label>
                <input
                  type="text" name="last_name" required autoComplete="family-name"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="Deshpande"
                  value={formData.last_name} onChange={handleChange}
                />
              </div>
            </div>

            {/* Contact row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                <input
                  type="tel" name="phone" required autoComplete="tel"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="9876543210"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="email" name="email" autoComplete="email"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                  placeholder="you@example.com"
                  value={formData.email} onChange={handleChange}
                />
              </div>
            </div>

            {/* Language & State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Language</label>
                <select
                  name="preferred_language"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm bg-white"
                  value={formData.preferred_language} onChange={handleChange}
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                <select
                  name="state"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm bg-white"
                  value={formData.state} onChange={handleChange}
                >
                  {STATES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" required autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm pr-11"
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                  />
                  <button
                    type="button" aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrength password={formData.password} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'} name="confirm_password" required autoComplete="new-password"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm pr-11"
                    placeholder="••••••••"
                    value={formData.confirm_password} onChange={handleChange}
                  />
                  <button
                    type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox" name="accept_terms"
                  className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 shrink-0"
                  checked={formData.accept_terms} onChange={handleChange}
                />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <Link href="#" className="text-violet-600 hover:underline font-medium">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="#" className="text-violet-600 hover:underline font-medium">Privacy Policy</Link>
                  {' '}<span className="text-red-500">*</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox" name="receive_updates"
                  className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 shrink-0"
                  checked={formData.receive_updates} onChange={handleChange}
                />
                <span className="text-sm text-slate-600">Receive product updates and announcements</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-700 font-semibold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
