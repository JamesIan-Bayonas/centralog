// File path: centralog-ui/src/components/LoginPortal.tsx

import React, { useState } from 'react';
import { api, type AuthResponse } from '../services/api';
import { ShieldCheck, Lock, User, Terminal } from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const handleIdentityAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsAuthenticating(true);

    try {
      // Post authentication payload directly to the ASP.NET Core endpoint
      const response = await api.post<AuthResponse>('/auth/login', {
        username: usernameInput,
        password: passwordInput
      });

      const { token, roleName, username } = response.data;

      // Store the secure cryptographically signed bearer token passport
      sessionStorage.setItem('cl_session_token', token);
      sessionStorage.setItem('cl_user_role', roleName);
      sessionStorage.setItem('cl_username', username);

      alert(`Identity verified successfully. Welcome back, ${username}!`);
      
      // Force routing re-evaluation to load the role-specific dashboard views
      window.location.reload();
    } catch (err: any) {
      console.error('Authentication gate refused credentials:', err);
      setErrorMessage(err.message || 'Authentication failed: Invalid security claims signature.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--canvas)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* System Branding Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>CentraLog Vault</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enterprise Asset Tracking & Valuation Ledger [cite: 71]</span>
        </div>

        {/* Dynamic Security Exception Banner */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--clr-danger)', borderRadius: '6px', padding: '12px', fontSize: '13px', color: 'var(--clr-danger)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Strict Auth Form Controller */}
        <form onSubmit={handleIdentityAuthentication} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Operator Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                placeholder="Enter workspace identity identifier..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 36px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Security Cryptopassword</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                placeholder="••••••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 36px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '14px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating}
            style={{ width: '100%', padding: '12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', marginTop: '8px' }}
          >
            {isAuthenticating ? 'Decrypting Security Token...' : 'Verify Workspace Access'}
          </button>
        </form>

        {/* Security Warning Label */}
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '16px', display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
          <Terminal size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Notice: This catalog node requires pre-seeded authorization signatures. Public registrations are locked[cite: 80, 100].</span>
        </div>

      </div>
    </div>
  );
};