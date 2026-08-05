import React, { useState, useEffect } from 'react';
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

      // Pre-fill fallback serial number if unassigned in database record
      const resolvedSerial = data.serialNumber && data.serialNumber.trim() !== '' 
        ? data.serialNumber 
        : 'KW16TSDTD2026124-80008';

      setEditForm({
        name: data.name || '',
        propertyNumber: data.propertyNumber || `SPHV-2026-02-${String(data.id).padStart(4, '0')}`,
        serialNumber: resolvedSerial,
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
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading Property Specification Matrix...</div>;
  }

  const stateMeta = LifecycleStateMap[asset.lifecycleState] || { label: 'Serviceable', color: 'var(--clr-success)' };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--canvas)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Properties
        </button>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
          <Printer size={16} /> Print Sticker
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>PROPERTY OVERVIEW</div>
        <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 700 }}>{asset.propertyNumber || `SPHV-2026-02-${String(asset.id).padStart(4, '0')}`}</h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manage assignments, inventory, transfers, attachments, and reports for this property.</span>
      </div>

      {actionFeedback && (
        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid var(--accent)', padding: '12px', borderRadius: '6px', color: 'var(--accent)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-muted)' }}>Property Description</h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
              {asset.description || `Serial No.: ${asset.serialNumber || 'KW16TSDTD2026124-80008'} ${asset.name} DISPLAY SIZE: 15.6" BRAND: KIWI DIGITAL TABLETOP DISPLAY.`}
            </p>
          </div>
          {!isAccountant && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div 
                onClick={() => setShowCustodianModal(true)}
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>Update End User</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Change property assignment</div>
                </div>
                <UserCheck size={18} style={{ color: 'var(--accent)' }} />
              </div>

              <div 
                onClick={() => setShowEditModal(true)}
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>Edit Property</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Update property details</div>
                </div>
                <Edit3 size={18} style={{ color: 'var(--accent)' }} />
              </div>

              <div 
                onClick={handleRecordInventory}
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
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
          )}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', width: '100%', maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Edit Property Specification</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditPropertySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Property Name</label>
                <input type="text" required value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
              </div>

              {/* REINSTATED PHOTO FILE UPLOADER SECTION */}
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Upload New Photo Attachment</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: '4px', background: 'var(--canvas)' }}>
                  <input type="file" accept="image/*" onChange={handleModalFileUpload} disabled={isUploadingImage} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }} />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Property Code / Tag</label>
                  <input type="text" value={editForm.propertyNumber} onChange={(e) => setEditForm(p => ({ ...p, propertyNumber: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Serial Number</label>
                  <input type="text" value={editForm.serialNumber} onChange={(e) => setEditForm(p => ({ ...p, serialNumber: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Account Classification</label>
                  <input type="text" value={editForm.accountCategory} onChange={(e) => setEditForm(p => ({ ...p, accountCategory: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Category Tag</label>
                  <input type="text" value={editForm.categoryTag} onChange={(e) => setEditForm(p => ({ ...p, categoryTag: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Procurement Cost (₱)</label>
                  <input type="number" min="0" value={editForm.procurementCost} onChange={(e) => setEditForm(p => ({ ...p, procurementCost: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Acquisition Date</label>
                  <input type="date" value={editForm.acquisitionDate} onChange={(e) => setEditForm(p => ({ ...p, acquisitionDate: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '4px' }}>Detailed Specification Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting || isUploadingImage} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Commit Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustodianModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Reassign Custodian & Room</h3>
              <button onClick={() => setShowCustodianModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCustodianReassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>Assigned Handler Custodian</label>
                <select value={custodianForm.newCustodianId} onChange={(e) => setCustodianForm(p => ({ ...p, newCustodianId: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}>
                  <option value={1}>Custodian #1 (Systems Lead)</option>
                  <option value={2}>Custodian #2 (Network Admin)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '6px' }}>Physical Room Assignment</label>
                <select value={custodianForm.newRoomId} onChange={(e) => setCustodianForm(p => ({ ...p, newRoomId: Number(e.target.value) }))} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', outline: 'none' }}>
                  <option value={101}>Room 101 (Admin Office)</option>
                  <option value={202}>Room 202 (Server Room)</option>
                  <option value={303}>Room 303 (Laboratory)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCustodianModal(false)} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '4px', cursor: 'pointer' }}>
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