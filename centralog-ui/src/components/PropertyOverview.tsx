import React, { useState, useEffect, useRef } from 'react';
import { 
  assetApiEnriched, 
  getMediaUrl,
  type Asset, 
  type AssetHistoryDto, 
  LifecycleStateMap,
  type UpdatePropertyPayload,
  type UpdateCustodianPayload
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Printer, 
  ArrowLeft, 
  UserCheck, 
  Edit3, 
  ClipboardCheck, 
  Tag, 
  RefreshCw, 
  HardDrive,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import './PropertyOverview.css';

interface PropertyOverviewProps {
  assetId: number;
  onBack: () => void;
}

export const PropertyOverview: React.FC<PropertyOverviewProps> = ({ assetId, onBack }) => {
  const { user } = useAuth();
  const isAccountant = user?.roleName === 'Accountant';
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetHistoryDto | null>(null);
  const [activeTab, setActiveTab] = useState<'transfer' | 'inventory' | 'attached'>('transfer');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showCustodianModal, setShowCustodianModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEditModal && !showCustodianModal) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modalRef.current?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [showEditModal, showCustodianModal]);

  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      if (showEditModal) setShowEditModal(false);
      if (showCustodianModal) setShowCustodianModal(false);
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const [editForm, setEditForm] = useState<UpdatePropertyPayload>({
    name: '',
    propertyNumber: '',
    serialNumber: '',
    accountCategory: '',
    categoryTag: '',
    procurementCost: 0,
    acquisitionDate: new Date().toISOString().split('T')[0],
    description: '',
    imageUrl: ''
  });

  const [custodianForm, setCustodianForm] = useState<UpdateCustodianPayload>({
    newCustodianId: 1,
    newRoomId: 101
  });

  const handleRecordInventory = async () => {
    if (!asset) return;
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await assetApiEnriched.verifyInventory(asset.id);
      setActionFeedback(res.message);
      await loadData();
    } catch (err: any) {
      setActionFeedback(`Inventory Record Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await assetApiEnriched.getAssetById(assetId);
      const historyData = await assetApiEnriched.getAssetHistory(assetId);
      setAsset(data);
      setHistory(historyData);

      setEditForm({
        name: data.name || '',
        propertyNumber: data.propertyNumber || '',
        serialNumber: data.serialNumber || '',
        accountCategory: data.accountCategory || data.categoryTag || '',
        categoryTag: data.categoryTag || '',
        procurementCost: data.procurementCost || 0,
        acquisitionDate: data.acquisitionDate 
          ? new Date(data.acquisitionDate).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
        description: data.description || '',
        imageUrl: data.imageUrl || ''
      });

      setCustodianForm({
        newCustodianId: data.custodianId || 1,
        newRoomId: data.roomId || 101
      });
    } catch (err: any) {
      setActionFeedback(`Error loading asset details: ${err.message}`);
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

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await assetApiEnriched.uploadImage(file);
      setEditForm(prev => ({ ...prev, imageUrl: res.imageUrl }));
      setActionFeedback("Property photo updated.");
    } catch (err: any) {
      setActionFeedback(`Upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setIsSubmitting(true);
    setActionFeedback(null);

    // Sanitize acquisitionDate and optional strings prior to API dispatch
    const sanitizedAcquisitionDate = editForm.acquisitionDate && !isNaN(Date.parse(editForm.acquisitionDate))
      ? editForm.acquisitionDate
      : new Date().toISOString().split('T')[0];

    const sanitizedPayload: UpdatePropertyPayload = {
      ...editForm,
      name: editForm.name.trim(),
      propertyNumber: editForm.propertyNumber?.trim() || '',
      serialNumber: editForm.serialNumber?.trim() || '',
      accountCategory: editForm.accountCategory?.trim() || '',
      categoryTag: editForm.categoryTag?.trim() || '',
      acquisitionDate: sanitizedAcquisitionDate,
      description: editForm.description?.trim() || ''
    };

    try {
      const response = await assetApiEnriched.updateProperty(asset.id, sanitizedPayload);
      setActionFeedback(response.message);
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      setActionFeedback(`Update Rejected: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustodianReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const response = await assetApiEnriched.updateCustodianAssignment(asset.id, custodianForm);
      setActionFeedback(response.message);
      setShowCustodianModal(false);
      await loadData();
    } catch (err: any) {
      setActionFeedback(`Reassignment Rejected: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !asset) {
    return <div className="property-loading" role="status">Loading property details…</div>;
  }

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Serviceable', color: 'var(--clr-success)' };
  const recordedPropertyNumber = asset.propertyNumber?.trim();
  const recordedSerialNumber = asset.serialNumber?.trim();

  return (
    <div className="property-page">
      
      <div className="property-toolbar">
        <button type="button" onClick={onBack} className="property-toolbar-button">
          <ArrowLeft size={16} /> Properties
        </button>
        <button type="button" onClick={() => window.print()} className="property-toolbar-button property-print-button">
          <Printer size={16} /> Print property page
        </button>
      </div>

      <div className="property-intro">
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>PROPERTY OVERVIEW</div>
        <h1>{recordedPropertyNumber || `Asset #${asset.id}`}</h1>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage assignments, inventory, transfers, attachments, and reports for this property.</span>
      </div>

      {actionFeedback && (
        <div className="property-feedback" role="status">
          <span>{actionFeedback}</span>
          <button type="button" onClick={() => setActionFeedback(null)} aria-label="Dismiss notification"><X size={17} aria-hidden="true" /></button>
        </div>
      )}

      <div className="property-layout">
        <div className="property-summary">
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ height: '180px', backgroundColor: 'var(--surface-raised)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', overflow: 'hidden' }}>
              {asset.imageUrl ? (
                <img 
                  src={getMediaUrl(asset.imageUrl)} 
                  alt={asset.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} 
                />
              ) : (
                <HardDrive size={48} />
              )}
            </div>

            <div className="property-identity-row">
              <span style={{ background: 'var(--accent)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                {recordedPropertyNumber || 'Property no. not recorded'}
              </span>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: stateMeta.color, border: `1px solid ${stateMeta.color}`, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                {stateMeta.label}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>SERIAL NUMBER:</span> <strong className="mono">{recordedSerialNumber || 'Not recorded'}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>UNIT VALUE:</span> <strong className="mono">₱{asset.procurementCost.toLocaleString()}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>ACCOUNT:</span> <strong>{asset.accountCategory || asset.categoryTag}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>ACQUISITION DATE:</span> <strong className="mono">{new Date(asset.acquisitionDate || asset.createdAt).toLocaleDateString()}</strong></div>
            </div>
          </div>

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

        <div className="property-main">
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Property Description</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
              {asset.description || 'No property description has been recorded.'}
            </p>
          </div>
          {!isAccountant && (
            <div className="property-action-grid">
              <button type="button" className="property-action-tile"
                onClick={() => setShowCustodianModal(true)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Update End User</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Change property assignment</div>
                </div>
                <UserCheck size={18} style={{ color: 'var(--accent)' }} />
              </button>

              <button type="button" className="property-action-tile"
                onClick={() => setShowEditModal(true)}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Edit Property</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Update property details</div>
                </div>
                <Edit3 size={18} style={{ color: 'var(--accent)' }} />
              </button>

              <button type="button" className="property-action-tile"
                onClick={handleRecordInventory}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Record Inventory</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Track inventory status</div>
                </div>
                <ClipboardCheck size={18} style={{ color: 'var(--clr-warning)' }} />
              </button>

              <button type="button" onClick={handleToggleQueue} className={`property-action-tile ${asset.isStickerQueued ? 'is-queued' : ''}`} aria-pressed={asset.isStickerQueued}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{asset.isStickerQueued ? 'Queued for Printing' : 'Add To My Sticker Queue'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Add to my sticker queue for printing</div>
                </div>
                <Tag size={18} style={{ color: 'var(--accent)' }} />
              </button>
            </div>
          )}
          <div className="property-history">
            <div className="property-history-tabs" role="tablist" aria-label="Property history">
              <button type="button" role="tab" aria-selected={activeTab === 'transfer'} aria-controls="property-history-content" onClick={() => setActiveTab('transfer')} className={activeTab === 'transfer' ? 'is-active' : ''}>
                Transfer History
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'inventory'} aria-controls="property-history-content" onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'is-active' : ''}>
                Inventory Logs
              </button>
            </div>

            <div id="property-history-content" className="property-history-content" role="tabpanel">
              {activeTab === 'transfer' && (
                history?.timelineEntries && history.timelineEntries.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {history.timelineEntries.map(entry => (
                      <div key={entry.logId} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px', fontSize: '12px' }}>
                        <div>Transferred from {entry.oldRoomName} to {entry.newRoomName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Assigned Custodian: {entry.newCustodianName} • By @{entry.operatorUsername} on {new Date(entry.timestamp).toLocaleString()}</div>
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

      {showEditModal && (
        <div className="property-modal-overlay">
          <div ref={modalRef} tabIndex={-1} onKeyDown={handleModalKeyDown} className="property-modal" role="dialog" aria-modal="true" aria-labelledby="property-edit-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 id="property-edit-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Edit property</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="property-modal-close" aria-label="Close edit property dialog"><X size={18} /></button>
            </div>

            <form onSubmit={handleEditPropertySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label htmlFor="property-edit-name" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Property name</label>
                <input id="property-edit-name" type="text" required value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
              </div>

              {/* REINSTATED PHOTO FILE UPLOADER SECTION */}
              <div>
                <label htmlFor="property-edit-photo" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Upload new photo</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: '4px', background: 'var(--canvas)' }}>
                  <input id="property-edit-photo" type="file" accept="image/*" onChange={handleModalFileUpload} disabled={isUploadingImage} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }} />
                  {isUploadingImage ? (
                    <RefreshCw size={16} className="spin text-bright" />
                  ) : editForm.imageUrl ? (
                    <ImageIcon size={16} className="text-success" />
                  ) : (
                    <Upload size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <span style={{ color: editForm.imageUrl ? 'var(--clr-success)' : 'var(--text-muted)', fontSize: '12px' }}>
                    {isUploadingImage ? 'Uploading photo file...' : editForm.imageUrl ? 'Photo Attached (Click to Replace)' : 'Select Image File'}
                  </span>
                </div>
              </div>

              <div className="property-form-pair">
                <div>
                  <label htmlFor="property-edit-code" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Property code / tag</label>
                  <input id="property-edit-code" type="text" placeholder="Not recorded" value={editForm.propertyNumber} onChange={(e) => setEditForm(p => ({ ...p, propertyNumber: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label htmlFor="property-edit-serial" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Serial number</label>
                  <input id="property-edit-serial" type="text" placeholder="Not recorded" value={editForm.serialNumber} onChange={(e) => setEditForm(p => ({ ...p, serialNumber: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <p className="property-form-note">Leave unassigned numbers blank. Stickers only show numbers saved on the asset record.</p>

              <div className="property-form-pair">
                <div>
                  <label htmlFor="property-edit-account" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Account classification</label>
                  <input id="property-edit-account" type="text" value={editForm.accountCategory} onChange={(e) => setEditForm(p => ({ ...p, accountCategory: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label htmlFor="property-edit-category" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Category tag</label>
                  <input id="property-edit-category" type="text" value={editForm.categoryTag} onChange={(e) => setEditForm(p => ({ ...p, categoryTag: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="property-form-pair">
                <div>
                  <label htmlFor="property-edit-cost" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Procurement cost (₱)</label>
                  <input 
                    id="property-edit-cost"
                    type="number" 
                    min="0" 
                    max="100000000"
                    step="0.01"
                    value={editForm.procurementCost} 
                    onChange={(e) => setEditForm(p => ({ ...p, procurementCost: Number(e.target.value) }))} 
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} 
                  />
                </div>
                <div>
                  <label htmlFor="property-edit-date" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Acquisition date</label>
                  <input id="property-edit-date" type="date" value={editForm.acquisitionDate} onChange={(e) => setEditForm(p => ({ ...p, acquisitionDate: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label htmlFor="property-edit-description" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                <textarea id="property-edit-description" rows={3} value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploadingImage} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: 'var(--accent-contrast)', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Commit Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustodianModal && (
        <div className="property-modal-overlay">
          <div ref={modalRef} tabIndex={-1} onKeyDown={handleModalKeyDown} className="property-modal property-modal-small" role="dialog" aria-modal="true" aria-labelledby="property-reassign-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 id="property-reassign-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Reassign custodian and room</h2>
              <button type="button" onClick={() => setShowCustodianModal(false)} className="property-modal-close" aria-label="Close reassignment dialog"><X size={18} /></button>
            </div>

            <form onSubmit={handleCustodianReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label htmlFor="property-reassign-custodian" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>Custodian</label>
                <select id="property-reassign-custodian" value={custodianForm.newCustodianId} onChange={(e) => setCustodianForm(p => ({ ...p, newCustodianId: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}>
                  <option value={1}>Custodian #1 (Systems Lead)</option>
                  <option value={2}>Custodian #2 (Network Admin)</option>
                </select>
              </div>

              <div>
                <label htmlFor="property-reassign-room" style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>Room</label>
                <select id="property-reassign-room" value={custodianForm.newRoomId} onChange={(e) => setCustodianForm(p => ({ ...p, newRoomId: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}>
                  <option value={101}>Room 101 (Admin Office)</option>
                  <option value={202}>Room 202 (Server Room)</option>
                  <option value={303}>Room 303 (Laboratory)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCustodianModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: 'var(--accent-contrast)', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Updating...' : 'Authorize Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
