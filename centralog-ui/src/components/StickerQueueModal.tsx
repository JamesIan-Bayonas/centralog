import React, { useEffect, useState } from 'react';
import { assetApiEnriched, type Asset } from '../services/api';
import { Printer, Tag, Trash2, X, RefreshCw, QrCode } from 'lucide-react';

interface StickerQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQueueUpdated?: () => void;
}

export const StickerQueueModal: React.FC<StickerQueueModalProps> = ({
  isOpen,
  onClose,
  onQueueUpdated
}) => {
  const [queuedAssets, setQueuedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const queueData = await assetApiEnriched.getStickerQueue();
      setQueuedAssets(queueData);
    } catch (err: any) {
      setActionFeedback(`Failed to load sticker queue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const handleRemoveFromQueue = async (assetId: number) => {
    try {
      await assetApiEnriched.toggleStickerQueue(assetId);
      setQueuedAssets(prev => prev.filter(a => a.id !== assetId));
      setActionFeedback(`Asset #${assetId} removed from print queue.`);
      if (onQueueUpdated) onQueueUpdated();
    } catch (err: any) {
      setActionFeedback(`Failed to remove item: ${err.message}`);
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="loader-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-sticker-sheet, .printable-sticker-sheet * {
            visibility: visible !important;
          }
          .printable-sticker-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print-modal {
            display: none !important;
          }
          .sticker-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .sticker-card {
            border: 2px solid #000000 !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 30px rgba(0,0,0,0.5)' }}>
        
        {/* Header - Non-Printable */}
        <div className="no-print-modal" style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-raised)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tag size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Batch Property Sticker Queue</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Queued Items: <strong>{queuedAssets.length}</strong> property tags ready for print layout generation</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={handleTriggerPrint} 
              disabled={queuedAssets.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--clr-success)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: queuedAssets.length === 0 ? 'not-allowed' : 'pointer', opacity: queuedAssets.length === 0 ? 0.5 : 1 }}
            >
              <Printer size={16} /> Print Tag Sheet
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="no-print-modal" style={{ padding: '10px 20px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderBottom: '1px solid var(--border)', color: 'var(--accent)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
          </div>
        )}

        {/* Scrollable Tag Deck */}
        <div className="printable-sticker-sheet" style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
              <div>Fetching queued property tags...</div>
            </div>
          ) : queuedAssets.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Tag size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Sticker Queue Empty</h4>
              <p style={{ margin: 0, fontSize: '13px' }}>Click "Add To My Sticker Queue" on any property card or overview panel to queue tags here.</p>
            </div>
          ) : (
            <div className="sticker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {queuedAssets.map((asset) => {
                const propertyCode = asset.propertyNumber || `SPHV-2026-02-${String(asset.id).padStart(4, '0')}`;
                const serialNum = asset.serialNumber || 'KW16TSDTD2026124-80008';
                
                return (
                  <div key={asset.id} className="sticker-card" style={{ border: '2px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--surface-raised)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                    
                    {/* Top Row: Institution Header & Remove Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--border)', paddingBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--accent)' }}>PROPERTY OF DENR / PENRO</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace' }}>{propertyCode}</div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFromQueue(asset.id)}
                        className="no-print-modal"
                        title="Remove from print queue"
                        style={{ background: 'none', border: 'none', color: 'var(--clr-danger)', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Middle Row: QR Code & Asset Descriptor */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ padding: '8px', background: '#ffffff', borderRadius: '6px', border: '1px solid #d1d5db', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '64px', height: '64px', flexShrink: 0 }}>
                        <QrCode size={52} color="#000000" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>SERIAL:</span> <strong className="mono">{serialNum}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>ACCOUNT:</span> <strong>{asset.accountCategory || asset.categoryTag}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>VALUE:</span> <strong className="mono">₱{asset.procurementCost.toLocaleString()}</strong></div>
                      </div>
                    </div>

                    {/* Bottom Row: Footer Placement Keys */}
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>ROOM: #{asset.roomId}</span>
                      <span>CUSTODIAN: #{asset.custodianId}</span>
                      <span>ACQUIRED: {new Date(asset.acquisitionDate || asset.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation - Non-Printable */}
        <div className="no-print-modal" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'var(--surface-raised)' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Close Queue Window
          </button>
        </div>

      </div>
    </div>
  );
};