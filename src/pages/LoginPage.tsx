import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth state listener in AuthContext will update the user
      // We need to wait a moment for the profile to load, then redirect
      // The redirect will happen via the ProtectedRoute logic
      // But we can also check the role here
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('invalid-credential') || err.message.includes('wrong-password')) {
          setError('Invalid email or password.');
        } else if (err.message.includes('user-not-found')) {
          setError('No account found with this email.');
        } else if (err.message.includes('too-many-requests')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/95 shadow-2xl border-0">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome to ROCA</CardTitle>
            <CardDescription className="text-base mt-1">
              Sign in to your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
