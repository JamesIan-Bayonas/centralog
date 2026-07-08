import { useState, useEffect } from 'react';
import { mockApi, type Asset, type DashboardSummary } from './services/api';
import { Search, ShieldAlert, CheckCircle, RotateCw, Server, Package, Trash2, Layers, MapPin, Hash, DollarSign } from 'lucide-react';
import './App.css';

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDashboardMetrics = async () => {
    const data = await mockApi.getDashboardSummary();
    setSummary(data);
  };

  const loadAssetsList = async (search = '') => {
    setLoading(true);
    const data = await mockApi.searchAssets(search);
    setAssets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardMetrics();
    loadAssetsList();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssetsList(searchTerm);
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

  return (
    <div className="app-workspace">
      {/* Dynamic Navigation/Branding Header */}
      <header className="workspace-header">
        <div className="logo-section">
          <div className="icon-frame">
            <Server size={22} />
          </div>
          <div>
            <h1>CentraLog</h1>
            <span className="subtitle">Enterprise Resource Ledger • Standalone Mode</span>
          </div>
        </div>
        <button onClick={() => { loadDashboardMetrics(); loadAssetsList(searchTerm); }} className="action-button secondary">
          <RotateCw size={14} className={loading ? "spin" : ""} /> Sync Matrix
        </button>
      </header>

      {/* Modern Dashboard Stats Grid */}
      {summary && (
        <section className="stats-container">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Managed Inventory</span>
              <span className="stat-number">{summary.totalAssetCount}</span>
            </div>
            <div className="stat-icon-wrapper purple"><Package size={24} /></div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Operational Infrastructure</span>
              <span className="stat-number text-success">{summary.activeCount}</span>
            </div>
            <div className="stat-icon-wrapper green"><CheckCircle size={24} /></div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Flagged Maintenance Nodes</span>
              <span className="stat-number text-warning">{summary.inMaintenanceCount}</span>
            </div>
            <div className="stat-icon-wrapper yellow"><ShieldAlert size={24} /></div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Assessed Asset Value</span>
              <span className="stat-number text-bright">₱{summary.totalSystemValue.toLocaleString()}</span>
            </div>
            <div className="stat-icon-wrapper balance"><DollarSign size={24} /></div>
          </div>
        </section>
      )}

      {/* Advanced Filter Workspace */}
      <section className="filter-panel">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search assets by hardware descriptor, serial tag, or facility location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="action-button primary">Execute Search</button>
        </form>
      </section>

      {/* Main Grid Deck / Table View */}
      <main className="content-deck">
        {loading ? (
          <div className="loader-overlay">
            <div className="spinner"></div>
            <p>Querying local transactional tracking state logs...</p>
          </div>
        ) : (
          <div className="table-viewport">
            <table className="modern-table">
              <thead>
                <tr>
                  <th><Hash size={14} /> ID</th>
                  <th>Hardware Descriptor</th>
                  <th><Layers size={14} /> Classification</th>
                  <th>Value Basis</th>
                  <th><MapPin size={14} /> Deployment Hub</th>
                  <th>Status Rule Matrix</th>
                </tr>
              </thead>
              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr key={asset.id} className={asset.isMaintenanceFlagged ? "flagged-row" : ""}>
                      <td className="mono-id">#{asset.id}</td>
                      <td>
                        <div className="asset-meta-cell">
                          <span className="asset-primary-name">{asset.name}</span>
                          <span className="asset-secondary-tag">S/N: {asset.serialNumber} • Custodian: {asset.custodianName}</span>
                        </div>
                      </td>
                      <td><span className="category-pill">{asset.categoryTag}</span></td>
                      <td className="price-text">₱{asset.procurementCost.toLocaleString()}</td>
                      <td>
                        <span className="location-text">{asset.roomId}</span>
                      </td>
                      <td>{getStatusBadge(asset.lifecycleState, asset.isMaintenanceFlagged)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state-cell">
                      <Trash2 size={40} className="empty-icon" />
                      <h3>No Operational Records Found</h3>
                      <p>Adjust your search criteria or reset filters to query alternate schema partitions.</p>
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