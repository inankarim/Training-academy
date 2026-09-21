import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, AlertCircle, ArrowRight, Lock } from 'lucide-react';

export const StaffLoginPage: React.FC = () => {
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
      } else if (['super_admin', 'admin', 'hr', 'content_creator'].includes(authData.user.role)) {
        navigate('/staff/dashboard');
      } else {
        // A learner accidentally logged into staff portal: route them safely to learner dashboard
        navigate('/learner/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-charcoal text-white">
      {/* Top Bar */}
      <header className="border-b border-charcoal-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-accent font-bold text-white shadow-sm">
              H
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">HOLCIM</span>
              <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-accent">Staff Portal</span>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded border border-charcoal-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Learner Portal
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Main Staff Login Box */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-charcoal-border bg-charcoal-soft p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Administration & HR</h1>
              <p className="mt-1 text-xs text-white/60">
                Restricted access for HR officers, course coordinators, and system administrators.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-status-danger/40 bg-status-danger/10 p-3.5 text-sm text-status-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
                  Staff Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@holcim.com"
                  className="mt-1.5 w-full rounded-md border border-charcoal-border bg-charcoal px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-white/70">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1.5 w-full rounded-md border border-charcoal-border bg-charcoal px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-charcoal-soft disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Authorize & Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-charcoal-border pt-4 text-center">
              <p className="text-xs text-white/40">
                All management access is strictly monitored and audited in compliance with Holcim IT Security Policies.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-charcoal-border py-4 text-center text-xs text-white/30">
        Holcim Bangladesh Internal Security Management &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
