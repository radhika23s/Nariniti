import Link from 'next/link';
import { Lightbulb, FileText, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-violet-600 text-white py-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Empowering Women Entrepreneurs Across India
          </h1>
          <p className="text-xl sm:text-2xl mb-10 text-violet-100">
            Nariniti is your platform to find business ideas, access government schemes, and connect with mentors to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-violet-700 rounded-md font-semibold text-lg hover:bg-violet-50 transition-colors shadow-lg"
            >
              Get Started for Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-violet-700 text-white rounded-md font-semibold text-lg border border-violet-500 hover:bg-violet-800 transition-colors shadow-lg"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 sm:px-12 lg:px-24 bg-slate-50 flex-grow">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How Nariniti Helps You</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4 text-violet-600">
                <Lightbulb size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800">Business Ideas</h3>
              <p className="text-slate-600">Discover low-investment, high-return business ideas tailored for you.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4 text-violet-600">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800">Government Schemes</h3>
              <p className="text-slate-600">Find and apply for government schemes and loans to fund your dreams.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4 text-violet-600">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800">Connect with Mentors</h3>
              <p className="text-slate-600">Get guidance from experienced mentors who have walked the path before.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4 text-violet-600">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-800">Grow Your Business</h3>
              <p className="text-slate-600">Access resources and training to scale your business to new heights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 text-center">
        <p>© {new Date().getFullYear()} Nariniti. Empowering Women Entrepreneurs.</p>
        <p className="text-sm text-slate-500 mt-2">Built by Vaishnavi Hole</p>
      </footer>
    </div>
  );
}
