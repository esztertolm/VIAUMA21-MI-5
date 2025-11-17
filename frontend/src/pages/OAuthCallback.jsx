import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function OAuthCallback() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the current URL with all query parameters
        const currentUrl = window.location.href;
        
        // Make a request to the backend callback endpoint with the full URL
        const response = await fetch(`${API_BASE_URL}/auth/oauth2callback?${window.location.search}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('OAuth callback failed');
        }

        const userInfo = await response.json();
        
        // Store user info and authentication status
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          loginMethod: 'google'
        }));

        setStatus('success');
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Bejelentkezés sikertelen. Próbálja újra.');
        setStatus('error');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
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