import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { createUserApi, getOrgMetadataApi } from '../../services/users.service';
import { UserRole, SalesRole, CreateUserResponse } from '../../types/auth.types';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ArrowLeft,
  Key,
  Shield,
  FileSpreadsheet,
  MapPin,
  Briefcase,
} from 'lucide-react';

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHR = user?.role === 'hr';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Fetch organizational metadata (departments, regions, areas, territories)
  const { data: orgMeta } = useQuery({
    queryKey: ['org-metadata'],
    queryFn: getOrgMetadataApi,
    staleTime: 1000 * 60 * 10,
  });

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState<UserRole>('learner');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeType, setEmployeeType] = useState('Permanent');
  const [salesRole, setSalesRole] = useState<SalesRole>('SO');

  // Geography cascading states
  const [departmentId, setDepartmentId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [territoryId, setTerritoryId] = useState('');

  // Password configuration
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateUserResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtered areas based on selected region
  const availableAreas = useMemo(() => {
    if (!orgMeta?.areas) return [];
    if (!regionId) return orgMeta.areas;
    return orgMeta.areas.filter((a) => a.regionId === regionId);
  }, [orgMeta, regionId]);

  // Filtered territories based on selected area
  const availableTerritories = useMemo(() => {
    if (!orgMeta?.territories) return [];
    if (!areaId) return orgMeta.territories;
    return orgMeta.territories.filter((t) => t.areaId === areaId);
  }, [orgMeta, areaId]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegionId(e.target.value);
    setAreaId('');
    setTerritoryId('');
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAreaId(e.target.value);
    setTerritoryId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await createUserApi({
        fullName,
        email,
        roleName,
        password: passwordMode === 'custom' ? customPassword : undefined,
        employeeId: employeeId.trim() ? employeeId.trim() : undefined,
        designation: designation.trim() ? designation.trim() : undefined,
        employeeType,
        salesRole: roleName === 'learner' ? salesRole : 'NON_SALES',
        departmentId: departmentId || undefined,
        regionId: regionId || undefined,
        areaId: areaId || undefined,
        territoryId: territoryId || undefined,
      });

      setCreatedResult(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create user account');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdResult?.tempPassword) {
      navigator.clipboard.writeText(createdResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setEmail('');
    setRoleName('learner');
    setEmployeeId('');
    setDesignation('');
    setEmployeeType('Permanent');
    setSalesRole('SO');
    setDepartmentId('');
    setRegionId('');
    setAreaId('');
    setTerritoryId('');
    setPasswordMode('auto');
    setCustomPassword('');
    setCreatedResult(null);
    setCopied(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/staff/users')}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to User Directory
        </button>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-card p-8 shadow-card">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-surface-border pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent/10 p-1.5 text-accent">
                <UserPlus className="h-5 w-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                {isSuperAdmin ? 'Super Admin: Provision Account' : isHR ? 'HR Employee Onboarding' : 'Onboard New User'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {isSuperAdmin
                ? 'Create any administrative or employee account and configure system credentials.'
                : 'Create an employee training account with departmental & territorial attributes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <Shield className="h-3.5 w-3.5" />
              {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Excel upload placeholder notice */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
          <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Data Entry Mode: Manual Form</p>
            <p className="mt-0.5 text-blue-700">
              You are currently entering user details manually. Excel/CSV bulk onboarding will be integrated in a subsequent release.
            </p>
          </div>
        </div>

        {/* Success Modal / Banner */}
        {createdResult ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-status-success/40 bg-status-successSubtle p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-status-success" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-status-success">
                    User Account Successfully Provisioned
                  </h3>
                  <p className="mt-1 text-xs text-ink">
                    Account for <strong className="font-semibold text-ink">{createdResult.user.fullName}</strong> (
                    {createdResult.user.email}) has been created with role <span className="font-semibold text-accent uppercase">{createdResult.user.role}</span>.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-ink-muted sm:grid-cols-4">
                    <div>
                      <span className="block font-medium text-ink-faint">Employee Type:</span>
                      <span className="font-semibold text-ink">{createdResult.user.employeeType || '—'}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-ink-faint">Sales Role:</span>
                      <span className="font-semibold text-ink">{createdResult.user.salesRole || '—'}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-ink-faint">Region:</span>
                      <span className="font-semibold text-ink">{createdResult.user.region || '—'}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-ink-faint">Territory:</span>
                      <span className="font-semibold text-ink">{createdResult.user.territory || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Box */}
              <div className="mt-5 rounded-md border border-surface-border bg-surface-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                    <Key className="h-4 w-4 text-accent" />
                    <span>Configured Initial Access Password</span>
                  </div>
                  <button
                    onClick={handleCopyPassword}
                    className="flex items-center gap-1.5 rounded border border-surface-border px-3 py-1 text-xs font-medium text-ink transition hover:border-accent hover:text-accent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-status-success" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Password
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 select-all rounded bg-surface p-3 font-mono text-sm font-bold text-ink">
                  {createdResult.tempPassword}
                </div>
                <p className="mt-2 text-[11px] text-amber-700">
                  ⚠️ Provide these credentials securely to the user. They will be required to set a permanent password upon their first sign in.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetForm}
                className="flex-1 rounded-md bg-accent py-2.5 text-xs font-semibold text-white transition hover:bg-accent-hover"
              >
                Onboard Another User
              </button>
              <button
                onClick={() => navigate('/staff/users')}
                className="flex-1 rounded-md border border-surface-border py-2.5 text-xs font-semibold text-ink transition hover:border-ink"
              >
                Go to User Directory
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-3.5 text-xs text-status-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                <Briefcase className="h-4 w-4 text-accent" /> Basic & Corporate Identity
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Full Name <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Corporate Email <span className="text-accent">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. mahfuzur.rahman@holcim.com"
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Role Permission <span className="text-accent">*</span>
                  </label>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value as UserRole)}
                    disabled={isHR}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none disabled:bg-surface/50"
                  >
                    <option value="learner">Learner (Employee)</option>
                    {(isAdmin || isSuperAdmin) && (
                      <option value="content_creator">Content Creator</option>
                    )}
                    {isSuperAdmin && (
                      <>
                        <option value="hr">HR Administrator</option>
                        <option value="admin">System Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  {isHR && (
                    <p className="mt-1 text-[10px] text-ink-muted">HR provisions employee learners</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-1049"
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Employee Type
                  </label>
                  <select
                    value={employeeType}
                    onChange={(e) => setEmployeeType(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none"
                  >
                    {(orgMeta?.employeeTypes || ['Permanent', 'Probationary', 'Contract', 'Consultant', 'Intern']).map(
                      (type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* Designation & Sales Role */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Sales Officer (SO), Technical Service Manager"
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {roleName === 'learner' && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                      Sales & Functional Role
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {(['SO', 'TSM', 'ASM', 'RSM', 'NON_SALES'] as SalesRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSalesRole(r)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                            salesRole === r
                              ? 'bg-accent text-white shadow-sm'
                              : 'border border-surface-border bg-surface text-ink hover:border-ink'
                          }`}
                        >
                          {r === 'NON_SALES' ? 'Non-Sales' : r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Department & Geography Structure */}
            <div className="space-y-4 border-t border-surface-border pt-5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                <MapPin className="h-4 w-4 text-accent" /> Department & Territory Assignment
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none"
                  >
                    <option value="">-- Select Department --</option>
                    {orgMeta?.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Region
                  </label>
                  <select
                    value={regionId}
                    onChange={handleRegionChange}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none"
                  >
                    <option value="">-- Select Region --</option>
                    {orgMeta?.regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Area {regionId && <span className="text-[10px] text-ink-muted">(Filtered by Region)</span>}
                  </label>
                  <select
                    value={areaId}
                    onChange={handleAreaChange}
                    disabled={!regionId && availableAreas.length === 0}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none disabled:bg-surface/50"
                  >
                    <option value="">-- Select Area --</option>
                    {availableAreas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Territory {areaId && <span className="text-[10px] text-ink-muted">(Filtered by Area)</span>}
                  </label>
                  <select
                    value={territoryId}
                    onChange={(e) => setTerritoryId(e.target.value)}
                    disabled={!areaId && availableTerritories.length === 0}
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink transition focus:border-accent focus:bg-surface-card focus:outline-none disabled:bg-surface/50"
                  >
                    <option value="">-- Select Territory --</option>
                    {availableTerritories.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Password Configuration */}
            <div className="space-y-4 border-t border-surface-border pt-5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
                <Key className="h-4 w-4 text-accent" /> Password & Credential Strategy
              </h2>

              <div className="flex items-center gap-6 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                  <input
                    type="radio"
                    name="passwordMode"
                    value="auto"
                    checked={passwordMode === 'auto'}
                    onChange={() => setPasswordMode('auto')}
                    className="accent-accent"
                  />
                  <span>Auto-generate secure random password</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                  <input
                    type="radio"
                    name="passwordMode"
                    value="custom"
                    checked={passwordMode === 'custom'}
                    onChange={() => setPasswordMode('custom')}
                    className="accent-accent"
                  />
                  <span>Set specific password manually</span>
                </label>
              </div>

              {passwordMode === 'custom' && (
                <div className="rounded-lg border border-surface-border bg-surface p-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                    Custom Initial Password <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required={passwordMode === 'custom'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter password (at least 10 chars, uppercase, lowercase, number)"
                    className="mt-1.5 w-full rounded-md border border-surface-border bg-surface-card px-3.5 py-2 text-xs text-ink transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-ink-muted">
                    Must meet corporate standards: 10+ characters, 1 uppercase, 1 lowercase, 1 number.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-surface-border">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {isSuperAdmin
                      ? 'Provision Account with Configured Password'
                      : 'Onboard Employee & Generate Credentials'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
