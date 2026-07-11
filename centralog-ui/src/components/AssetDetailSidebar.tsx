import React from 'react';
import { type Asset, DepreciationMethodMap, LifecycleStateMap } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, TrendingDown, Calendar, HardDrive, Settings } from 'lucide-react';

interface AssetDetailSidebarProps {
  asset: Asset | null;
  onClose: () => void;
  onInitiateMaintenance: (id: number) => Promise<void>;
  onResolveMaintenance: (id: number) => Promise<void>;
}

export const AssetDetailSidebar: React.FC<AssetDetailSidebarProps> = ({
  asset,
  onClose,
  onInitiateMaintenance,
  onResolveMaintenance
}) => {
  const { hasClearance } = useAuth();
  if (!asset) return null;

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Unknown', color: 'gray' };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '460px', height: '100vh', background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: '-10px 0 25px rgba(0,0,0,0.3)', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Context */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardDrive size={20} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Asset Ledger Audit</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* High Density Scrollable Data Deck */}
      <div style={{ padding: '24px', flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Core Profile */}
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Hardware Descriptor</span>
          <h2 style={{ margin: '4px 0 8px 0', fontSize: '22px', fontWeight: 700 }}>{asset.name}</h2>
          <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', background: 'var(--surface-raised)', border: `1px solid ${stateMeta.color}`, color: stateMeta.color, fontSize: '12px', fontWeight: 600 }}>
            {stateMeta.label}
          </div>
          {asset.isMaintenanceFlagged && (
            <div style={{ marginTop: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--clr-warning)', padding: '10px', borderRadius: '6px', fontSize: '12px', color: 'var(--clr-warning)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldAlert size={14} />
              <span><strong>Preventative Flag:</strong> Maintenance date threshold tripped in database[cite: 93, 98].</span>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* Real-time Accounting Algorithms Box */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={14} /> Valuation & Depreciation Engine [cite: 24]
          </h4>
          <div style={{ background: 'var(--surface-raised)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Initial Procurement Cost</span>
              <span className="mono" style={{ fontWeight: 600 }}>₱{asset.procurementCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Accounting Formula</span>
              <span style={{ fontSize: '12px' }}>{DepreciationMethodMap[asset.depreciationMethod] || 'Not Set'} </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expected Lifespan Span</span>
              <span className="mono">{asset.expectedLifespanMonths} Months</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Residual Salvage Value Basis</span>
              <span className="mono">₱{asset.salvageValue.toLocaleString()}</span>
            </div>
            {asset.lifecycleState === 3 && (
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: 'var(--clr-warning)', textAlign: 'center' }}>
                * Real-time calculation frozen for duration of maintenance window status.
              </div>
            )}
          </div>
        </div>

        {/* Relational Placement Reference Grid */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Operational Environment Mapping [cite: 26]
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1s 1s', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>ROOM ALLOCATION KEY [cite: 27]</div>
              <span className="mono" style={{ fontWeight: 600 }}>Room #{asset.roomId}</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>CUSTODIAN ASSIGNMENT KEY [cite: 27]</div>
              <span className="mono" style={{ fontWeight: 600 }}>Handler #{asset.custodianId}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Contextual Action Execution Drawer */}
      {hasClearance(['Inventory Staff', 'Manager']) && (
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} /> Sequential Lifecycle Phase Advance [cite: 37]
          </h4>
          
          {asset.lifecycleState === 2 && (
            <button 
              onClick={() => onInitiateMaintenance(asset.id)}
              className="action-button secondary" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center', color: 'var(--clr-warning)', borderColor: 'var(--clr-warning)' }}
            >
              Transfer Out to Active Repair Loop [cite: 37, 88]
            </button>
          )}

          {asset.lifecycleState === 3 && (
            <button 
              onClick={() => onResolveMaintenance(asset.id)}
              className="action-button primary" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
            >
              Sign Off Calibration Workflow Completion [cite: 101]
            </button>
          )}

          {asset.lifecycleState === 5 && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
              This resource matrix node is structurally finalized and unmodifiable[cite: 37, 70].
            </span>
          )}
        </div>
      )}

    </div>
  );
};