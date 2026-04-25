'use client';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { StressRing } from '@/components/monitoring/StressRing';
import { Brain, Eye, Shield, Zap, Activity, Clock, TrendingUp, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: Eye, title: 'Eye Tracking', desc: 'MediaPipe FaceMesh detects blinks, gaze, and eye closure in real-time — no extra hardware.' },
  { icon: Brain, title: 'AI Scoring Engine', desc: 'A multi-factor stress algorithm weighs blink rate, gaze instability, session time, and eye closure.' },
  { icon: Zap, title: 'Live Feedback', desc: 'Your stress score updates every second. The dashboard reacts in real-time via WebSockets.' },
  { icon: Activity, title: 'Smart Interventions', desc: 'Context-aware prompts for breathing, movement, and breaks — delivered at the right moment.' },
  { icon: TrendingUp, title: 'Personalization', desc: 'The system learns your baseline and adjusts alert sensitivity based on your behaviour.' },
  { icon: Shield, title: 'Privacy First', desc: 'All processing happens locally in your browser. No video ever leaves your device.' },
];

const STEPS = [
  { step: '01', title: 'Open the Dashboard', desc: 'Sign up, open the dashboard, and click "Start Monitoring" to activate your webcam.' },
  { step: '02', title: 'AI Analyses Your Eyes', desc: 'MediaPipe tracks your face 30× per second and sends aggregated metrics to our AI engine every 1s.' },
  { step: '03', title: 'Get Real-Time Insights', desc: 'Your stress score, gaze patterns, and blink rate update live. Interventions appear when needed.' },
];

const STATS = [
  { value: '93%', label: 'Blink detection accuracy' },
  { value: '<1s', label: 'Feedback latency' },
  { value: '0 bytes', label: 'Video data sent to server' },
  { value: '5×', label: 'Productivity improvement' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06080f] text-white">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center dot-grid pt-24 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left */}
          <div className="fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Real-time cognitive monitoring
            </div>
            <h1 className="text-5xl lg:text-6xl font-black font-heading leading-[1.05] mb-6">
              Know Your Mind.{' '}
              <span className="gradient-text">Before It Breaks.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
              NeuroBalance AI passively monitors your cognitive stress & mental fatigue using your
              webcam. No wearables. No extra hardware. Just open the dashboard — we do the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth"
                id="hero-cta-btn"
                className="px-7 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-[#2d43ec] transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 text-center"
              >
                Start Free Monitoring →
              </Link>
              <Link
                href="#how-it-works"
                className="px-7 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-center"
              >
                How It Works
              </Link>
            </div>
            {/* Trust signals */}
            <div className="flex items-center gap-6 mt-8 text-xs text-white/30">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" />No account required to demo</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-green-400" />Runs 100% in browser</span>
            </div>
          </div>

          {/* Right — animated stress ring demo */}
          <div className="flex items-center justify-center fade-in-up-3">
            <div className="relative float">
              <div className="glass-card p-8 glow-pulse">
                <StressRing />
              </div>
              {/* Floating labels */}
              <div className="absolute -left-20 top-8 glass-card px-3 py-2 text-xs whitespace-nowrap border border-white/10">
                <span className="text-green-400">●</span> Blink rate: 14 bpm
              </div>
              <div className="absolute -right-16 bottom-8 glass-card px-3 py-2 text-xs whitespace-nowrap border border-white/10">
                <span className="text-accent">●</span> Gaze: center
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black font-heading gradient-text mb-1">{value}</div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black font-heading mb-3">Built for the way you work</h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Six powerful features working silently in the background — so you can stay focused.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-6 group hover:border-white/15 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-all">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black font-heading mb-3">Three steps to clarity</h2>
            <p className="text-white/50">Zero configuration. Start in under 30 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="text-6xl font-black font-heading text-white/5 mb-2">{step}</div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section id="privacy" className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass-card p-10 glow-pulse">
            <h2 className="text-3xl font-black font-heading mb-4">
              Your data stays on your device.
              <span className="gradient-text"> Always.</span>
            </h2>
            <p className="text-white/50 mb-8">
              NeuroBalance processes all video locally in your browser using WebAssembly. Only
              aggregated metrics (blink rate, gaze direction) are sent — never raw video.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-[#2d43ec] transition-all shadow-xl shadow-primary/20 text-lg"
            >
              <Brain className="w-5 h-5" />
              Start Monitoring for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold gradient-text">NeuroBalance AI</span>
          </div>
          <p className="text-xs text-white/30">© 2024 NeuroBalance AI. All processing in your browser.</p>
          <div className="flex gap-4 text-xs text-white/40">
            <Link href="/auth" className="hover:text-white">Dashboard</Link>
            <a href="#privacy" className="hover:text-white">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
