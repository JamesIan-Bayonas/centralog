import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AssetDetailSidebar } from '../AssetDetailSidebar';
import { PropertyOverview } from '../PropertyOverview';
import { useAuth } from '../../context/AuthContext';
import { assetApi, assetApiEnriched, type Asset } from '../../services/api';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
const mockedUseAuth = vi.mocked(useAuth);

const setRole = (roleName: string, hasClearance: (roles: string[]) => boolean) => {
  mockedUseAuth.mockReturnValue({
    user: { userId: 1, username: 'test', email: 'test@example.invalid', roleName },
    token: 'test-token',
    isAuthenticated: true,
    loginSession: vi.fn(),
    logoutSession: vi.fn(),
    hasClearance
  });
};

const mockActiveAsset: Asset = {
  id: 101,
  name: "Lenovo Legion R7 (RTX 4060)",
  categoryTag: "Workstations",
  procurementCost: 65000.00,
  roomId: 101,
  custodianId: 1,
  lifecycleState: 2, 
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  nextServiceDate: "2026-10-01T00:00:00Z",
  isMaintenanceFlagged: false,
  expectedLifespanMonths: 60,
  depreciationMethod: 1,
  salvageValue: 0.00  
};

const mockMaintenanceAsset: Asset = {
  ...mockActiveAsset,
  lifecycleState: 3 
};

describe('CentraLog UI Lifecycle & RBAC Boundary Safeguards', () => {
  const onInitiateMock = vi.fn(async () => {});
  const onResolveMock = vi.fn(async () => {});
  const onActivateMock = vi.fn(async () => {});
  const onCloseMock = vi.fn();
  const onOpenOverviewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(assetApi, 'getAssetHistory').mockResolvedValue({ assetId: 101, assetName: mockActiveAsset.name, timelineEntries: [] });
  });

  it('[CRITICAL-UI-01]: Must completely hide action options if account lacks clearance scopes', () => {
    setRole('GeneralStaff', () => false);

    render(
      <AssetDetailSidebar 
        asset={mockActiveAsset} 
        onClose={onCloseMock}
        onInitiateMaintenance={onInitiateMock}
        onResolveMaintenance={onResolveMock}
        onActivateAsset={onActivateMock}
        onOpenOverview={onOpenOverviewMock}
      />
    );

    expect(screen.queryByRole('button', { name: /Open property details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retire asset permanently/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start maintenance/i })).not.toBeInTheDocument();
  });

  it('[CRITICAL-UI-02]: Must render freeze warnings and expose resolve buttons when asset is in maintenance', () => {
    setRole('Inventory Staff', (roles) => roles.includes('Inventory Staff'));

    render(
      <AssetDetailSidebar 
        asset={mockMaintenanceAsset} 
        onClose={onCloseMock}
        onInitiateMaintenance={onInitiateMock}
        onResolveMaintenance={onResolveMock}
        onActivateAsset={onActivateMock}
        onOpenOverview={onOpenOverviewMock}
      />
    );

    expect(screen.getByText(/Depreciation is paused during maintenance/i)).toBeInTheDocument();
    
    const resolveBtn = screen.getByRole('button', { name: /Complete maintenance/i });
    expect(resolveBtn).toBeInTheDocument();

    fireEvent.click(resolveBtn);
    expect(onResolveMock).toHaveBeenCalledWith(101);
  });

  it('[CRITICAL-UI-03]: Must trigger Property Overview navigation when Inspect button is pressed', () => {
    setRole('Inventory Staff', (roles) => roles.includes('Inventory Staff'));

    render(
      <AssetDetailSidebar 
        asset={mockActiveAsset} 
        onClose={onCloseMock}
        onInitiateMaintenance={onInitiateMock}
        onResolveMaintenance={onResolveMock}
        onActivateAsset={onActivateMock}
        onOpenOverview={onOpenOverviewMock}
      />
    );

    const inspectBtn = screen.getByRole('button', { name: /Open property details/i });
    expect(inspectBtn).toBeInTheDocument();

    fireEvent.click(inspectBtn);
    expect(onOpenOverviewMock).toHaveBeenCalledWith(101);
  });

  it('keeps accountant asset inspection read-only', () => {
    setRole('Accountant', (roles) => roles.includes('Accountant'));

    render(
      <AssetDetailSidebar
        asset={mockActiveAsset}
        onClose={onCloseMock}
        onInitiateMaintenance={onInitiateMock}
        onResolveMaintenance={onResolveMock}
        onActivateAsset={onActivateMock}
        onOpenOverview={onOpenOverviewMock}
      />
    );

    expect(screen.getByRole('button', { name: 'Open property details' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start maintenance' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retire asset permanently' })).not.toBeInTheDocument();
  });

  it('keeps missing property and serial numbers blank in the edit payload', async () => {
    setRole('Manager', (roles) => roles.includes('Manager'));
    vi.spyOn(assetApiEnriched, 'getAssetById').mockResolvedValue({
      ...mockActiveAsset,
      propertyNumber: '',
      serialNumber: '',
      description: ''
    });
    vi.spyOn(assetApiEnriched, 'getAssetHistory').mockResolvedValue({
      assetId: 101,
      assetName: mockActiveAsset.name,
      timelineEntries: []
    });
    const updateProperty = vi.spyOn(assetApiEnriched, 'updateProperty').mockResolvedValue({ message: 'Saved' });

    render(<PropertyOverview assetId={101} onBack={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Asset #101' })).toBeInTheDocument();
    expect(screen.getByText('Property no. not recorded')).toBeInTheDocument();
    expect(screen.getByText('No property description has been recorded.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit Property/i }));
    expect(screen.getByLabelText('Property code / tag')).toHaveValue('');
    expect(screen.getByLabelText('Serial number')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Commit Modifications' }));

    await waitFor(() => expect(updateProperty).toHaveBeenCalledWith(101, expect.objectContaining({
      propertyNumber: '',
      serialNumber: ''
    })));
  });
});
