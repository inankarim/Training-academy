import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { changePasswordApi } from '../../services/auth.service';
import { KeyRound, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasLength = newPassword.length >= 10;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasLength && hasUpper && hasLower && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      await changePasswordApi(currentPassword, newPassword);
      updateUser({ mustChangePassword: false });

      if (user?.role === 'learner') {
        navigate('/learner/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-warningSubtle text-status-warning">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Change Your Password</h1>
          <p className="mt-1 text-sm text-ink-muted">
            For security compliance, you must set a new personal password before accessing Holcim Academy.
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
              Current Temporary Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter temporary password"
              className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Password policy requirements */}
          <div className="rounded-lg border border-surface-border bg-surface p-3.5 text-xs text-ink-muted">
            <p className="mb-2 font-semibold text-ink">Password Requirements:</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasLength ? 'text-status-success' : 'text-ink-faint'}`} />
                <span>At least 10 characters</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasUpper ? 'text-status-success' : 'text-ink-faint'}`} />
                <span>Contains uppercase letter (A-Z)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasLower ? 'text-status-success' : 'text-ink-faint'}`} />
                <span>Contains lowercase letter (a-z)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumber ? 'text-status-success' : 'text-ink-faint'}`} />
                <span>Contains a number (0-9)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className={`h-3.5 w-3.5 ${passwordsMatch ? 'text-status-success' : 'text-ink-faint'}`} />
                <span>Passwords match</span>
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Update Password & Continue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
