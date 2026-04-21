'use client';
import Link from 'next/link';
import { Brain, Github, ExternalLink } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-[#06080f]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:glow-primary transition-all">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold font-heading gradient-text">NeuroBalance AI</span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#2d43ec] transition-all shadow-lg shadow-primary/20"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
