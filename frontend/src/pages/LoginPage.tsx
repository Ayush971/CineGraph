import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
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
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      const status = err.response?.status;
      // The API returns the same "Invalid credentials" for an unknown email and
      // a wrong password (deliberately — it stops anyone probing which emails
      // have accounts). Say something more human without leaking which it was.
      if (status === 401) {
        setError("That email and password don't match. Please try again.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full px-4 py-3 bg-surface-3 border border-line rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:border-daylight-400/60 focus:shadow-[var(--shadow-glow-cool)] transition-[border-color,box-shadow] duration-150';

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] px-4 py-12">
      <div className="bg-surface border border-line p-8 rounded-2xl shadow-[var(--shadow-lift)] w-full max-w-md">
        <p className="meta !text-tungsten-300 mb-2">Welcome Back</p>
        <h1 className="font-display font-bold text-3xl mb-7">
          Log in to CineGraph
        </h1>

        {error && <Alert className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="meta block mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="meta block mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="text-center text-ink-mute text-sm mt-7">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-daylight-300 hover:text-daylight-400 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
