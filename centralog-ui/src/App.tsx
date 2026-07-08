import { useState, useEffect } from 'react';
import { api } from './services/api';
import { Search, ShieldAlert, CheckCircle, RotateCw, Server, Package } from 'lucide-react';
import './App.css';

interface DashboardSummary {
  totalAssetCount: number;
  totalSystemValue: number;
  activeCount: number;
  inMaintenanceCount: number;
  disposedCount: number;
}

interface Asset {
  id: number;
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: number;
  custodianId: number;
  lifecycleState: number;
  isMaintenanceFlagged: boolean;
}

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch dashboard summary metrics
  const fetchDashboardData = async () => {
    try {
      const summaryRes = await api.get('/assets/dashboard/summary');
      setSummary(summaryRes.data);
    } catch (err: any) {
      console.error('Failed to pull dashboard metrics:', err);
    }
  };

  // Query assets based on active filter text parameters
  const fetchAssetsList = async (search = '') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const endpoint = search ? `/assets/search?SearchTerm=${encodeURIComponent(search)}` : '/assets/search';
      const res = await api.get(endpoint);
      // Maps cleanly to PagedResult structural arrays returned by your backend
      setAssets(res.data.items || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'An error occurred fetching inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAssetsList();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssetsList(searchTerm);
  };

  const getLifecycleBadge = (state: number) => {
    switch (state) {
      case 2: return <span className="badge badge-active">Active</span>;
      case 3: return <span className="badge badge-repair">In Maintenance</span>;
      case 5: return <span className="badge badge-disposed">Disposed</span>;
      default: return <span className="badge badge-neutral">Procured</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <header className="main-header">
        <div className="branding">
          <Server className="brand-icon" />
          <h1>CentraLog System Hub</h1>
        </div>
        <button onClick={() => { fetchDashboardData(); fetchAssetsList(searchTerm); }} className="refresh-btn">
          <RotateCw size={16} /> Refresh Core
        </button>
      </header>

      {/* Metrics Cards Strip */}
      {summary && (
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <Package size={20} />
              <h3>Total Capital Items</h3>
            </div>
            <p className="metric-value">{summary.totalAssetCount}</p>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <CheckCircle size={20} color="#10b981" />
              <h3>Active Fleet</h3>
            </div>
            <p className="metric-value">{summary.activeCount}</p>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <ShieldAlert size={20} color="#f59e0b" />
              <h3>In Repair Loops</h3>
            </div>
            <p className="metric-value">{summary.inMaintenanceCount}</p>
          </div>
          <div className="metric-card">
            <div className="metric-header">
              <h3>Total Evaluated Valuation</h3>
            </div>
            <p className="metric-value">₱{summary.totalSystemValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </section>
      )}

      {/* Filter and Search Action Box */}
      <section className="search-section">
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <Search className="search-input-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search assets by description or identifier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Filter Fleet</button>
        </form>
      </section>

      {/* Primary Inventory Data Matrix */}
      <main className="inventory-section">
        {errorMessage && <div className="error-alert-banner">{errorMessage}</div>}

        {loading ? (
          <div className="loading-spinner">Querying backend relational memory loops...</div>
        ) : (
          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Hardware Item Description</th>
                  <th>Category</th>
                  <th>Cost Basis</th>
                  <th>Room Location</th>
                  <th>Lifecycle Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr key={asset.id} className={asset.isMaintenanceFlagged ? 'row-alert-flagged' : ''}>
                      <td>#{asset.id}</td>
                      <td>
                        <span className="asset-name-text">{asset.name}</span>
                        {asset.isMaintenanceFlagged && <span className="warning-pill">Daemon Maintenance Alert</span>}
                      </td>
                      <td><span className="tag">{asset.categoryTag}</span></td>
                      <td>₱{asset.procurementCost.toLocaleString()}</td>
                      <td>Room {asset.roomId}</td>
                      <td>{getLifecycleBadge(asset.lifecycleState)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                      Zero records found matching query parameters.
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