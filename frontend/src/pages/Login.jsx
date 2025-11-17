import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mock validation
    if (!email || !password) {
      setError('Kérjük töltse ki az összes mezőt');
      return;
    }
    
    // Mock login - simulate successful login
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify({ email, loginMethod: 'email' }));
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Redirect to Google OAuth
      window.location.href = `${API_BASE_URL}/auth/authorize`;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google bejelentkezés sikertelen');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 p-5">
      <div className="bg-card p-10 rounded-lg shadow-2xl w-full max-w-[400px]">
        <h1 className="mb-7 text-foreground text-center">Bejelentkezés</h1>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-5">
            <Label htmlFor="email">E-mail cím</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.com"
            />
          </div>

          <div className="mb-5">
            <Label htmlFor="password">Jelszó</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">
            Bejelentkezés
          </Button>
        </form>

        <div className="my-6">
          <Separator />
        </div>

        <div className="text-center text-sm text-muted-foreground mb-4">
          vagy folytassa a következővel
        </div>

        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Átirányítás...' : 'Google'}
          </Button>
        </div>

        <Separator className="my-6" />

        <p className="mt-5 text-center text-muted-foreground text-sm">
          Még nincs fiókja? <Link to="/register" className="text-primary no-underline font-medium hover:underline">Regisztráció</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
