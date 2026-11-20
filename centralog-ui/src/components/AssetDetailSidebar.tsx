// centralog-ui/src/components/AssetDetailSidebar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { assetApi, assetApiEnriched, type Asset, type AssetHistoryDto, DepreciationMethodMap, LifecycleStateMap } from '../services/api';
import { formatAuditTimestamp } from '../services/auditTimestamp';
import { useAuth } from '../context/AuthContext';
import { X, ShieldAlert, TrendingDown, Calendar, HardDrive, Settings, Trash2, History, Maximize2 } from 'lucide-react';
import './AssetDetailSidebar.css';

interface AssetDetailSidebarProps {
  asset: Asset | null;
  onClose: () => void;
  onInitiateMaintenance: (id: number) => Promise<void>;
  onResolveMaintenance: (id: number) => Promise<void>;
  onActivateAsset: (id: number) => Promise<void>;
  onOpenOverview: (id: number) => void;
}

export const AssetDetailSidebar: React.FC<AssetDetailSidebarProps> = ({
  asset,
  onClose,
  onInitiateMaintenance,
  onResolveMaintenance,
  onActivateAsset,
  onOpenOverview
}) => {
  const { user, hasClearance } = useAuth();
  const [scrapValue, setScrapValue] = useState<string>('0');
  const [disposalReason, setDisposalReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [historyTimeline, setHistoryTimeline] = useState<AssetHistoryDto | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const inspectedAssetId = asset?.id;
  const canReadAuditLog = hasClearance(['Accountant', 'SystemAdmin']);

  useEffect(() => {
    if (inspectedAssetId == null) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    drawerRef.current?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [inspectedAssetId]);

  useEffect(() => {
    if (!asset) {
      setHistoryTimeline(null);
      return;
    }
    let cancelled = false;

    const fetchAuditTimelineData = async () => {
      setIsTimelineLoading(true);
      setTimelineError(null);
      try {
        let data = await assetApi.getAssetHistory(asset.id);
        if (cancelled) return;
        if (canReadAuditLog && data.timelineEntries.some(entry => entry.changeSummary == null)) {
          try {
            // The older API includes summaries only in the role-restricted Audit log.
            const auditEntries = await assetApiEnriched.getAuditLog();
            const summaries = new Map(auditEntries
              .filter(entry => entry.assetId === asset.id)
              .map(entry => [entry.logId, entry.changeSummary]));
            data = { ...data, timelineEntries: data.timelineEntries.map(entry => ({
              ...entry, changeSummary: entry.changeSummary ?? summaries.get(entry.logId),
            })) };
          } catch {
            // The asset history remains available when the report cannot be loaded.
          }
        }
        if (!cancelled) setHistoryTimeline(data);
      } catch (err) {
        if (!cancelled) {
          setTimelineError(err instanceof Error ? err.message : 'Unable to load asset history.');
        }
      } finally {
        if (!cancelled) setIsTimelineLoading(false);
      }
    };

    fetchAuditTimelineData();
    return () => { cancelled = true; };
  }, [asset, canReadAuditLog]);

  if (!asset) return null;

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Unknown', color: 'gray' };

  const numericState = Number(asset.lifecycleState);
  const stringState = String(asset.lifecycleState).toLowerCase();

  const isDisposed = numericState === 5 || stringState === 'disposed';
  const isInMaintenance = numericState === 3 || stringState === 'inmaintenance';

  const handleDecommissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("CRITICAL WARNING: Decommissioning this asset is a permanent operation. This record node will be permanently locked against future modifications. Proceed?")) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await assetApi.disposeAsset(
        asset.id, 
        disposalReason.trim() || "Routine structural retirement sweep.", 
        Number(scrapValue)
      );
      alert(response.message || "Asset successfully removed from active capitalization registers.");
      onClose();
      window.location.reload();
    } catch (error: any) {
      alert(`Disposal Rejected: ${error.message || 'Validation error or state mismatch.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="asset-drawer-backdrop">
    <aside
      ref={drawerRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-drawer-title"
      className="asset-drawer"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      
      {/* Header Context */}
      <div className="asset-drawer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardDrive size={20} style={{ color: 'var(--accent)' }} />
          <h2 id="asset-drawer-title">Asset details</h2>
        </div>
        <button type="button" onClick={onClose} className="asset-drawer-close" aria-label="Close asset details">
          <X size={20} />
        </button>
      </div>

      {/* High Density Scrollable Data Deck */}
      <div className="asset-drawer-content">
        
        {/* Core Profile */}
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Asset</span>
          <h3 className="asset-drawer-name">{asset.name}</h3>
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
            <TrendingDown size={14} /> Value and depreciation
          </h4>
          <div className="asset-drawer-value-facts" style={{ background: 'var(--surface-raised)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Procurement cost</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₱{asset.procurementCost.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Depreciation method</span>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{DepreciationMethodMap[asset.depreciationMethod] || 'Not Set'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Expected lifespan</span>
              <span className="mono" style={{ color: 'var(--text-primary)' }}>{asset.expectedLifespanMonths} Months</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Salvage value</span>
              <span className="mono" style={{ color: 'var(--text-primary)' }}>₱{asset.salvageValue.toLocaleString()}</span>
            </div>
            {isInMaintenance && (
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '10px', fontSize: '11px', color: 'var(--clr-warning)', textAlign: 'center' }}>
                Depreciation is paused during maintenance.
              </div>
            )}
          </div>
        </div>

        {/* Relational Placement Reference Grid */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Location and custodian
          </h4>
          <div className="asset-drawer-facts">
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>ROOM</div>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Room #{asset.roomId}</span>
            </div>
            <div style={{ background: 'var(--surface-raised)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>CUSTODIAN</div>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Custodian #{asset.custodianId}</span>
            </div>
          </div>
        </div>

        {/* Immutable Audit Trail Timeline */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={14} /> Asset history
          </h4>
          
          <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isTimelineLoading && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Syncing chronological log registry...</span>
            )}
            
            {timelineError && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{timelineError}</span>
            )}

            {!isTimelineLoading && !timelineError && historyTimeline?.assetId === asset.id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                {historyTimeline.timelineEntries.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No changes have been recorded for this asset.</span>
                ) : (
                  historyTimeline.timelineEntries.map((log) => (
                    <div key={log.logId} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px', marginLeft: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: 'var(--clr-warning)', fontWeight: 600 }}>@{log.operatorUsername}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{formatAuditTimestamp(log.timestamp)}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        {log.changeSummary?.trim() || 'Asset record changed'}
                      </span>
                      {log.oldRoomId !== log.newRoomId && (
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          Transferred from <strong>{log.oldRoomName}</strong> to <strong>{log.newRoomName}</strong>.
                        </span>
                      )}
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
        {!isDisposed && !isInMaintenance && hasClearance(['Manager', 'SystemAdmin']) && (
          <div style={{ border: '1px dashed var(--clr-danger)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(239, 68, 68, 0.02)' }}>
            <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--clr-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={14} /> Retire asset
            </h4>
            <form onSubmit={handleDecommissionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label htmlFor="asset-scrap-value" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Scrap recovery value (₱)</label>
                <input 
                  id="asset-scrap-value"
                  type="number" 
                  min="0"
                  value={scrapValue} 
                  onChange={(e) => setScrapValue(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label htmlFor="asset-disposal-reason" style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Disposal reason</label>
                <input 
                  id="asset-disposal-reason"
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
                {isProcessing ? 'Retiring asset…' : 'Retire asset permanently'}
              </button>
            </form>
          </div>
        )}

      </div>
      
      {/* Contextual Action Execution Drawer */}
      {hasClearance(['Inventory Staff', 'Manager', 'SystemAdmin', 'InventoryStaff', 'Accountant']) && (
        <div className="asset-drawer-actions">
          <h4 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={12} /> {user?.roleName === 'Accountant' ? 'Asset details' : 'Asset actions'}
          </h4>
          
          <button 
            onClick={() => onOpenOverview(asset.id)}
            className="action-button primary" 
            style={{ width: '100%', padding: '12px', justifyContent: 'center', fontWeight: 600, backgroundColor: 'var(--accent)', border: 'none', color: 'var(--accent-contrast)', borderRadius: '4px', marginBottom: '8px', cursor: 'pointer' }}
          >
            <Maximize2 size={16} style={{ marginRight: '8px' }}/> Open property details
          </button>

          {/* Operational Mutation Buttons: Hidden specifically for Accountants */}
          {user?.roleName !== 'Accountant' && (
            <>
              {(numericState === 1 || stringState === 'procured') && (
                <button 
                  onClick={() => onActivateAsset(asset.id)}
                  className="action-button primary" 
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', cursor: 'pointer', fontWeight: 600, backgroundColor: 'var(--clr-success)', border: 'none', color: '#fff', borderRadius: '4px' }}
                >
                  Activate asset
                </button>
              )}
              
              {(numericState === 2 || stringState === 'active') && (
                <button 
                  onClick={() => onInitiateMaintenance(asset.id)}
                  className="action-button secondary" 
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', color: 'var(--clr-warning)', borderColor: 'var(--clr-warning)', cursor: 'pointer', fontWeight: 600, borderRadius: '4px' }}
                >
                  Start maintenance
                </button>
              )}

              {(numericState === 3 || stringState === 'inmaintenance') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 600 }}>MAINTENANCE</span>
                  
                  <button 
                    onClick={() => onResolveMaintenance(asset.id)}
                    className="action-button primary" 
                    style={{ width: '100%', padding: '12px', justifyContent: 'center', cursor: 'pointer', fontWeight: 600, backgroundColor: 'var(--clr-success)', border: 'none', color: '#fff', borderRadius: '4px' }}
                  >
                    Complete maintenance
                  </button>
                </div>
              )}
            </>
          )}

          {(numericState === 5 || stringState === 'disposed') && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', display: 'block' }}>
              This asset is disposed and cannot be changed here.
            </span>
          )}
        </div>
      )}

    </aside>
    </div>
  );
};
