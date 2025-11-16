import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 10) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(password);
  
  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength < 40) return 'Gyenge';
    if (passwordStrength < 70) return 'Közepes';
    return 'Erős';
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mock validation
    if (!email || !password || !confirmPassword) {
      setError('Kérjük töltse ki az összes mezőt');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek');
      return;
    }

    if (password.length < 6) {
      setError('A jelszónak legalább 6 karakter hosszúnak kell lennie');
      return;
    }

    // Mock registration - simulate successful registration
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 p-5">
      <div className="bg-card p-10 rounded-lg shadow-2xl w-full max-w-[400px]">
        <h1 className="mb-7 text-foreground text-center">Regisztráció</h1>
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
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Jelszó erőssége:</span>
                  <span className={`font-semibold ${
                    passwordStrength < 40 ? 'text-destructive' : 
                    passwordStrength < 70 ? 'text-chart-4' : 
                    'text-chart-2'
                  }`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <Progress value={passwordStrength} className="h-2" />
              </div>
            )}
          </div>

          <div className="mb-5">
            <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full">
            Regisztráció
          </Button>
        </form>

        <p className="mt-5 text-center text-muted-foreground text-sm">
          Már van fiókja? <Link to="/login" className="text-primary no-underline font-medium hover:underline">Bejelentkezés</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
