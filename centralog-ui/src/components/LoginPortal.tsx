import React, { useState } from 'react';
import { api, type AuthResponse } from '../services/api';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Terminal, 
  Eye, 
  EyeOff, 
  Server, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ChevronRight,
  RotateCw
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
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
    } catch (err: any) {
      console.error('Authentication gate refused credentials:', err);
      const fallbackMsg = 'Network Error: Gateway timeout or server connection refused.';
      setErrorMessage(err.message || fallbackMsg);
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
    <div className="login-portal-viewport">
      <style>{`
        .login-portal-viewport {
          height: 100vh;
          width: 100vw;
          display: flex;
          background-color: var(--canvas, #06070a);
          color: var(--text-primary, #f8fafc);
          font-family: var(--font-main, 'Inter', -apple-system, sans-serif);
          position: relative;
          overflow: hidden;
        }

        .portal-grid-background {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, var(--border, #242936) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border, #242936) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.12;
          pointer-events: none;
        }

        .portal-layout-container {
          display: flex;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* BRAND HERO PANEL - DESKTOP */
        .portal-brand-panel {
          flex: 1;
          background: linear-gradient(135deg, var(--surface, #0d0f14) 0%, var(--surface-raised, #161922) 100%);
          border-right: 1px solid var(--border, #242936);
          padding: clamp(24px, 4vh, 48px) clamp(32px, 4vw, 56px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .brand-telemetry-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid var(--clr-success, #10b981);
          color: var(--clr-success, #10b981);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          width: fit-content;
        }

        .telemetry-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--clr-success, #10b981);
          box-shadow: 0 0 8px var(--clr-success, #10b981);
          animation: pulse-glow 2s infinite ease-in-out;
        }

        .brand-hero-content {
          margin: auto 0;
        }

        .brand-hero-title {
          font-size: clamp(28px, 3.2vw, 40px);
          font-weight: 800;
          letter-spacing: -1px;
          margin: 12px 0 8px 0;
          color: var(--text-primary, #f8fafc);
          line-height: 1.15;
        }

        .brand-hero-subtitle {
          font-size: clamp(13px, 1.1vw, 15px);
          color: var(--text-muted, #94a3b8);
          line-height: 1.5;
          max-width: 480px;
          margin: 0 0 24px 0;
        }

        .feature-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 440px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          background-color: var(--surface, #0d0f14);
          border: 1px solid var(--border, #242936);
        }

        .feature-icon-box {
          padding: 6px;
          border-radius: 6px;
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--accent, #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* AUTHENTICATION FORM PANEL */
        .portal-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          height: 100%;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background-color: var(--surface, #0d0f14);
          border: 1px solid var(--border, #242936);
          border-radius: 12px;
          padding: clamp(20px, 3.5vh, 32px) clamp(20px, 3vw, 32px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          margin: auto;
        }

        .auth-header {
          text-align: center;
          margin-bottom: clamp(16px, 2.5vh, 24px);
        }

        .auth-logo-badge {
          display: inline-flex;
          padding: 10px;
          border-radius: 10px;
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--accent, #10b981);
          border: 1px solid var(--border, #242936);
          margin-bottom: 12px;
        }

        .auth-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: var(--text-primary, #f8fafc);
        }

        .auth-desc {
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
          margin: 0;
        }

        .input-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .form-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-primary, #f8fafc);
          opacity: 0.9;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted, #94a3b8);
          pointer-events: none;
          transition: color 0.2s;
        }

        .auth-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 42px 10px 42px;
          background-color: var(--canvas, #06070a);
          border: 1px solid var(--border, #242936);
          border-radius: 6px;
          color: var(--text-primary, #f8fafc);
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }

        .auth-input:focus {
          border-color: var(--accent, #10b981);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .auth-input:focus + .input-icon {
          color: var(--accent, #10b981);
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .password-toggle-btn:hover {
          color: var(--text-primary, #f8fafc);
        }

        .preset-pill-deck {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }

        .preset-pill {
          background-color: var(--surface-raised, #161922);
          border: 1px solid var(--border, #242936);
          color: var(--text-primary, #f8fafc);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-family: var(--font-mono, monospace);
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-pill:hover {
          border-color: var(--accent, #10b981);
          color: var(--accent, #10b981);
          background-color: rgba(16, 185, 129, 0.08);
        }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background-color: var(--accent, #10b981);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.1s;
          margin-top: 4px;
          min-height: 42px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.92;
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-boundary-banner {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--clr-danger, #ef4444);
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 16px;
          color: var(--clr-danger, #ef4444);
          font-size: 12px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .system-footer-notice {
          border-top: 1px dashed var(--border, #242936);
          padding-top: 12px;
          margin-top: 18px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: var(--text-muted, #94a3b8);
          font-size: 10px;
          line-height: 1.4;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        @media (max-width: 1023px) {
          .login-portal-viewport {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }
          .portal-brand-panel {
            display: none;
          }
          .portal-form-panel {
            padding: 24px 16px;
            height: auto;
            min-height: 100vh;
          }
          .auth-card {
            padding: 24px 18px;
          }
        }
      `}</style>

      <div className="portal-grid-background" />

      <div className="portal-layout-container">
        {/* BRAND HERO PANEL - DESKTOP SCREEN TIER */}
        <div className="portal-brand-panel">
          <div className="brand-telemetry-badge">
            <div className="telemetry-dot" />
            <span>CENTRALOG KERNEL v2.4 • ONLINE</span>
          </div>

          <div className="brand-hero-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent, #10b981)' }}>
              <Server size={24} />
              <span className="mono" style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '1.5px' }}>
                INSTITUTIONAL ASSET VAULT
              </span>
            </div>
            <h1 className="brand-hero-title">Precision Hardware Telemetry & Ledger</h1>
            <p className="brand-hero-subtitle">
              Centralized property logging, automated double-declining depreciation, and strict Role-Based Access Control governance.
            </p>

            <div className="feature-stack">
              <div className="feature-item">
                <div className="feature-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>RBAC Clearance Gates</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    Granular authorization boundaries for Inventory Staff, Managers, and Auditors.
                  </div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <Activity size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Real-Time Financial Valuation</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    Live depreciation ledger calculation with automated maintenance freeze windows.
                  </div>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-box">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Auditable Audit Logs</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    Immutable history tracking across custodian handoffs and physical room relocations.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }} className="mono">
            <span>SYS_BUILD: 2026.08-STABLE</span>
            <span>SEC_LEVEL: AES-256 HMAC</span>
          </div>
        </div>

        {/* AUTHENTICATION FORM PANEL */}
        <div className="portal-form-panel">
          <div className="auth-card">
            
            <div className="auth-header">
              <div className="auth-logo-badge">
                <KeyRound size={24} />
              </div>
              <h2 className="auth-title">CentraLog Vault</h2>
              <p className="auth-desc">Enterprise Asset Tracking & Valuation Gateway</p>
            </div>

            {/* ERROR BOUNDARY BANNER */}
            {errorMessage && (
              <div className="error-boundary-banner" role="alert">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleIdentityAuthentication} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div className="input-label-row">
                  <label className="form-label" htmlFor="username-input">Operator Identifier</label>
                </div>
                <div className="input-wrapper">
                  <input
                    id="username-input"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter operator handle or email..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="auth-input"
                  />
                  <User size={16} className="input-icon" />
                </div>
              </div>

              <div>
                <div className="input-label-row">
                  <label className="form-label" htmlFor="password-input">Security Cryptopassword</label>
                </div>
                <div className="input-wrapper">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="auth-input"
                  />
                  <Lock size={16} className="input-icon" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? "Hide password" : "Reveal password"}
                    aria-label={showPassword ? "Hide password" : "Reveal password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* AUDIT TESTING PRESET QUICK-FILL DECK */}
              <div>
                <div className="form-label" style={{ marginBottom: '4px', fontSize: '10px', opacity: 0.7 }}>
                  Quick Credential Presets
                </div>
                <div className="preset-pill-deck">
                  <button 
                    type="button" 
                    onClick={() => applyCredentialPreset('admin_cl', 'AdminPass123!')}
                    className="preset-pill"
                  >
                    admin_cl
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyCredentialPreset('manager_cl', 'ManagerPass123!')}
                    className="preset-pill"
                  >
                    manager_cl
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyCredentialPreset('staff_cl', 'StaffPass123!')}
                    className="preset-pill"
                  >
                    staff_cl
                  </button>
                  <button 
                    type="button" 
                    onClick={() => applyCredentialPreset('accountant_cl', 'AccountantPass123!')}
                    className="preset-pill"
                  >
                    accountant_cl
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="submit-btn"
              >
                {isAuthenticating ? (
                  <>
                    <RotateCw size={16} className="spin" />
                    <span>Decrypting Security Token...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Workspace Access</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="system-footer-notice">
              <Terminal size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                Notice: Workspace authentication requires signed cryptographic claims. Public registration is locked.
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};