'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: '',
    business_name: '',
    business_type: '',
    industry: '',
    location: '',
    website: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        business_name: profile.business_name || '',
        business_type: profile.business_type || '',
        industry: profile.industry || '',
        location: profile.location || '',
        website: profile.website || '',
      });
    }
  }, [profile]);

  function handleSave() {
    updateProfile.mutate(form, {
      onSuccess: () => toast.success('Profile updated'),
      onError: (err) => toast.error(err.message),
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Configuration</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight italic">Settings</h1>
      </div>
      <div className="brass-line mb-6" />

      <div className="space-y-6">
        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Tell us about your business so we can personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Northern Outdoor Co."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select
                  value={form.business_type}
                  onValueChange={(v) => setForm({ ...form, business_type: v ?? '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="Outdoor & Sports"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Waterloo, ON"
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://example.ca"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{profile?.plan || 'Free'} Plan</p>
                <p className="text-sm text-muted-foreground">
                  Current plan features and limits
                </p>
              </div>
              <Button variant="outline" disabled>
                Upgrade (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Danger zone */}
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
