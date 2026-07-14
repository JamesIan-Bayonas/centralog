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

    // Sanitize parameters by scrubbing external whitespace characters
    const sanitizedUsername = usernameInput.trim();
    const sanitizedPassword = passwordInput.trim();

    // Dynamically determine the matching security scope tier based on clean user input
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

      // 1. Write the raw token signature for axios authorization headers
      sessionStorage.setItem('cl_session_token', token);

      // 2. Construct and stringify the precise metadata object expected by AuthContext.tsx
      const userMetadata = {
        userId,
        username,
        email,
        roleName
      };
      sessionStorage.setItem('cl_user_metadata', JSON.stringify(userMetadata));

      alert(`Identity verified successfully. Welcome back, ${username}!`);
      window.location.reload();
    } catch (err: any) {
      console.error('Authentication gate refused credentials:', err);
      setErrorMessage(err.message || 'Authentication failed: Invalid security claims signature.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#111115', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1e1e24', border: '1px solid #2d2d34', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* System Branding Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '50%', display: 'inline-block' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#f5f5f6' }}>CentraLog Vault</h2>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Enterprise Asset Tracking & Valuation Ledger</span>
        </div>

        {/* Dynamic Security Exception Banner */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px', fontSize: '13px', color: '#ef4444', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Strict Auth Form Controller */}
        <form onSubmit={handleIdentityAuthentication} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Operator Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text" 
                required
                placeholder="Enter workspace identity identifier..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 38px', backgroundColor: '#141418', border: '1px solid #2d2d34', borderRadius: '4px', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>Security Cryptopassword</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="password" 
                required
                placeholder="••••••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px 12px 38px', backgroundColor: '#141418', border: '1px solid #2d2d34', borderRadius: '4px', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating}
            style={{ width: '100%', padding: '12px', backgroundColor: '#38bdf8', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', marginTop: '8px' }}
          >
            {isAuthenticating ? 'Decrypting Security Token...' : 'Verify Workspace Access'}
          </button>
        </form>

        {/* Security Warning Label */}
        <div style={{ borderTop: '1px solid #2d2d34', paddingTop: '16px', display: 'flex', gap: '8px', color: '#9ca3af', fontSize: '11px' }}>
          <Terminal size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Notice: This catalog node requires pre-seeded authorization signatures. Public registrations are locked.</span>
        </div>

      </div>
    </div>
  );
};