import React, { useEffect, useRef, useState } from 'react';
import { assetApiEnriched, type Asset } from '../services/api';
import { Printer, Tag, Trash2, X, RefreshCw } from 'lucide-react';
import './StickerQueueModal.css';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [isOpen]);

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
    <div className="sticker-overlay">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticker-queue-title"
        aria-describedby="sticker-queue-description"
        className="sticker-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key !== 'Tab') return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])'));
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
        
        {/* Header - Non-Printable */}
        <div className="no-print-modal sticker-dialog-header">
          <div className="sticker-dialog-heading">
            <span className="sticker-dialog-icon"><Tag size={20} aria-hidden="true" /></span>
            <div>
              <p className="sticker-dialog-eyebrow">PRINT PREVIEW</p>
              <h2 id="sticker-queue-title">Property sticker queue</h2>
              <p id="sticker-queue-description">{loading ? 'Loading sticker queue…' : `${queuedAssets.length} ${queuedAssets.length === 1 ? 'asset' : 'assets'} ready for a sticker sheet`}</p>
            </div>
          </div>
          <div className="sticker-dialog-controls">
            <button 
              type="button"
              onClick={handleTriggerPrint} 
              disabled={loading || queuedAssets.length === 0}
              className="sticker-print-button"
            >
              <Printer size={17} aria-hidden="true" /> Print sticker sheet
            </button>
            <button type="button" onClick={onClose} className="sticker-close-button" aria-label="Close sticker queue">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="no-print-modal sticker-feedback" role="status">
            <span>{actionFeedback}</span>
            <button type="button" onClick={() => setActionFeedback(null)} aria-label="Dismiss queue notification"><X size={17} aria-hidden="true" /></button>
          </div>
        )}

        {/* Scrollable Tag Deck */}
        <div className="printable-sticker-sheet">
          {loading ? (
            <div className="sticker-empty" role="status">
              <RefreshCw size={24} className="spin" aria-hidden="true" />
              <div>Loading queued stickers…</div>
            </div>
          ) : queuedAssets.length === 0 ? (
            <div className="sticker-empty">
              <Tag size={36} aria-hidden="true" />
              <h3>No stickers queued</h3>
              <p>Open a property and add it to your sticker queue to preview tags here.</p>
            </div>
          ) : (
            <div className="sticker-grid">
              {queuedAssets.map((asset) => {
                const propertyCode = asset.propertyNumber?.trim() || 'Not recorded';
                const serialNum = asset.serialNumber?.trim() || 'Not recorded';
                
                return (
                  <article key={asset.id} className="sticker-card">
                    
                    {/* Top Row: Institution Header & Remove Action */}
                    <div className="sticker-card-header">
                      <div>
                        <p className="sticker-owner">DMCCFI ASSET TAG</p>
                        <span className="sticker-code-label">PROPERTY NO.</span>
                        <strong className="sticker-code mono">{propertyCode}</strong>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveFromQueue(asset.id)}
                        className="no-print-modal sticker-remove-button"
                        aria-label={`Remove ${asset.name} from sticker queue`}
                        title="Remove from print queue"
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </div>

                    {/* Middle Row: Recorded asset identifier and descriptor */}
                    <div className="sticker-card-body">
                      <div className="sticker-asset-id" aria-label={`Asset ID ${asset.id}`}>
                        <span>ASSET ID</span>
                        <strong>#{asset.id}</strong>
                      </div>
                      <div className="sticker-card-details">
                        <strong className="sticker-asset-name">{asset.name}</strong>
                        <div><span>SERIAL:</span> <strong className="mono">{serialNum}</strong></div>
                        <div><span>ACCOUNT:</span> <strong>{asset.accountCategory || asset.categoryTag}</strong></div>
                        <div><span>VALUE:</span> <strong className="mono">₱{asset.procurementCost.toLocaleString()}</strong></div>
                      </div>
                    </div>

                    {/* Bottom Row: Footer Placement Keys */}
                    <div className="sticker-card-footer">
                      <span>ROOM: #{asset.roomId}</span>
                      <span>CUSTODIAN: #{asset.custodianId}</span>
                      <span>ACQUIRED: {new Date(asset.acquisitionDate || asset.createdAt).toLocaleDateString()}</span>
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Navigation - Non-Printable */}
        <div className="no-print-modal sticker-dialog-footer">
          <button type="button" onClick={onClose} className="sticker-footer-close">
            Close queue
          </button>
        </div>

      </div>
    </div>
  );
};
