'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Cartographic atmosphere */}
      <div className="pointer-events-none absolute inset-0 brass-mesh" />
      <div className="pointer-events-none absolute inset-0 topo-pattern opacity-60" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[15%] h-[450px] w-[450px] rounded-full bg-primary/6 blur-[140px] animate-aurora" />
        <div className="absolute -right-[8%] bottom-[10%] h-[350px] w-[350px] rounded-full bg-secondary/5 blur-[120px] animate-aurora" style={{ animationDelay: '5s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[400px] animate-reveal-up">
        {/* Brass filigree top accent */}
        <div className="brass-line mb-8" />

        <Card className="glass-strong card-glow rounded-lg noise overflow-hidden">
          <CardHeader className="relative z-10 space-y-4 text-center pb-2 pt-8 px-8">
            {/* Instrument dial logo mark */}
            <div className="mx-auto relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary/20" />
              <div className="absolute inset-1 rounded-full border border-primary/10" />
              <svg viewBox="0 0 32 32" className="h-7 w-7 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="16" cy="16" r="12" strokeDasharray="2 3" />
                <path d="M16 4 L16 8 M16 24 L16 28 M4 16 L8 16 M24 16 L28 16" />
                <path d="M16 12 L18 16 L16 20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <h1 className="font-display text-[1.6rem] font-semibold tracking-tight leading-none italic">NorthLens</h1>
              <CardDescription className="text-muted-foreground text-[13px]">Sign in to your instrument panel</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
              <Button type="submit" className="w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enter Observatory
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <p className="text-[13px] text-muted-foreground">
              No account yet?{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="brass-line mt-8" />
      </div>
    </div>
  );
}
