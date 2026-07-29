import React, { useState, useEffect } from 'react';
import { assetApiEnriched, type Asset, type AssetHistoryDto, LifecycleStateMap } from '../services/api';
import { Printer, ArrowLeft, UserCheck, Edit3, ClipboardCheck, Tag, RefreshCw, HardDrive } from 'lucide-react';

interface PropertyOverviewProps {
  assetId: number;
  onBack: () => void;
}

export const PropertyOverview: React.FC<PropertyOverviewProps> = ({ assetId, onBack }) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistoryDto | null>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'inventory' | 'attached'>('transfer');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await assetApiEnriched.getAssetById(assetId);
      const historyData = await assetApiEnriched.getAssetHistory(assetId);
      setAsset(data);
      setHistory(historyData);
    } catch (err: any) {
      setActionFeedback(`Error loading asset: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [assetId]);

  const handleToggleQueue = async () => {
    if (!asset) return;
    try {
      const res = await assetApiEnriched.toggleStickerQueue(asset.id);
      setAsset(prev => prev ? { ...prev, isStickerQueued: res.isStickerQueued } : null);
      setActionFeedback(res.message);
    } catch (err: any) { setActionFeedback(err.message); }
  };

  if (loading || !asset) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Property Specification Matrix...</div>;
  }

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Serviceable', color: 'var(--clr-success)' };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--canvas)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Properties
        </button>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
          <Printer size={16} /> Print Sticker
        </button>
      </div>

      {/* Property Badge Header */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>PROPERTY OVERVIEW</div>
        <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 700 }}>{asset.propertyNumber || `SPHV-2026-02-${String(asset.id).padStart(4, '0')}`}</h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage assignments, inventory, transfers, attachments, and reports for this property.</span>
      </div>

      {actionFeedback && (
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', padding: '12px', borderRadius: '6px', color: 'var(--accent)', fontSize: '13px' }}>
          {actionFeedback}
        </div>
      )}

      {/* Main Two-Column Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        
        {/* Left Column - Property Meta Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ height: '180px', backgroundColor: 'var(--surface-raised)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              {asset.imageUrl ? <img src={asset.imageUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : <HardDrive size={48} />}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: 'var(--accent)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                {asset.propertyNumber || `SPHV-2026-02-${String(asset.id).padStart(4, '0')}`}
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: stateMeta.color, border: `1px solid ${stateMeta.color}`, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                {stateMeta.label}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>SERIAL NUMBER:</span> <strong className="mono">{asset.serialNumber || 'KW16TSDTD2026124-80008'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>UNIT VALUE:</span> <strong className="mono">₱{asset.procurementCost.toLocaleString()}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>ACCOUNT:</span> <strong>{asset.accountCategory || asset.categoryTag}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>ACQUISITION DATE:</span> <strong className="mono">{new Date(asset.acquisitionDate || asset.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>

          {/* Current End User Card */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>CURRENT END USER</div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <UserCheck size={28} className="text-success" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Custodian #{asset.custodianId}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Room Assignment: #{asset.roomId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Action Hub & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Property Description Card */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Property Description</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
              {asset.description || `Serial No.: ${asset.serialNumber || 'N/A'} ${asset.name} DISPLAY SIZE: 15.6" BRAND: KIWI DIGITAL TABLETOP DISPLAY.`}
            </p>
          </div>

          {/* 2x2 Quick Action Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Update End User</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Change property assignment</div>
              </div>
              <UserCheck size={18} style={{ color: 'var(--accent)' }} />
            </div>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Edit Property</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Update property details</div>
              </div>
              <Edit3 size={18} style={{ color: 'var(--accent)' }} />
            </div>

            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>Record Inventory</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Track inventory status</div>
              </div>
              <ClipboardCheck size={18} style={{ color: 'var(--clr-warning)' }} />
            </div>

            <div onClick={handleToggleQueue} style={{ backgroundColor: asset.isStickerQueued ? 'rgba(56, 189, 248, 0.1)' : 'var(--surface)', border: `1px solid ${asset.isStickerQueued ? 'var(--accent)' : 'var(--border)'}`, padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{asset.isStickerQueued ? 'Queued for Printing' : 'Add To My Sticker Queue'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Add to my sticker queue for printing</div>
              </div>
              <Tag size={18} style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          {/* Tabbed History Deck */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)' }}>
              <button onClick={() => setActiveTab('transfer')} style={{ padding: '12px 20px', border: 'none', background: activeTab === 'transfer' ? 'var(--surface)' : 'none', color: activeTab === 'transfer' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Transfer History
              </button>
              <button onClick={() => setActiveTab('inventory')} style={{ padding: '12px 20px', border: 'none', background: activeTab === 'inventory' ? 'var(--surface)' : 'none', color: activeTab === 'inventory' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Inventory Logs
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {activeTab === 'transfer' && (
                history?.timelineEntries && history.timelineEntries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {history.timelineEntries.map(entry => (
                      <div key={entry.logId} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px', fontSize: '12px' }}>
                        <div>Transferred from {entry.oldRoomName} to {entry.newRoomName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>By @{entry.operatorUsername} on {new Date(entry.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Transfer History</div>
                    <div style={{ fontSize: '12px' }}>This property has not been transferred yet.</div>
                  </div>
                )
              )}

              {activeTab === 'inventory' && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Active inventory status tracking logs registered for this physical hardware node.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};