// File path: centralog-ui/src/components/AssetDetailSidebar.tsx

import React, { useState, useEffect } from 'react';
import { assetApi, type Asset, type AssetHistoryDto, DepreciationMethodMap, LifecycleStateMap } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, TrendingDown, Calendar, HardDrive, Settings, Trash2, History } from 'lucide-react';

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
  const [scrapValue, setScrapValue] = useState<string>('0');
  const [disposalReason, setDisposalReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Feature 9 local data tracking hooks
  const [historyTimeline, setHistoryTimeline] = useState<AssetHistoryDto | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Query audit history whenever a new asset instance is selected
  useEffect(() => {
    if (!asset) {
      setHistoryTimeline(null);
      return;
    }

    const fetchAuditTimelineData = async () => {
      setIsTimelineLoading(true);
      setTimelineError(null);
      try {
        const data = await assetApi.getAssetHistory(asset.id);
        setHistoryTimeline(data);
      } catch (err: any) {
        console.error('Timeline retrieval failed:', err);
        setTimelineError(err.message || 'Failed to pull audit trail records.');
      } finally {
        setIsTimelineLoading(false);
      }
    };

    fetchAuditTimelineData();
  }, [asset]);

  if (!asset) return null;

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Unknown', color: 'gray' };

  const handleDecommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("CRITICAL WARNING: Decommissioning this asset is a permanent operation. This record node will be permanently locked against future modifications. Proceed?")) {
      return;
    }
    
    setIsProcessing(true);
    try {
      await assetApi.disposeAsset(asset.id, disposalReason || "Routine structural retirement sweep.", Number(scrapValue));
      alert("Asset successfully removed from active capitalization registers.");
      onClose();
      window.location.reload(); // Force core ledger state synchronization
    } catch (error: any) {
      alert(`Disposal Rejected: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
              <span><strong>Preventative Flag:</strong> Maintenance date threshold tripped in database.</span>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* Real-time Accounting Algorithms Box */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={14} /> Valuation & Depreciation Engine
          </h4>
          <div style={{ background: 'var(--surface-raised)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Initial Procurement Cost</span>
              <span className="mono" style={{ fontWeight: 600 }}>₱{asset.procurementCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Accounting Formula</span>
              <span style={{ fontSize: '12px' }}>{DepreciationMethodMap[asset.depreciationMethod] || 'Not Set'}</span>
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
            <Calendar size={14} /> Operational Environment Mapping
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>ROOM ALLOCATION KEY</div>
              <span className="mono" style={{ fontWeight: 600 }}>Room #{asset.roomId}</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>CUSTODIAN ASSIGNMENT KEY</div>
              <span className="mono" style={{ fontWeight: 600 }}>Handler #{asset.custodianId}</span>
            </div>
          </div>
        </div>

        {/* FEATURE 9: IMMUTABLE AUDIT TRAIL CHRONOLOGICAL TIMELINE CHIP */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={14} /> System Interaction & Audit Logs
          </h4>
          
          <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isTimelineLoading && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Syncing chronological log registry...</span>
            )}
            
            {timelineError && (
              <span style={{ fontSize: '12px', color: 'var(--clr-danger)' }}>{timelineError}</span>
            )}

            {!isTimelineLoading && !timelineError && historyTimeline && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                {historyTimeline.timelineEntries.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No historical relocations logged for this resource mapping node.</span>
                ) : (
                  historyTimeline.timelineEntries.map((log) => (
                    <div key={log.logId} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px', marginLeft: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: 'var(--fb-warning)', fontWeight: 600 }}>@{log.operatorUsername}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        {log.oldRoomId !== log.newRoomId ? (
                          <>Transferred layout from <strong>{log.oldRoomName}</strong> to <strong>{log.newRoomName}</strong>.</>
                        ) : (
                          <>Asset status verified/decommissioned natively inside current workspace.</>
                        )}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Assigned Custodian: {log.newCustodianName}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Manager-Exclusive Asset Decommission Form Panel */}
        {asset.lifecycleState !== 5 && hasClearance(['Manager', 'SystemAdmin']) && (
          <div style={{ border: '1px dashed var(--clr-danger)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(239, 68, 68, 0.02)' }}>
            <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--clr-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={14} /> Institutional Asset Decommission Panel
            </h4>
            <form onSubmit={handleDecommissionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Scrap Recovery Value (₱)</label>
                <input 
                  type="number" 
                  min="0"
                  value={scrapValue} 
                  onChange={(e) => setScrapValue(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Auditable Disposal Justification</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Hardware obsolescence..."
                  value={disposalReason} 
                  onChange={(e) => setDisposalReason(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                style={{ width: '100%', padding: '10px', background: 'var(--clr-danger)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isProcessing ? 'Processing Decommission...' : 'Execute Permanent Retirement'}
              </button>
            </form>
          </div>
        )}

      </div>
      
      {/* Contextual Action Execution Drawer - Enhanced with Interactive Resolution Fields */}
     {/* Contextual Action Execution Drawer - Enhanced with Multi-Type Model Parsing */}
      {hasClearance(['Inventory Staff', 'Manager', 'SystemAdmin', 'InventoryStaff']) && (
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} /> Sequential Lifecycle Phase Advance
          </h4>
          
          {/* SAFE CHECK: Handles both numeric enum evaluation (2) and serialized string representation ("Active") */}
          {(asset.lifecycleState === 2 || String(asset.lifecycleState).toLowerCase() === 'active') && (
            <button 
              onClick={() => onInitiateMaintenance(asset.id)}
              className="action-button secondary" 
              style={{ width: '100%', padding: '12px', justifyContent: 'center', color: 'var(--clr-warning)', borderColor: 'var(--clr-warning)', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}
            >
              Transfer Out to Active Repair Loop
            </button>
          )}

          {/* SAFE CHECK: Handles both numeric enum evaluation (3) and serialized string representation ("InMaintenance") */}
          {(asset.lifecycleState === 3 || String(asset.lifecycleState).toLowerCase() === 'inmaintenance') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>CLOSE OUT TRACKING MAINTENANCE LOG</span>
              
              <button 
                onClick={() => onResolveMaintenance(asset.id)}
                className="action-button primary" 
                style={{ width: '100%', padding: '12px', justifyContent: 'center', cursor: 'pointer', fontWeight: 600, backgroundColor: 'var(--clr-success)', border: 'none', color: '#fff', borderRadius: '4px' }}
              >
                Confirm Repair Completion & Unfreeze Asset
              </button>
            </div>
          )}

          {/* SAFE CHECK: Handles decommissioned termination boundaries */}
          {(asset.lifecycleState === 5 || String(asset.lifecycleState).toLowerCase() === 'disposed') && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
              This resource matrix node is structurally finalized and unmodifiable.
            </span>
          )}
        </div>
      )}

    </div>
  );
};