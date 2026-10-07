'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-600 text-white rounded flex items-center justify-center font-bold text-lg">
                N
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">Nariniti</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/ideas"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/ideas') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Ideas
                </Link>
                <Link
                  href="/schemes"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/schemes') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  Schemes
                </Link>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-sm font-medium text-slate-700">Hi, {user?.firstName}</span>
                  <button
                    onClick={() => logout()}
                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/ideas"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/ideas') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Ideas
                </Link>
                <Link
                  href="/schemes"
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/schemes') ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Schemes
                </Link>
                <div className="pt-4 mt-2 border-t border-slate-200">
                  <div className="px-3 mb-2">
                    <p className="text-sm font-medium text-slate-500">Signed in as</p>
                    <p className="text-base font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-violet-700 bg-violet-50 hover:bg-violet-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
