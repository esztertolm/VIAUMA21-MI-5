import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

function OAuthCallback() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
  const registerUser = async () => {
    try {
      const userB64 = searchParams.get('user');
      if (!userB64) throw new Error('User data missing');

      const user = JSON.parse(atob(userB64));
      console.log('[OAuthCallback] user', user);

      // 1) Backend hívás
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          oauth_id: user.sub,
        })
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Registration OK:", data);

      // 2) LocalStorage beállítás
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        name: user.name,
        picture: user.picture,
        oauth_id: user.sub,
        loginMethod: 'google'
      }));

      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 1000);

    } catch (err) {
      console.error('OAuth callback error:', err);
      setError('Bejelentkezés sikertelen. Próbálja újra.\n' + (err.message || ''));
      setStatus('error');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  registerUser();
}, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-purple-600 p-5">
      <div className="bg-card p-10 rounded-lg shadow-2xl w-full max-w-[400px] text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Bejelentkezés folyamatban...</h2>
            <p className="text-muted-foreground">Kérem várjon, a Google fiókjával történő bejelentkezés feldolgozása folyamatban van.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Sikeres bejelentkezés!</h2>
            <p className="text-muted-foreground">Átirányítjuk a dashboard-ra...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground">Átirányítjuk a bejelentkezési oldalra...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;