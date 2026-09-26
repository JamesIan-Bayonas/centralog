import React, { useState } from 'react';
import {
  ArrowRight,
  ClipboardList,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  PackageCheck,
  ShieldCheck,
  Sun,
  UserRound,
  Wrench,
  AlertCircle,
  RotateCw,
  Leaf,
} from 'lucide-react';
import { api, type AuthResponse } from '../services/api';
import './LoginPortal.css';

type Theme = 'theme-dmc' | 'theme-light' | 'theme-obsidian';

interface LoginPortalProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions = [
  { value: 'theme-dmc', label: 'Signature green', Icon: Leaf },
  { value: 'theme-light', label: 'White', Icon: Sun },
  { value: 'theme-obsidian', label: 'Night', Icon: Moon },
] as const;

export const LoginPortal: React.FC<LoginPortalProps> = ({ currentTheme, onThemeChange }) => {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleIdentityAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    const sanitizedUsername = usernameInput.trim();
    const sanitizedPassword = passwordInput.trim();

    const resolvedRoleScope = sanitizedUsername === 'accountant_cl' ? 'Accountant' :
                              sanitizedUsername === 'manager_cl' ? 'Manager' :
                              sanitizedUsername === 'staff_cl' ? 'Inventory Staff' : 'SystemAdmin';

    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        usernameOrEmail: sanitizedUsername,
        password: sanitizedPassword,
        requestedRoleScope: resolvedRoleScope
      });

      const { token, roleName, username, email, userId } = response.data;

      sessionStorage.setItem('cl_session_token', token);

      const userMetadata = {
        userId,
        username,
        email,
        roleName
      };
      sessionStorage.setItem('cl_user_metadata', JSON.stringify(userMetadata));

      window.location.reload();
    } catch (err: unknown) {
      console.error('Authentication gate refused credentials:', err);
      const fallbackMsg = 'Network Error: Gateway timeout or server connection refused.';
      setErrorMessage(err instanceof Error ? err.message || fallbackMsg : fallbackMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const applyCredentialPreset = (username: string, pass: string) => {
    setUsernameInput(username);
    setPasswordInput(pass);
    setErrorMessage(null);
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <header className="login-topbar">
          <div className="login-brand" aria-label="CentraLog">
            <span className="login-brand-mark"><PackageCheck size={22} strokeWidth={2.2} aria-hidden="true" /></span>
            <span className="login-brand-name">CentraLog<span className="login-brand-dot">.</span></span>
          </div>

          <div className="login-topbar-actions">
            <span className="login-project-label">A DMCCFI school project</span>
            <div className="login-theme-picker" role="group" aria-label="Color theme">
              {themeOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`login-theme-option ${currentTheme === value ? 'is-active' : ''}`}
                  onClick={() => onThemeChange(value)}
                  aria-pressed={currentTheme === value}
                  title={label}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="login-main">
          <section className="login-intro" aria-labelledby="login-intro-title">
            <div className="login-eyebrow"><span className="login-eyebrow-line" /> DMCCFI · ASSET MANAGEMENT</div>
            <h1 id="login-intro-title">From procurement to accountability.</h1>
            <p className="login-intro-copy">
              One place to record school assets, follow their custody and maintenance,
              and keep a clear financial and audit history.
            </p>

            <div className="login-process" aria-label="Asset workflow">
              <div className="login-process-item">
                <span className="login-process-icon"><PackageCheck size={20} aria-hidden="true" /></span>
                <span><strong>Register</strong><small>Record newly procured assets</small></span>
              </div>
              <div className="login-process-item">
                <span className="login-process-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
                <span><strong>Track</strong><small>Know where assets are and who holds them</small></span>
              </div>
              <div className="login-process-item">
                <span className="login-process-icon"><Wrench size={20} aria-hidden="true" /></span>
                <span><strong>Maintain</strong><small>Follow service and lifecycle status</small></span>
              </div>
              <div className="login-process-item">
                <span className="login-process-icon"><ClipboardList size={20} aria-hidden="true" /></span>
                <span><strong>Account</strong><small>Review valuation and audit records</small></span>
              </div>
            </div>

            <p className="login-intro-note">Built around the day-to-day work of keeping institutional property accounted for.</p>
          </section>

          <section className="login-access" aria-labelledby="login-title">
            <div className="login-card">
              <div className="login-card-kicker"><LockKeyhole size={15} aria-hidden="true" /> STAFF ACCESS</div>
              <h2 id="login-title">Welcome back</h2>
              <p className="login-card-copy">Sign in to continue to your CentraLog workspace.</p>

              {errorMessage && (
                <div className="login-error" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleIdentityAuthentication} className="login-form">
                <div className="login-field">
                  <label htmlFor="username-input">Username or email</label>
                  <div className="login-input-wrap">
                    <UserRound size={18} aria-hidden="true" />
                    <input
                      id="username-input"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="Enter your username or email"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="password-input">Password</label>
                  <div className="login-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="login-password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isAuthenticating} className="login-submit">
                  {isAuthenticating ? (
                    <><RotateCw size={18} className="spin" aria-hidden="true" /> Signing in…</>
                  ) : (
                    <>Sign in to workspace <ArrowRight size={18} aria-hidden="true" /></>
                  )}
                </button>

                <details className="login-demo-accounts">
                  <summary>Use a project demo account</summary>
                  <p>Choose a role to fill the sign-in fields.</p>
                  <div className="login-demo-list">
                    <button type="button" onClick={() => applyCredentialPreset('admin_cl', 'AdminPass123!')}>Administrator</button>
                    <button type="button" onClick={() => applyCredentialPreset('manager_cl', 'ManagerPass123!')}>Manager</button>
                    <button type="button" onClick={() => applyCredentialPreset('staff_cl', 'StaffPass123!')}>Inventory staff</button>
                    <button type="button" onClick={() => applyCredentialPreset('accountant_cl', 'AccountantPass123!')}>Accountant</button>
                  </div>
                </details>
              </form>

              <p className="login-access-note">Access is available to authorized project accounts.</p>
            </div>
          </section>
        </main>

        <footer className="login-footer">
          <span>CentraLog · Asset management for the DMCCFI school project</span>
          <span>Procurement · Custody · Maintenance · Reporting</span>
        </footer>
      </div>
    </div>
  );
};
