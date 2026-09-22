import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        // The API already says "Email already registered" / "Username already
        // taken", which are exactly what the user needs to hear.
        setError(detail);
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors arrive as a list of objects; surface the
        // first message rather than rendering "[object Object]".
        setError(detail[0]?.msg || 'Please check the details you entered.');
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
        <p className="meta !text-tungsten-300 mb-2">Start Your Diary</p>
        <h1 className="font-display font-bold text-3xl mb-7">Join CineGraph</h1>

        {error && <Alert className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="meta block mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Choose a username"
              required
              minLength={3}
            />
          </div>

          <div>
            <label htmlFor="email" className="meta block mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className={inputClasses}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-ink-mute text-sm mt-7">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-daylight-300 hover:text-daylight-400 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
