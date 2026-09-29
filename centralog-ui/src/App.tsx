// centralog-ui/src/App.tsx

import { useState, useEffect, useRef } from 'react';
import { api, assetApiEnriched, type Asset, type DashboardSummary, type PagedResult } from './services/api';
import { useAuth } from './context/AuthContext';
import { LoginPortal } from './components/LoginPortal'; 
import { Search, ShieldAlert, CheckCircle, RotateCw, PackageCheck, Package, Trash2, Layers, MapPin, Hash, DollarSign, ArrowLeftRight, Wrench, LogOut, UserCheck, Upload, Image as ImageIcon, X, RotateCcw, Tag, ClipboardList, Menu, LayoutDashboard, Sun, Moon, Leaf } from 'lucide-react';
import './App.css';
import { AssetDetailSidebar } from './components/AssetDetailSidebar';
import { FinancialLedgerReport } from './components/FinancialLedgerReport';
import { PropertyOverview } from './components/PropertyOverview';
import { StickerQueueModal } from './components/StickerQueueModal';
import { AuditLogReport } from './components/AuditLogReport';

type LEDGER_THEMES = 'theme-obsidian' | 'theme-light' | 'theme-dmc';

function App() {
  const { isAuthenticated, user, logoutSession, hasClearance } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<LEDGER_THEMES>(() => {
    const savedTheme = localStorage.getItem('cl_theme');
    return savedTheme === 'theme-obsidian' || savedTheme === 'theme-light' || savedTheme === 'theme-dmc'
      ? savedTheme
      : 'theme-dmc';
  });
  const selectTheme = (theme: LEDGER_THEMES) => {
    setCurrentTheme(theme);
    localStorage.setItem('cl_theme', theme);
  };
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeOverviewAssetId, setActiveOverviewAssetId] = useState<number | null>(null);

  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const transferDialogRef = useRef<HTMLFormElement>(null);
  const transferTriggerRef = useRef<HTMLButtonElement>(null);
  const workspaceMainRef = useRef<HTMLElement>(null);
  const [destinationRoom, setDestinationRoom] = useState<number>(101);
  const [newCustodian, setNewCustodian] = useState<number>(1);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeInspectedAsset, setActiveInspectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (!showTransferModal) return;
    const trigger = transferTriggerRef.current;
    transferDialogRef.current?.focus();
    return () => trigger?.focus();
  }, [showTransferModal]);

  // STICKER QUEUE & MEDIA UPLOADER STATES
  const [showStickerQueueModal, setShowStickerQueueModal] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // VIEW TOGGLE STATE (Accountants default to ledger view; others default to operational dashboard)
  const [accountantTab, setAccountantTab] = useState<'ledger' | 'dashboard' | 'audit'>('dashboard');
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMobileNavigation = () => {
    setIsMobileNavigationOpen(false);
    if (window.matchMedia('(max-width: 1180px)').matches) mobileMenuButtonRef.current?.focus();
  };
  const showWorkspaceView = (view: 'ledger' | 'dashboard' | 'audit') => {
    setAccountantTab(view);
    closeMobileNavigation();
    requestAnimationFrame(() => workspaceMainRef.current?.focus());
  };

  useEffect(() => {
    if (user?.roleName === 'Accountant') {
      setAccountantTab('ledger');
    }
  }, [user]);

  // PROCUREMENT SUGGESTIONS & AUTOCOMPLETE STATES
  const [nameInputValue, setNameInputValue] = useState<string>('');
  const [hardwareNameSuggestions, setHardwareNameSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([
    'Workstations',
    'Infrastructure',
    'Peripherals',
    'ICT Equipment',
    'Office Equipment',
    'Laboratory Hardware'
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Workstations');

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

  const loadProcurementSuggestions = async () => {
    if (!isAuthenticated) return;
    try {
      const cats = await assetApiEnriched.getCategoryTagSuggestions();
      setCategorySuggestions(cats);
      const names = await assetApiEnriched.getHardwareNameSuggestions();
      setHardwareNameSuggestions(names);
    } catch (err) {
      console.warn('Procurement suggestions fetch error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardMetrics();
      loadAssetsList();
      loadProcurementSuggestions();
    }
  }, [isAuthenticated]);

  const handleNameInputChange = async (val: string) => {
    setNameInputValue(val);
    if (val.trim().length > 0) {
      try {
        const matches = await assetApiEnriched.getHardwareNameSuggestions(val.trim());
        setHardwareNameSuggestions(matches);
      } catch (err) {
        console.warn('Name autocomplete lookup failed:', err);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAssetsList(searchTerm);
  };

  // ISSUE #1 FIX: Reset search term and immediately restore full asset inventory
  const handleClearSearch = () => {
    setSearchTerm('');
    loadAssetsList('');
  };

  // ISSUE #1 FIX: Automatically restore full asset inventory when input is cleared
  const handleSearchInputChange = (val: string) => {
    setSearchTerm(val);
    if (val.trim() === '' && searchTerm.trim() !== '') {
      loadAssetsList('');
    }
  };

  const toggleSelectAsset = (id: number) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasClearance(['Manager', 'SystemAdmin'])) {
      setActionFeedback('Security Policy Violation: Account level lacks clearance authority to perform bulk updates.');
      return;
    }
    try {
      const response = await assetApiEnriched.executeBulkTransfer(selectedAssetIds, Number(destinationRoom), Number(newCustodian));
      setActionFeedback(response.message);
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
      const response = await assetApiEnriched.initiateMaintenanceAction(assetId, {
        issueDescription: "Threshold alert tripped. Transferred automatically to diagnostic calibration loop.",
        isUrgent: true
      });
      
      setActionFeedback(response.message);
      await loadDashboardMetrics();
      await loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Action Rejected: ${error.message || 'Clearance policy verification failure.'}`);
    }
  };

  const handleResolveMaintenance = async (assetId: number) => {
    try {
      const response = await assetApiEnriched.resolveMaintenanceAction(assetId, {
        resolutionNotes: "Routine calibration workflow completed under standard deployment parameters.",
        repairCost: 0.00,
        targetState: 2
      });
      
      setActionFeedback(response.message);
      await loadDashboardMetrics();
      await loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Resolution Failed: ${error.message || 'Action rejected.'}`);
    }
  };

  const handleActivateAsset = async (assetId: number) => {
    try {
      const response = await assetApiEnriched.activateAsset(assetId);
      setActionFeedback(response.message);
      await loadDashboardMetrics();
      await loadAssetsList(searchTerm);
    } catch (error: any) {
      setActionFeedback(`Activation Failed: ${error.message || 'Action rejected.'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setActionFeedback("Uploading hardware photo file...");

    try {
      const uploadRes = await assetApiEnriched.uploadImage(file);
      setUploadedImageUrl(uploadRes.imageUrl);
      setActionFeedback(uploadRes.message);
    } catch (err: any) {
      setActionFeedback(`File Upload Failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Restored: Triggers CSS print format for corporate auditing sheets
  const triggerCompliancePrint = () => {
    window.print();
  };

  const getStatusBadge = (state: number, flagged: boolean, isTemporary?: boolean) => {
    if (flagged) return <span className="status-badge status-danger">Urgent Alert</span>;
    if (isTemporary) return <span className="status-badge status-warning" style={{ border: '1px dashed var(--clr-warning)' }}>Sandbox (Auto-Clears)</span>;
    switch (state) {
      case 2: return <span className="status-badge status-success">Active Fleet</span>;
      case 3: return <span className="status-badge status-warning">In Repair Loop</span>;
      case 5: return <span className="status-badge status-danger">Disposed</span>;
      default: return <span className="status-badge status-neutral">Procured</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`app-viewport ${currentTheme}`}>
        <LoginPortal currentTheme={currentTheme} onThemeChange={selectTheme} />
      </div>
    );
  }

  if (activeOverviewAssetId) {
    return (
      <div className={`app-viewport ${currentTheme}`}>
        <PropertyOverview 
          assetId={activeOverviewAssetId} 
          onBack={() => setActiveOverviewAssetId(null)} 
        />
      </div>
    );
  }

  return (
    <div className={`app-viewport ${currentTheme} app-workspace`}>
      <a className="workspace-skip-link" href="#workspace-content">Skip to main content</a>
      <header className="workspace-header">
        <div className="workspace-header-top">
          <div className="logo-section">
            <div className="icon-frame"><PackageCheck size={23} aria-hidden="true" /></div>
            <div>
              <p className="workspace-brand-name">CentraLog<span>.</span></p>
              <span className="subtitle">DMCCFI asset management</span>
            </div>
          </div>
          <button
            type="button"
            ref={mobileMenuButtonRef}
            className="workspace-menu-toggle"
            aria-label={isMobileNavigationOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isMobileNavigationOpen}
            aria-controls="workspace-navigation"
            onClick={() => setIsMobileNavigationOpen(open => !open)}
            onKeyDown={(event) => { if (event.key === 'Escape' && isMobileNavigationOpen) closeMobileNavigation(); }}
          >
            {isMobileNavigationOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span>{isMobileNavigationOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>

        <div
          id="workspace-navigation"
          className={`workspace-navigation ${isMobileNavigationOpen ? 'is-open' : ''}`}
          onKeyDown={(event) => { if (event.key === 'Escape') closeMobileNavigation(); }}
        >
          <nav className="workspace-primary-nav" aria-label="Workspace views">
            <button
              type="button"
              onClick={() => showWorkspaceView('dashboard')}
              className={`workspace-nav-button ${accountantTab === 'dashboard' ? 'is-active' : ''}`}
              aria-current={accountantTab === 'dashboard' ? 'page' : undefined}
            >
              <LayoutDashboard size={17} aria-hidden="true" /> Overview
            </button>
            {hasClearance(['Accountant', 'SystemAdmin']) && (
              <button
                type="button"
                onClick={() => showWorkspaceView('ledger')}
                className={`workspace-nav-button ${accountantTab === 'ledger' ? 'is-active' : ''}`}
                aria-current={accountantTab === 'ledger' ? 'page' : undefined}
              >
                <DollarSign size={17} aria-hidden="true" /> Financial ledger
              </button>
            )}
            {hasClearance(['Accountant', 'SystemAdmin']) && (
              <button
                type="button"
                onClick={() => showWorkspaceView('audit')}
                className={`workspace-nav-button ${accountantTab === 'audit' ? 'is-active' : ''}`}
                aria-current={accountantTab === 'audit' ? 'page' : undefined}
              >
                <ClipboardList size={17} aria-hidden="true" /> Audit log
              </button>
            )}
          </nav>

          <div className="workspace-utilities">
            <button type="button" onClick={() => { setShowStickerQueueModal(true); closeMobileNavigation(); }} className="workspace-utility-button" title="Open Batch Sticker Print Queue">
              <Tag size={17} aria-hidden="true" /> Sticker queue
            </button>
            <button type="button" onClick={() => { loadDashboardMetrics(); loadAssetsList(searchTerm); loadProcurementSuggestions(); closeMobileNavigation(); }} className="workspace-utility-button">
              <RotateCw size={17} className={loading ? 'spin' : ''} aria-hidden="true" /> Refresh
            </button>

            <div className="workspace-theme-picker" role="group" aria-label="Color theme">
              <button type="button" onClick={() => selectTheme('theme-dmc')} className={currentTheme === 'theme-dmc' ? 'is-active' : ''} aria-label="Signature green theme" aria-pressed={currentTheme === 'theme-dmc'} title="Signature green"><Leaf size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => selectTheme('theme-light')} className={currentTheme === 'theme-light' ? 'is-active' : ''} aria-label="White theme" aria-pressed={currentTheme === 'theme-light'} title="White"><Sun size={16} aria-hidden="true" /></button>
              <button type="button" onClick={() => selectTheme('theme-obsidian')} className={currentTheme === 'theme-obsidian' ? 'is-active' : ''} aria-label="Night theme" aria-pressed={currentTheme === 'theme-obsidian'} title="Night"><Moon size={16} aria-hidden="true" /></button>
            </div>

            {user && (
              <div className="workspace-user" title={`${user.username} · ${user.roleName}`}>
                <UserCheck size={17} aria-hidden="true" />
                <span><strong>{user.username}</strong><small>{user.roleName}</small></span>
              </div>
            )}
            <button type="button" onClick={logoutSession} className="workspace-signout" title="Sign out of CentraLog">
              <LogOut size={17} aria-hidden="true" /><span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="workspace-content" ref={workspaceMainRef} className="workspace-main" tabIndex={-1} aria-label={`${accountantTab === 'dashboard' ? 'Overview' : accountantTab === 'ledger' ? 'Financial ledger' : 'Audit log'} content`}>
      {accountantTab !== 'dashboard' && (
        <h1 className="workspace-view-title">{accountantTab === 'ledger' ? 'Financial ledger' : 'Audit log'}</h1>
      )}
      {actionFeedback && (
        <div className="workspace-feedback" role="status">
          <span>{actionFeedback}</span>
          <button type="button" onClick={() => setActionFeedback(null)} aria-label="Dismiss notification"><X size={18} aria-hidden="true" /></button>
        </div>
      )}

      {/* RENDER TOP METRICS, FILTERS, AND PROCUREMENT FOR NON-LEDGER VIEWS */}
      {accountantTab === 'dashboard' && (
        <>
          <section className="dashboard-intro" aria-labelledby="dashboard-title">
            <div>
              <p className="dashboard-eyebrow">WORKSPACE OVERVIEW</p>
              <h1 id="dashboard-title">Asset overview</h1>
              <p className="dashboard-description">A clear view of inventory, maintenance, and the value of school assets.</p>
            </div>
          </section>
          {summary && (
            <section className="stats-container" aria-label="Asset summary">
              <div className="stat-card stat-card-primary">
                <div className="stat-info"><span className="stat-label">Total assets</span><span className="stat-number">{summary.totalAssetCount.toLocaleString()}</span></div>
                <div className="stat-icon-wrapper"><Package size={24} aria-hidden="true" /></div>
              </div>
              <div className="stat-card stat-card-active">
                <div className="stat-info"><span className="stat-label">Active assets</span><span className="stat-number">{summary.activeCount.toLocaleString()}</span></div>
                <div className="stat-icon-wrapper"><CheckCircle size={24} aria-hidden="true" /></div>
              </div>
              <div className="stat-card stat-card-maintenance">
                <div className="stat-info"><span className="stat-label">In maintenance</span><span className="stat-number">{summary.inMaintenanceCount.toLocaleString()}</span></div>
                <div className="stat-icon-wrapper"><Wrench size={24} aria-hidden="true" /></div>
              </div>
              <div className="stat-card stat-card-alert">
                <div className="stat-info"><span className="stat-label">Urgent alerts</span><span className="stat-number">{summary.urgentAlertCount.toLocaleString()}</span></div>
                <div className="stat-icon-wrapper"><ShieldAlert size={24} aria-hidden="true" /></div>
              </div>
              <div className="stat-card stat-card-value">
                <div className="stat-info"><span className="stat-label">Total asset value</span><span className="stat-number">₱{summary.totalSystemValue.toLocaleString()}</span></div>
                <div className="stat-icon-wrapper"><DollarSign size={24} aria-hidden="true" /></div>
              </div>
            </section>
          )}

          {showTransferModal && (
            <div className="transfer-overlay">
              <form
                ref={transferDialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="transfer-title"
                aria-describedby="transfer-description"
                className="transfer-dialog"
                onSubmit={handleBulkTransferSubmit}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setShowTransferModal(false);
                  if (event.key !== 'Tab') return;
                  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('select, button:not([disabled])'));
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
                <div className="transfer-dialog-heading">
                  <div className="transfer-dialog-icon"><ArrowLeftRight size={21} aria-hidden="true" /></div>
                  <div>
                    <h2 id="transfer-title">Transfer selected assets</h2>
                    <p id="transfer-description">Move {selectedAssetIds.length} selected {selectedAssetIds.length === 1 ? 'asset' : 'assets'} to a new room and custodian.</p>
                  </div>
                </div>
                <div className="transfer-field">
                  <label htmlFor="transfer-room">Destination room</label>
                  <select id="transfer-room" value={destinationRoom} onChange={(e) => setDestinationRoom(Number(e.target.value))}>
                    <option value={101}>Room 101 (Admin Office)</option>
                    <option value={202}>Room 202 (Server Room)</option>
                    <option value={303}>Room 303 (Laboratory)</option>
                  </select>
                </div>
                <div className="transfer-field">
                  <label htmlFor="transfer-custodian">New custodian</label>
                  <select id="transfer-custodian" value={newCustodian} onChange={(e) => setNewCustodian(Number(e.target.value))}>
                    <option value={1}>Custodian #1 (Systems Lead)</option>
                    <option value={2}>Custodian #2 (Network Admin)</option>
                  </select>
                </div>
                <div className="transfer-dialog-actions">
                  <button type="button" onClick={() => setShowTransferModal(false)} className="action-button secondary">Cancel</button>
                  <button type="submit" className="action-button primary">Transfer assets</button>
                </div>
              </form>
            </div>
          )}

          {/* COMPLIANCE EXPORT CONTROLS (Uses triggerCompliancePrint) */}
          {hasClearance(['Manager', 'SystemAdmin', 'Accountant']) && (
            <section className="report-controls-deck">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Inventory print</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Print the current inventory view for review and filing.</p>
              </div>
              <button onClick={triggerCompliancePrint} className="action-button primary" style={{ backgroundColor: 'var(--clr-success)' }}>Print inventory report</button>
            </section>
          )}

          {/* ISSUE #3 FIX: Exclusively restricted to Manager and SystemAdmin tiers */}
          {hasClearance(['Manager', 'SystemAdmin']) && (
            <section className="procurement-panel" aria-labelledby="procurement-title">
              <div className="procurement-header">
                <div className="procurement-header-icon"><Package size={22} aria-hidden="true" /></div>
                <div>
                  <p className="section-eyebrow">PROCUREMENT</p>
                  <h2 id="procurement-title">Register a new asset</h2>
                  <p className="section-description">Add its core details, location, and custodian to the inventory.</p>
                </div>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                
                const resolvedCategory = selectedCategory.trim();

                if (!resolvedCategory) {
                  setActionFeedback("Registration Failure: Please specify a valid category classification.");
                  return;
                }

                // ISSUE #2 FIX: Enforce ₱100,000,000.00 client-side pre-flight boundary
                const procurementCostValue = Number(formData.get('procurementCost'));
                if (procurementCostValue <= 0 || procurementCostValue > 100000000) {
                  setActionFeedback("Registration Failure: Procurement cost must be between ₱1.00 and ₱100,000,000.00.");
                  return;
                }

                const payload = {
                  name: nameInputValue.trim(),
                  categoryTag: resolvedCategory,
                  procurementCost: procurementCostValue,
                  roomId: Number(formData.get('roomId')),
                  custodianId: Number(formData.get('custodianId')),
                  imageUrl: uploadedImageUrl || undefined
                };

                try {
                  setActionFeedback("Registering asset inside database context...");
                  const result = await assetApiEnriched.importAssetRegistryBatch([payload]);
                  setActionFeedback(result.message);
                  form.reset();
                  setNameInputValue('');
                  setSelectedCategory('Workstations');
                  setUploadedImageUrl('');
                  await loadDashboardMetrics();
                  await loadAssetsList(searchTerm);
                  await loadProcurementSuggestions();
                } catch (err: any) {
                  setActionFeedback(`Registration Failure: ${err.message || 'Validation error.'}`);
                }
              }} className="procurement-form">
                <div className="procurement-fields">
                <div className="procurement-field">
                  <label htmlFor="procurement-name">Asset name <span aria-hidden="true">*</span></label>
                  <input 
                    id="procurement-name"
                    type="text" 
                    name="assetName" 
                    required 
                    list="hardware-name-history-list"
                    value={nameInputValue}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    placeholder="e.g., Lenovo Legion R7" 
                  />
                  <datalist id="hardware-name-history-list">
                    {hardwareNameSuggestions.map((suggestion, idx) => (
                      <option key={idx} value={suggestion} />
                    ))}
                  </datalist>
                </div>

                <div className="procurement-field">
                  <label htmlFor="procurement-category">Category <span aria-hidden="true">*</span></label>
                  <input 
                    id="procurement-category"
                    type="text" 
                    required
                    list="classification-category-list"
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    placeholder="Select or type a category"
                  />
                  <datalist id="classification-category-list">
                    {categorySuggestions.map((cat, idx) => (
                      <option key={idx} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* ISSUE #2 FIX: Form input capped with min, max, and step boundaries */}
                <div className="procurement-field">
                  <label htmlFor="procurement-cost">Procurement cost (₱) <span aria-hidden="true">*</span></label>
                  <input 
                    id="procurement-cost"
                    type="number" 
                    name="procurementCost" 
                    required 
                    min="1" 
                    max="100000000"
                    step="0.01"
                    placeholder="65000" 
                  />
                </div>

                <div className="procurement-field">
                  <span className="procurement-field-label">Photo <span className="optional-label">Optional</span></span>
                  <label htmlFor="procurement-photo" className="procurement-upload">
                    <input 
                      id="procurement-photo"
                      className="procurement-file-input"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage ? (
                      <RotateCw size={18} className="spin" aria-hidden="true" />
                    ) : uploadedImageUrl ? (
                      <ImageIcon size={18} aria-hidden="true" />
                    ) : (
                      <Upload size={18} aria-hidden="true" />
                    )}
                    <span>{isUploadingImage ? 'Uploading photo…' : uploadedImageUrl ? 'Photo attached' : 'Choose image file'}</span>
                  </label>
                </div>

                <div className="procurement-field">
                  <label htmlFor="procurement-room">Room</label>
                  <select id="procurement-room" name="roomId">
                    <option value="101">Room 101 (Admin Office)</option>
                    <option value="202">Room 202 (Server Room)</option>
                    <option value="303">Room 303 (Laboratory)</option>
                  </select>
                </div>

                <div className="procurement-field">
                  <label htmlFor="procurement-custodian">Custodian</label>
                  <select id="procurement-custodian" name="custodianId">
                    <option value="1">Custodian #1 (Systems Lead)</option>
                    <option value="2">Custodian #2 (Network Admin)</option>
                  </select>
                </div>
                </div>
                <div className="procurement-form-footer">
                  <span><span aria-hidden="true">*</span> Required fields</span>
                  <button type="submit" className="action-button primary procurement-submit">
                    <PackageCheck size={17} aria-hidden="true" /> Register asset
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ISSUE #1 FIX: Reactive search bar with Esc key, inline X button, and clear reset button */}
          <section className="filter-panel inventory-tools" aria-labelledby="inventory-title">
            <div className="inventory-tools-heading">
              <div>
                <p className="section-eyebrow">INVENTORY</p>
                <h2 id="inventory-title">Asset inventory</h2>
              </div>
              {!loading && <span className="inventory-count">{assets.length} {assets.length === 1 ? 'asset' : 'assets'} shown</span>}
            </div>
            <form onSubmit={handleSearch} className="search-form">
              <div className="input-group">
                <label htmlFor="asset-search" className="visually-hidden">Search assets by name or category</label>
                <Search size={18} className="search-icon" aria-hidden="true" />
                <input 
                  id="asset-search"
                  type="text" 
                  placeholder="Search by asset name or category"
                  value={searchTerm} 
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && searchTerm) {
                      handleClearSearch();
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="search-clear-icon"
                    title="Clear search query (Esc)"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button type="submit" className="action-button primary">
                Search
              </button>

              {searchTerm && (
                <button 
                  type="button" 
                  onClick={handleClearSearch} 
                  className="action-button secondary"
                  title="Restore complete asset list"
                >
                  <RotateCcw size={14} aria-hidden="true" /> Clear search
                </button>
              )}
            </form>
          </section>
          {selectedAssetIds.length > 0 && user?.roleName !== 'Accountant' && (
            <div className="inventory-selection" role="status">
              <div><strong>{selectedAssetIds.length} {selectedAssetIds.length === 1 ? 'asset' : 'assets'} selected</strong><span>Selection applies to the inventory below.</span></div>
              {hasClearance(['Manager', 'SystemAdmin']) ? (
                <button type="button" ref={transferTriggerRef} onClick={() => setShowTransferModal(true)} className="action-button primary"><ArrowLeftRight size={16} aria-hidden="true" /> Transfer selected</button>
              ) : (
                <span className="inventory-selection-note">Bulk transfer requires manager access.</span>
              )}
            </div>
          )}
        </>
      )}

      <div className="content-deck">
        {accountantTab === 'ledger' ? (
          <FinancialLedgerReport />
        ) : accountantTab === 'audit' ? (
          <AuditLogReport />
        ) : loading ? (
          <div className="loader-overlay"><div className="spinner"></div><p>Querying live transactional tracking logs...</p></div>
        ) : (
          <div className="table-viewport inventory-viewport" role="region" aria-label="Asset inventory table" tabIndex={0}>
            <p className="inventory-scroll-hint">Scroll sideways to see all asset details and actions.</p>
            <table className="modern-table ledger-table inventory-table">
              <thead>
                <tr>
                  {user?.roleName !== 'Accountant' && <th scope="col" className="inventory-select-column">Select</th>}
                  <th scope="col"><Hash size={14} aria-hidden="true" /> ID</th>
                  <th scope="col">Asset</th>
                  <th scope="col"><Layers size={14} aria-hidden="true" /> Category</th>
                  <th scope="col">Cost</th>
                  <th scope="col"><MapPin size={14} aria-hidden="true" /> Room</th>
                  <th scope="col">Status and actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <tr 
                      key={asset.id} 
                      className={asset.isMaintenanceFlagged ? "row-maintenance flagged-row" : ""}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveInspectedAsset(asset)}
                    >
                      {user?.roleName !== 'Accountant' && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={selectedAssetIds.includes(asset.id)}
                            disabled={asset.lifecycleState === 5} 
                            onChange={() => toggleSelectAsset(asset.id)}
                            aria-label={`Select ${asset.name} for bulk transfer`}
                          />
                        </td>
                      )}
                      <td className="mono">#{asset.id}</td>
                      <td>
                        <div className="asset-meta-cell">
                          <button type="button" className="asset-name-button" onClick={(e) => { e.stopPropagation(); setActiveInspectedAsset(asset); }}>{asset.name}</button>
                          <span className="asset-secondary-tag">Custodian #{asset.custodianId}</span>
                        </div>
                      </td>
                      <td><span className="category-pill">{asset.categoryTag}</span></td>
                      <td className="price-text mono">₱{asset.procurementCost.toLocaleString()}</td>
                      <td><span className="location-text mono">Room #{asset.roomId}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="inventory-status-actions">
                          {getStatusBadge(asset.lifecycleState, asset.isMaintenanceFlagged)}
                          
                          {asset.lifecycleState === 2 && hasClearance(['Inventory Staff', 'Manager', 'SystemAdmin']) && (
                            <button onClick={() => handleInitiateMaintenance(asset.id)} className="action-button secondary inventory-row-action">
                              <Wrench size={14} aria-hidden="true" /> Lock for repair
                            </button>
                          )}
                          {asset.lifecycleState === 3 && hasClearance(['Inventory Staff', 'Manager', 'SystemAdmin']) && (
                            <button onClick={() => handleResolveMaintenance(asset.id)} className="action-button primary inventory-row-action">
                              <CheckCircle size={14} aria-hidden="true" /> Resolve repairs
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={user?.roleName === 'Accountant' ? 6 : 7} className="empty-state-cell">
                      <Trash2 size={40} className="empty-icon" />
                      <h3>No assets found</h3>
                      <p>Try another asset name or category.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </main>

      <AssetDetailSidebar 
        asset={activeInspectedAsset}
        onClose={() => setActiveInspectedAsset(null)}
        onActivateAsset={async (id) => {
          await handleActivateAsset(id);
          setActiveInspectedAsset(prev => prev ? { ...prev, lifecycleState: 2 } : null);
        }}
        onInitiateMaintenance={async (id) => {
          await handleInitiateMaintenance(id);
          setActiveInspectedAsset(prev => prev ? { ...prev, lifecycleState: 3 } : null);
        }}
        onResolveMaintenance={async (id) => {
          await handleResolveMaintenance(id);
          setActiveInspectedAsset(prev => prev ? { ...prev, lifecycleState: 2, isMaintenanceFlagged: false } : null);
        }}
        onOpenOverview={(id) => {
          setActiveInspectedAsset(null);
          setActiveOverviewAssetId(id);
        }}
      />

      <StickerQueueModal 
        isOpen={showStickerQueueModal}
        onClose={() => setShowStickerQueueModal(false)}
        onQueueUpdated={() => {
          loadAssetsList(searchTerm);
        }}
      />
    </div>
  );
}

export default App;
