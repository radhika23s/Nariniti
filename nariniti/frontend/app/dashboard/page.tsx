'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthGuard from '@/components/auth/AuthGuard';
import { Lightbulb, FileText, Users, LogOut, Settings, User, ArrowRight, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  ideas_saved: number;
  schemes_matched: number;
  mentors_connected: number;
  recent_activity: { type: string; text: string; date: string; id: number }[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('/api/ideas/dashboard-stats', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.firstName}!</h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your business today.</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/ideas" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Lightbulb size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500">Ideas Saved</h3>
                {loadingStats ? <LoadingSpinner size="sm" /> : (
                  <p className="text-3xl font-bold text-slate-900">{stats?.ideas_saved ?? 0}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-violet-600 font-medium">
              <span>Analyze a new idea</span><ArrowRight size={12} />
            </div>
          </Link>

          <Link href="/schemes" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500">Schemes Matched</h3>
                {loadingStats ? <LoadingSpinner size="sm" /> : (
                  <p className="text-3xl font-bold text-slate-900">{stats?.schemes_matched ?? 0}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span>Browse schemes</span><ArrowRight size={12} />
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500">Mentors Found</h3>
                {loadingStats ? <LoadingSpinner size="sm" /> : (
                  <p className="text-3xl font-bold text-slate-900">{stats?.mentors_connected ?? 0}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400">From your analyzed ideas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
              {loadingStats ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : stats?.recent_activity?.length ? (
                <div className="space-y-3">
                  {stats.recent_activity.map((a, i) => (
                    <Link href={`/ideas`} key={i}
                      className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-colors">
                      <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center shrink-0">
                        <Lightbulb size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{a.text}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />{timeAgo(a.date)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Lightbulb size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-medium">No activity yet</p>
                  <Link href="/ideas" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
                    <Lightbulb size={15} /> Analyze Your First Idea
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links + Profile */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Links</h2>
              <div className="space-y-2">
                <Link href="/ideas" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-violet-50 text-left transition-colors border border-transparent hover:border-violet-200">
                  <div className="flex items-center gap-3"><Lightbulb size={18} className="text-violet-500" /><span className="font-medium text-slate-700">My Ideas</span></div>
                  <ArrowRight size={15} className="text-slate-400" />
                </Link>
                <Link href="/schemes" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-green-50 text-left transition-colors border border-transparent hover:border-green-200">
                  <div className="flex items-center gap-3"><FileText size={18} className="text-green-500" /><span className="font-medium text-slate-700">Schemes</span></div>
                  <ArrowRight size={15} className="text-slate-400" />
                </Link>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-3"><User size={18} className="text-slate-500" /><span className="font-medium text-slate-700">My Profile</span></div>
                  <ArrowRight size={15} className="text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-3"><Settings size={18} className="text-slate-500" /><span className="font-medium text-slate-700">Settings</span></div>
                  <ArrowRight size={15} className="text-slate-400" />
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800 truncate ml-2">{user?.email || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{user?.phone || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
