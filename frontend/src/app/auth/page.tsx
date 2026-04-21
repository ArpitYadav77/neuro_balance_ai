'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { login, signup } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Brain, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

type Tab = 'login' | 'signup';

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAppStore((s) => s.setUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (tab === 'login') {
        data = await login(email, password);
      } else {
        data = await signup(email, password, name);
      }
      setUser(data.user, data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#06080f] dot-grid relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm mx-4 fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
              <Brain className="w-5 h-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-black font-heading gradient-text">NeuroBalance AI</h1>
          <p className="text-xs text-white/40 mt-1">Monitor your cognitive state in real-time</p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 border border-white/10">
          {/* Tabs */}
          <div className="flex rounded-xl bg-white/3 border border-white/5 p-1 mb-6">
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                id={`auth-tab-${t}`}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab === 'signup' && (
              <Input
                id="auth-name"
                label="Full Name"
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
              />
            )}
            <Input
              id="auth-email"
              label="Email"
              type="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              id="auth-password"
              label="Password"
              type="password"
              placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<Lock className="w-4 h-4" />}
            />

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <Button
              id="auth-submit-btn"
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="mt-1"
            >
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-xs text-white/30 mt-4">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline"
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Your webcam data never leaves your browser.
        </p>
      </div>
    </div>
  );
}
