import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const TOKEN_TIMEOUT_MS = 15000; // 15s to detect recovery event

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'verifying' | 'ready' | 'expired'>('verifying');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 PASSWORD_RECOVERY event received');
        setStatus('ready');
        clearTimeout(timeout);
      }
    });

    // Check URL hash for recovery token
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Give Supabase a moment to process the token
      timeout = setTimeout(() => {
        // If still verifying after timeout, token is likely invalid/expired
        setStatus((prev) => (prev === 'verifying' ? 'expired' : prev));
      }, TOKEN_TIMEOUT_MS);
    } else {
      // No recovery token in URL at all
      setStatus('expired');
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validatePassword = (pw: string): string | null => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!PASSWORD_REGEX.test(pw)) return 'Password must contain at least one letter and one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePassword(password);
    if (pwError) {
      toast({ title: pwError, variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Audit log
      console.log(`🔐 PASSWORD_RESET_SUCCESS [${new Date().toISOString()}]`, {
        userId: user?.id,
        email: user?.email,
      });

      toast({
        title: 'Password successfully updated',
        description: 'You can now log in with your new password.',
      });
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('🔐 PASSWORD_RESET_FAILED', err.message);
      toast({
        title: 'Failed to reset password',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Invalid or expired reset link</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/forgot-password')}>
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pwError = password ? validatePassword(password) : null;
  const mismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          </div>
          <CardDescription>Enter your new password below. Must be at least 8 characters with a letter and a number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {pwError && <p className="text-xs text-destructive">{pwError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              {mismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !!pwError || !!mismatch}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
