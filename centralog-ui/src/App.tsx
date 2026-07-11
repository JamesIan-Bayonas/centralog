import { useState, useEffect } from 'react';
import { api, type Asset, type DashboardSummary, type PagedResult } from './services/api';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal'; // Injected gateway layout link
import { Search, ShieldAlert, CheckCircle, RotateCw, Server, Package, Trash2, Layers, MapPin, Hash, DollarSign, ArrowLeftRight, Wrench, LogOut, UserCheck } from 'lucide-react';
import './App.css';

type LEDGER_THEMES = 'theme-obsidian' | 'theme-light' | 'theme-dmc';

function App() {
  // Pull security session parameters directly from the custom context core
  const { isAuthenticated, user, logoutSession, hasClearance } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<LEDGER_THEMES>('theme-dmc');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [destinationRoom, setDestinationRoom] = useState<number>(101);
  const [newCustodian, setNewCustodian] = useState<number>(1);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadDashboardMetrics = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get<DashboardSummary>('/assets/dashboard/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('System synchronization dashboard metric failure:', error);
    }
  };

  const loadAssetsList = async (search = '') => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get<PagedResult<Asset>>('/assets/search', {
        params: { searchTerm: search, pageNumber: 1, pageSize: 20 }
      });
      setAssets(response.data.items);
    } catch (error) {
      console.error('Inventory tracking feed connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardMetrics();
      loadAssetsList();
    }
  }, [isAuthenticated]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssetsList(searchTerm);
  };

  const toggleSelectAsset = (id: number) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // UC-05 Enforcement: Verify clearance values before blasting network threads
    if (!hasClearance(['Manager', 'SystemAdmin'])) {
      setActionFeedback('Security Policy Violation: Account level lacks clearance authority to perform bulk updates.');
      return;
    }
    try {
      const response = await api.post('/assets/bulk-transfer', {
        assetIds: selectedAssetIds,
        destinationRoomId: Number(destinationRoom),
        newCustodianId: Number(newCustodian)
      });
      setActionFeedback(response.data.message);
      setSelectedAssetIds([]);
      setShowTransferModal(false);
      loadDashboardMetrics();
      loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Error: ${error.response?.data?.message || 'Transfer failed.'}`);
    }
  };

  const handleInitiateMaintenance = async (assetId: number) => {
    try {
      const response = await api.patch(`/assets/${assetId}/maintenance/initiate`, {
        issueDescription: "Threshold alert tripped.",
        isUrgent: true
      });
      setActionFeedback(response.data.message);
      loadDashboardMetrics();
      loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Error: ${error.response?.data?.message || 'Action rejected.'}`);
    }
  };

  const handleResolveMaintenance = async (assetId: number) => {
    try {
      const response = await api.post(`/assets/${assetId}/maintenance/resolve`, {
        resolutionNotes: "Routine calibration workflow completed.",
        repairCost: 0.00,
        targetState: 2
      });
      setActionFeedback(response.data.message);
      loadDashboardMetrics();
      loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Error: ${error.response?.data?.message || 'Resolution failed.'}`);
    }
  };

  const getStatusBadge = (state: number, flagged: boolean) => {
    if (flagged) return <span className="status-badge status-danger">Urgent Alert</span>;
    switch (state) {
      case 2: return <span className="status-badge status-success">Active Fleet</span>;
      case 3: return <span className="status-badge status-warning">In Repair Loop</span>;
      case 5: return <span className="status-badge status-disposed">Disposed</span>;
      default: return <span className="status-badge status-neutral">Procured</span>;
    }
  };

  // --- INTERCEPTOR: Show gateway form layout if session is unauthenticated ---
  if (!isAuthenticated) {
    return (
      <div className={`app-viewport ${currentTheme}`}>
        <LoginModal />
      </div>
    );
  }

  return (
    <div className={`app-viewport ${currentTheme} app-workspace`}>
      <header className="workspace-header">
        <div className="logo-section">
          <div className="icon-frame"><Server size={22} /></div>
          <div>
            <h1>CentraLog</h1>
            <span className="subtitle">Enterprise Resource Ledger • Connected Mode</span>
          </div>
        </div>

        {/* User Identity Banner Element */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', background: 'var(--surface-raised)', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <UserCheck size={14} className="text-success" />
            <span className="mono">{user.username} <span style={{ color: 'var(--text-muted)' }}>({user.roleName})</span></span>
          </div>
        )}

        <div className="theme-trigger-deck" style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '16px' }}>
          <button onClick={() => setCurrentTheme('theme-obsidian')} className={`action-button secondary ${currentTheme === 'theme-obsidian' ? 'active' : ''}`}>[OBSIDIAN]</button>
          <button onClick={() => setCurrentTheme('theme-light')} className={`action-button secondary ${currentTheme === 'theme-light' ? 'active' : ''}`}>[LIGHT]</button>
          <button onClick={() => setCurrentTheme('theme-dmc')} className={`action-button secondary ${currentTheme === 'theme-dmc' ? 'active' : ''}`}>[DMC MODE]</button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { loadDashboardMetrics(); loadAssetsList(searchTerm); }} className="action-button secondary">
            <RotateCw size={14} className={loading ? "spin" : ""} /> Sync Matrix
          </button>
          <button onClick={logoutSession} className="action-button secondary" style={{ borderColor: 'var(--clr-danger)', color: 'var(--clr-danger)' }} title="Terminate Ledger Session">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {actionFeedback && (
        <div className="status-badge status-warning" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '20px', padding: '12px' }}>
          {actionFeedback}
          <button onClick={() => setActionFeedback(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>X</button>
        </div>
      )}

      {summary && (
        <section className="stats-container">
          <div className="stat-card">
            <div className="stat-info"><span className="stat-label">Total Managed Inventory</span><span className="stat-number">{summary.totalAssetCount}</span></div>
            <div className="stat-icon-wrapper purple"><Package size={24} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><span className="stat-label">Operational Infrastructure</span><span className="stat-number text-success">{summary.activeCount}</span></div>
            <div className="stat-icon-wrapper green"><CheckCircle size={24} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><span className="stat-label">Flagged Maintenance Nodes</span><span className="stat-number text-warning">{summary.inMaintenanceCount}</span></div>
            <div className="stat-icon-wrapper yellow"><ShieldAlert size={24} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><span className="stat-label">Assessed Asset Value</span><span className="stat-number text-bright">₱{summary.totalSystemValue.toLocaleString()}</span></div>
            <div className="stat-icon-wrapper balance"><DollarSign size={24} /></div>
          </div>
        </section>
      )}

      {selectedAssetIds.length > 0 && (
        <div className="filter-panel" style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span className="mono" style={{ fontSize: '14px' }}>Selected Matrix Tokens: <strong>{selectedAssetIds.length}</strong> items chosen.</span>
          {/* Conditional Layout Visibility Check: Only allow rendering if role holds proper rights */}
          {hasClearance(['Manager', 'SystemAdmin']) ? (
            <button onClick={() => setShowTransferModal(true)} className="action-button primary"><ArrowLeftRight size={14} /> Authorize Bulk Transfer</button>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--clr-danger)' }}>Bulk adjustments locked for this profile level.</span>
          )}
        </div>
      )}

      {showTransferModal && (
        <div className="loader-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <form onSubmit={handleBulkTransferSubmit} style={{ background: 'var(--surface)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0 }}>Execute Grouped Relocation</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Destination Room ID Code</label>
              <select value={destinationRoom} onChange={(e) => setDestinationRoom(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <option value={101}>Room 101 (Admin Office)</option>
                <option value={202}>Room 202 (Server Room)</option>
                <option value={303}>Room 303 (Laboratory)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>New Custodian ID Assignment</label>
              <select value={newCustodian} onChange={(e) => setNewCustodian(Number(e.target.value))} style={{ width: '100%', padding: '10px', background: 'var(--canvas)', color: 'var(--text-primary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <option value={1}>Custodian #1 (Systems Lead)</option>
                <option value={2}>Custodian #2 (Network Admin)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="action-button primary" style={{ flex: 1 }}>Commit Batch Transaction</button>
              <button type="button" onClick={() => setShowTransferModal(false)} className="action-button secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <section className="filter-panel">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search assets by hardware descriptor or category tags..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button type="submit" className="action-button primary">Execute Search</button>
        </form>
      </section>

      <main className="content-deck">
        {loading ? (
          <div className="loader-overlay"><div className="spinner"></div><p>Querying live transactional tracking logs...</p></div>
        ) : (
          <div className="table-viewport">
            <table className="modern-table ledger-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}><input type="checkbox" disabled /></th>
                  <th><Hash size={14} /> ID</th>
                  <th>Hardware Descriptor</th>
                  <th><Layers size={14} /> Classification</th>
                  <th>Value Basis</th>
                  <th><MapPin size={14} /> Deployment Hub</th>
                  <th>Status Matrix / Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr key={asset.id} className={asset.isMaintenanceFlagged ? "row-maintenance flagged-row" : ""}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedAssetIds.includes(asset.id)}
                          disabled={asset.lifecycleState === 5} 
                          onChange={() => toggleSelectAsset(asset.id)} 
                        />
                      </td>
                      <td className="mono mono-id">#{asset.id}</td>
                      <td>
                        <div className="asset-meta-cell">
                          <span className="asset-primary-name">{asset.name}</span>
                          <span className="asset-secondary-tag">System Identifier Hash: CL-ID-{asset.id} • Relational Handler Key: #{asset.custodianId}</span>
                        </div>
                      </td>
                      <td><span className="category-pill">{asset.categoryTag}</span></td>
                      <td className="price-text mono">₱{asset.procurementCost.toLocaleString()}</td>
                      <td><span className="location-text mono">Room Reference: #{asset.roomId}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(asset.lifecycleState, asset.isMaintenanceFlagged)}
                          
                          {/* RBAC Evaluation: Lock actions unless the matching identity scope criteria is met */}
                          {asset.lifecycleState === 2 && hasClearance(['Inventory Staff', 'Manager']) && (
                            <button onClick={() => handleInitiateMaintenance(asset.id)} className="action-button secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                              <Wrench size={10} /> Lock for Repair
                            </button>
                          )}
                          {asset.lifecycleState === 3 && hasClearance(['Inventory Staff', 'Manager']) && (
                            <button onClick={() => handleResolveMaintenance(asset.id)} className="action-button primary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                              <CheckCircle size={10} /> Resolve Repairs
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-state-cell">
                      <Trash2 size={40} className="empty-icon" />
                      <h3>No Operational Records Found</h3>
                      <p>Adjust your search text to hit alternative partitions.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;