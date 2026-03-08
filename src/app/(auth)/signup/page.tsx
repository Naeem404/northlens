'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Account created! Redirecting to your observatory...');
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Layered atmosphere */}
      <div className="pointer-events-none absolute inset-0 nebula" />
      <div className="pointer-events-none absolute inset-0 topo-pattern opacity-40" />
      <div className="pointer-events-none absolute inset-0 meridian-pattern opacity-20" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[15%] top-[10%] h-[500px] w-[500px] rounded-full bg-secondary/5 blur-[160px] animate-aurora" />
        <div className="absolute right-[-10%] bottom-[5%] h-[400px] w-[400px] rounded-full bg-primary/4 blur-[140px] animate-aurora" style={{ animationDelay: '7s' }} />
      </div>

      {/* Left panel — value proposition */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12">
        <div className="relative z-10 max-w-lg">
          <div className="animate-scale-in stagger-1 mb-8">
            <svg viewBox="0 0 120 120" className="mx-auto h-24 w-24 text-secondary/25" fill="none" stroke="currentColor" strokeWidth="0.5">
              <circle cx="60" cy="60" r="55" strokeDasharray="3 5" />
              <circle cx="60" cy="60" r="45" strokeDasharray="1 3" opacity="0.5" />
              <circle cx="60" cy="60" r="35" opacity="0.3" />
              <path d="M60 5 L60 15 M60 105 L60 115 M5 60 L15 60 M105 60 L115 60" strokeWidth="1" opacity="0.5" />
              <path d="M60 25 L65 60 L60 65 L55 60 Z" fill="currentColor" opacity="0.1" />
            </svg>
          </div>

          <div className="animate-reveal-stagger stagger-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary/50 mb-3">
              Commission Your Station
            </p>
          </div>

          <h2 className="animate-reveal-stagger stagger-3 font-display text-[2.6rem] font-semibold leading-[1.1] tracking-tight text-foreground/90 italic">
            Intelligence that<br />
            <span className="text-secondary text-glow">levels the</span><br />
            playing field
          </h2>

          <div className="brass-line my-8 animate-reveal-stagger stagger-4" />

          <div className="animate-reveal-stagger stagger-5 space-y-4">
            {[
              { label: 'Pipeline Engine', desc: 'Extract competitor data from any website with AI' },
              { label: 'Analytics Dashboard', desc: 'Unified KPIs, price tracking, and change detection' },
              { label: 'AI Advisor', desc: 'Gemini-powered recommendations with function calling' },
            ].map((feat, i) => (
              <div key={feat.label} className="flex items-start gap-3" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-foreground/80">{feat.label}</p>
                  <p className="text-[12px] text-muted-foreground/50">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — signup form */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-6 lg:p-12">
        <div className="relative z-10 w-full max-w-[380px]">
          <div className="animate-needle mb-8 flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/25" />
              <svg viewBox="0 0 32 32" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="16" cy="16" r="12" strokeDasharray="2 3" />
                <path d="M16 4 L16 8 M16 24 L16 28 M4 16 L8 16 M24 16 L28 16" />
                <path d="M16 12 L18 16 L16 20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight italic leading-none">NorthLens</h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-0.5">New Station</p>
            </div>
          </div>

          <div className="animate-reveal-stagger stagger-2 relative rounded-xl glass-strong card-bezel noise overflow-hidden">
            <div className="brass-edge" />
            <div className="relative z-10 p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight">Create your account</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Set up your competitive intelligence station</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11 bg-background/40 border-border/60 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-background/40 border-border/60 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 bg-background/40 border-border/60 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold tracking-wide text-[13px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 glow-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-dial-spin" />
                  ) : (
                    <svg viewBox="0 0 16 16" className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" strokeDasharray="2 2" />
                      <path d="M8 5 L9.5 8 L8 11" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  Commission Station
                </Button>
              </form>

              <div className="brass-line my-6" />

              <p className="text-[12px] text-muted-foreground/60">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="animate-reveal-stagger stagger-6 mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30">
            Free tier: 3 pipelines &middot; 500 records &middot; AI advisor
          </p>
        </div>
      </div>
    </div>
  );
}
