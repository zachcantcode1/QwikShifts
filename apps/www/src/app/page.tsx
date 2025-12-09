import Link from "next/link";
import { CheckCircle, Calendar, Users, BarChart3, Shield, Zap, ArrowRight, Menu } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white/20 selection:text-white">

      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-zinc-950 font-bold">Q</div>
            QwikShifts
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="https://github.com/zachcantcode1/qwikshifts" className="hover:text-white transition-colors">Open Source</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`${APP_URL}/login`} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href={`${APP_URL}/signup`}
              className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-white rounded-full hover:bg-zinc-200 transition-colors"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Subtle Gradient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 mb-8 hover:bg-white/10 transition-colors cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            v1.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8">
            Scheduling for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50"> modern teams.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            QwikShifts is the open-source platform for managing employee schedules, time off, and payroll.
            No complex spreadsheets. Just clean, fast software.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`${APP_URL}/signup`}
              className="px-8 py-4 text-base font-semibold text-zinc-950 bg-white rounded-full hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`${APP_URL}/login`} // In production this would point to the app
              className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Image / Dashboard Preview */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto rounded-xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl">
          <div className="rounded-lg bg-zinc-950 aspect-[16/9] flex items-center justify-center border border-white/5 overflow-hidden relative">
            {/* Abstract Representation of UI */}
            <div className="absolute inset-0 bg-zinc-900/20"></div>
            <div className="grid grid-cols-4 gap-4 p-8 w-full h-full opacity-50">
              <div className="col-span-1 bg-zinc-900 rounded-lg h-full border border-white/5"></div>
              <div className="col-span-3 grid grid-rows-3 gap-4">
                <div className="bg-zinc-900 rounded-lg h-full border border-white/5"></div>
                <div className="bg-zinc-900 rounded-lg h-full border border-white/5"></div>
                <div className="bg-zinc-900 rounded-lg h-full border border-white/5"></div>
              </div>
            </div>
            <div className="absolute font-mono text-zinc-500 text-sm">Dashboard Preview</div>
          </div>
        </div>
      </section>

      {/* Features Grid ("Bento Scale") */}
      <section id="features" className="px-6 py-24 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need.</h2>
            <p className="text-zinc-400 text-lg max-w-xl">Powerful features for the enterprise, accessible to everyone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group md:col-span-2 p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Scheduling</h3>
              <p className="text-zinc-400">Drag-and-drop shifts with automatic conflict detection. We handle the constraints so you don't have to.</p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Staff Portal</h3>
              <p className="text-zinc-400">Employees can view shifts and request time off from any device.</p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-zinc-400">Role-based access control, audit logs, and secure authentication built-in.</p>
            </div>

            {/* Card 4 */}
            <div className="group md:col-span-2 p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Sync</h3>
              <p className="text-zinc-400">Changes deploy instantly. Powered by Supabase Realtime for instant updates across all connected devices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs font-bold">Q</div>
            <span className="text-zinc-500 text-sm">© 2025 QwikShifts Inc.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
