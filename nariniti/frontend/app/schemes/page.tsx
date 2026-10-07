'use client';

import React, { useState } from 'react';
import { FileText, Search, ExternalLink, CheckCircle, Clock, IndianRupee } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

interface Scheme {
  id: number;
  name: string;
  ministry: string;
  description: string;
  benefit: string;
  eligibility: string;
  category: string;
  status: 'Active' | 'Accepting Applications' | 'Ongoing';
  link: string;
}

const SCHEMES: Scheme[] = [
  {
    id: 1,
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    ministry: 'Ministry of Finance',
    description: 'Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises. Specially beneficial for women entrepreneurs.',
    benefit: 'Collateral-free loans up to ₹10 lakh',
    eligibility: 'Women entrepreneurs with small/micro business',
    category: 'Finance',
    status: 'Active',
    link: 'https://www.mudra.org.in',
  },
  {
    id: 2,
    name: 'Stand-Up India Scheme',
    ministry: 'Ministry of Finance',
    description: 'Facilitates bank loans between ₹10 lakh and ₹1 crore to SC/ST and women borrowers for setting up greenfield enterprises.',
    benefit: 'Bank loans ₹10 lakh – ₹1 crore',
    eligibility: 'Women above 18 years for greenfield projects',
    category: 'Finance',
    status: 'Active',
    link: 'https://www.standupmitra.in',
  },
  {
    id: 3,
    name: 'Mahila Udyam Nidhi Scheme',
    ministry: 'Small Industries Development Bank (SIDBI)',
    description: 'Provides soft loans to women entrepreneurs for starting new ventures or expanding existing ones in the small-scale sector.',
    benefit: 'Soft loans up to ₹10 lakh at reduced interest',
    eligibility: 'Women-owned small-scale industries',
    category: 'Finance',
    status: 'Active',
    link: 'https://www.sidbi.in',
  },
  {
    id: 4,
    name: 'Startup India Initiative',
    ministry: 'Ministry of Commerce & Industry',
    description: 'Government initiative to build a strong ecosystem for nurturing innovation and startups in India. Special relaxations for women-led startups.',
    benefit: 'Tax exemptions, funding support, mentorship',
    eligibility: 'Startups up to 10 years old, turnover < ₹100 crore',
    category: 'Startup',
    status: 'Active',
    link: 'https://www.startupindia.gov.in',
  },
  {
    id: 5,
    name: 'Annapurna Scheme',
    ministry: 'State Bank of India / Banks',
    description: 'Designed specifically for women who want to set up food catering units. Provides loans for purchasing kitchen equipment.',
    benefit: 'Loan up to ₹50,000 for kitchen equipment',
    eligibility: 'Women in food catering business',
    category: 'Food & Agriculture',
    status: 'Active',
    link: 'https://sbi.co.in',
  },
  {
    id: 6,
    name: 'TREAD Scheme (Trade Related Entrepreneurship)',
    ministry: 'Ministry of MSME',
    description: 'Provides credit, training, and counselling to women below the poverty line for trade and service sector activities.',
    benefit: 'Government grant up to 30% of total project cost',
    eligibility: 'Women below poverty line through NGOs',
    category: 'Trade & Services',
    status: 'Active',
    link: 'https://msme.gov.in',
  },
  {
    id: 7,
    name: 'PM Vishwakarma Scheme',
    ministry: 'Ministry of MSME',
    description: 'Support for artisans and craftspeople with tools, training, and credit. Includes women artisans in traditional crafts.',
    benefit: 'Toolkit of ₹15,000 + credit up to ₹3 lakh + training',
    eligibility: 'Traditional craft workers, artisans',
    category: 'Crafts',
    status: 'Accepting Applications',
    link: 'https://pmvishwakarma.gov.in',
  },
  {
    id: 8,
    name: 'Deen Dayal Antyodaya Yojana – NRLM',
    ministry: 'Ministry of Rural Development',
    description: 'Supports Self-Help Groups (SHGs) of rural women with credit linkages, livelihood support, and skill training.',
    benefit: 'SHG credit linkage, skill development, market access',
    eligibility: 'Rural women, SHG members',
    category: 'Rural Development',
    status: 'Ongoing',
    link: 'https://aajeevika.gov.in',
  },
];

const CATEGORIES = ['All', 'Finance', 'Startup', 'Food & Agriculture', 'Trade & Services', 'Crafts', 'Rural Development'];
const STATUSES = ['All', 'Active', 'Accepting Applications', 'Ongoing'];

const statusColor = {
  'Active': 'bg-green-100 text-green-700',
  'Accepting Applications': 'bg-blue-100 text-blue-700',
  'Ongoing': 'bg-violet-100 text-violet-700',
};

export default function SchemesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  const filtered = SCHEMES.filter(scheme => {
    const matchesSearch =
      scheme.name.toLowerCase().includes(search.toLowerCase()) ||
      scheme.description.toLowerCase().includes(search.toLowerCase()) ||
      scheme.ministry.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || scheme.category === category;
    const matchesStatus = status === 'All' || scheme.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <FileText size={22} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Government Schemes</h1>
          </div>
          <p className="text-slate-500">Discover central and state government schemes designed to empower women entrepreneurs.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search schemes or ministries..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <p className="text-sm text-slate-500 mb-4">{filtered.length} scheme{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Schemes List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No schemes match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search or category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(scheme => (
              <div key={scheme.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{scheme.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[scheme.status]}`}>
                        {scheme.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{scheme.ministry}</p>
                    <p className="text-sm text-slate-600 mb-4">{scheme.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <IndianRupee size={15} className="text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Benefit</p>
                          <p className="text-slate-700">{scheme.benefit}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle size={15} className="text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Eligibility</p>
                          <p className="text-slate-700">{scheme.eligibility}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{scheme.category}</span>
                    <a
                      href={scheme.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Apply Now <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Scheme details are for informational purposes. Always verify current eligibility criteria and application status on the official government portal before applying.
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
