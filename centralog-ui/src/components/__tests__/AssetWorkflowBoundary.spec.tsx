import { render, screen, fireEvent } from '@testing-library/react';
import { AssetDetailSidebar } from '../AssetDetailSidebar';
import { useAuth } from '../../context/AuthContext';
import { type Asset } from '../../services/api';

// Mock the Auth Context core layer to programmatically mutate permission bounds
jest.mock('../../context/AuthContext');
const mockedUseAuth = useAuth as jest.Mock;

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
  const onInitiateMock = jest.fn();
  const onResolveMock = jest.fn();
  const onActivateMock = jest.fn();
  const onCloseMock = jest.fn();
  const onOpenOverviewMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[CRITICAL-UI-01]: Must completely hide action options if account lacks clearance scopes', () => {
    mockedUseAuth.mockReturnValue({
      hasClearance: () => false
    });

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

    expect(screen.queryByText(/System Actions & Lifecycle Control/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Transfer Out to Active Repair Loop/i })).not.toBeInTheDocument();
  });

  it('[CRITICAL-UI-02]: Must render freeze warnings and expose resolve buttons when asset is in maintenance', () => {
    mockedUseAuth.mockReturnValue({
      hasClearance: (roles: string[]) => roles.includes('Inventory Staff')
    });

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

    expect(screen.getByText(/\* Real-time calculation frozen for duration of maintenance window status/i)).toBeInTheDocument();
    
    const resolveBtn = screen.getByRole('button', { name: /Confirm Repair Completion & Unfreeze Asset/i });
    expect(resolveBtn).toBeInTheDocument();

    fireEvent.click(resolveBtn);
    expect(onResolveMock).toHaveBeenCalledWith(101);
  });

  it('[CRITICAL-UI-03]: Must trigger Property Overview navigation when Inspect button is pressed', () => {
    mockedUseAuth.mockReturnValue({
      hasClearance: (roles: string[]) => roles.includes('Inventory Staff')
    });

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

    const inspectBtn = screen.getByRole('button', { name: /Inspect Full Property Dashboard/i });
    expect(inspectBtn).toBeInTheDocument();

    fireEvent.click(inspectBtn);
    expect(onOpenOverviewMock).toHaveBeenCalledWith(101);
  });
});