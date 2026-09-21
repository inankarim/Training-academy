import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

export const LearnerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const authData = await login(email, password);
      if (authData.user.mustChangePassword) {
        navigate('/change-password');
      } else if (authData.user.role === 'learner') {
        navigate('/learner/dashboard');
      } else {
        // Staff user logged in via learner portal: smoothly route to staff dashboard
        navigate('/staff/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top corporate bar */}
      <header className="border-b border-surface-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-accent font-bold text-white shadow-sm">
              H
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-ink">HOLCIM</span>
              <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-accent">Academy</span>
            </div>
          </div>
          <Link
            to="/staff/login"
            className="flex items-center gap-1.5 rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-accent hover:text-accent"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Staff & HR Portal
          </Link>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-surface-border bg-white p-8 shadow-card">
            <div className="mb-6 text-center">
              <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
                Employee Learning Portal
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Sign in to your training</h1>
              <p className="mt-1 text-sm text-ink-muted">
                Access your training modules, progress, challenges, and certifications.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-3.5 text-sm text-status-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@holcim.com"
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-surface-border pt-4 text-center">
              <p className="text-xs text-ink-muted">
                Need an account or forgot password? Contact your HR department or supervisor.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-surface-border py-4 text-center text-xs text-ink-faint">
        Holcim Bangladesh &copy; {new Date().getFullYear()} — Enterprise Learning & Development
      </footer>
    </div>
  );
};
