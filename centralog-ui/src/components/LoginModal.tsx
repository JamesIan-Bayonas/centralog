import React, { useState } from 'react';
import { api, type AuthResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, User, AlertTriangle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Inventory Staff');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthenticating(true);

    try {
      // Direct pipeline dispatch to AuthController.cs endpoint
      const response = await api.post<AuthResponse>('/auth/login', {
        username,
        password,
        requestedRoleScope: selectedRole
      });

      // Commits JWT token packet claims straight into sessionStorage hooks
      loginSession(response.data);
    } catch (error: any) {
      console.error('Authentication gateway rejection payload:', error);
      const fallbackMsg = `Access Denied: Invalid credentials for security scope tier [${selectedRole}].`;
      setAuthError(error.response?.data?.message || fallbackMsg);
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <div className="loader-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--canvas)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'var(--row-hover)', color: 'var(--accent)', marginBottom: '16px' }}>
            <Shield size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>CentraLog Core Gateway</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Role-Based Access Control Audit Protocol</p>
        </div>

        {authError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--clr-danger)', padding: '12px', borderRadius: '6px', color: 'var(--clr-danger)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Operator Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., james.bayonas"
                style={{ width: '100%', padding: '12px 12px 12px 38px', boxSizing: 'border-box', background: 'var(--canvas)', color: 'var(--text-primary)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Security Token / Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 12px 12px 38px', boxSizing: 'border-box', background: 'var(--canvas)', color: 'var(--text-primary)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Clearance Scope Level</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--canvas)', color: 'var(--text-primary)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Inventory Staff">Inventory Custodian / Staff Tiers</option>
              <option value="Accountant">Accountant / Auditor Tiers</option>
              <option value="Manager">System Admin / Management Tiers</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={authenticating}
            className="action-button primary" 
            style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}
          >
            {authenticating ? 'Verifying Integrity Token...' : 'Authorize Vault Session'}
          </button>
        </form>

      </div>
    </div>
  );
};