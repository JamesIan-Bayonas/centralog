import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../App';
import { PropertyOverview } from '../PropertyOverview';
import { useAuth } from '../../context/AuthContext';
import { api, assetApi, assetApiEnriched, type Asset } from '../../services/api';

vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));

const asset: Asset = {
  id: 40, name: 'Thinkpad', categoryTag: 'Workstations', procurementCost: 35000,
  roomId: 101, custodianId: 1, lifecycleState: 1,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  acquisitionDate: '2026-01-10T00:00:00Z', nextServiceDate: null,
  isMaintenanceFlagged: false, expectedLifespanMonths: 60, depreciationMethod: 1,
  salvageValue: 0
};

function setRole(roleName = 'Manager') {
  vi.mocked(useAuth).mockReturnValue({
    user: { userId: 1, username: 'qa', email: 'qa@example.invalid', roleName },
    token: 'fixture', isAuthenticated: true, loginSession: vi.fn(), logoutSession: vi.fn(),
    hasClearance: roles => roleName === 'SystemAdmin' || roles.includes(roleName)
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  setRole();
  vi.spyOn(api, 'get').mockImplementation(async url => ({ data: url.includes('summary') ? {
    totalAssetCount: 1, totalSystemValue: 35000, activeCount: 0,
    inMaintenanceCount: 0, urgentAlertCount: 0, disposedCount: 0
  } : { items: [asset], totalCount: 1, pageNumber: 1, pageSize: 20, totalPages: 1 } }));
  vi.spyOn(assetApiEnriched, 'getCategoryTagSuggestions').mockResolvedValue(['Workstations']);
  vi.spyOn(assetApiEnriched, 'getHardwareNameSuggestions').mockResolvedValue([]);
  vi.spyOn(assetApiEnriched, 'getAssetById').mockResolvedValue(asset);
  const history = { assetId: asset.id, assetName: asset.name, timelineEntries: [] };
  vi.spyOn(assetApi, 'getAssetHistory').mockResolvedValue(history);
  vi.spyOn(assetApiEnriched, 'getAssetHistory').mockResolvedValue(history);
});

describe('Partner QA reports #8, #9 and #10', () => {
  it.each(['   ', '\t\u00a0 '])('#10 rejects whitespace-only registration (%j) before dispatch and permits correction', async name => {
    const register = vi.spyOn(assetApiEnriched, 'importAssetRegistryBatch').mockResolvedValue({ recordsImported: 1, message: 'Registered' });
    render(<App />);
    await screen.findByRole('row', { name: /Thinkpad/ });
    const nameInput = screen.getByLabelText(/Asset name/);
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.change(screen.getByLabelText(/Procurement cost/), { target: { value: '5000' } });
    fireEvent.submit(nameInput.closest('form')!);
    expect(register).not.toHaveBeenCalled();
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an asset name containing more than spaces.');

    fireEvent.change(nameInput, { target: { value: '  Thinkpad  ' } });
    fireEvent.submit(nameInput.closest('form')!);
    await waitFor(() => expect(register).toHaveBeenCalledWith([{
      name: 'Thinkpad', categoryTag: 'Workstations', procurementCost: 5000,
      roomId: 101, custodianId: 1, imageUrl: undefined
    }]));
  });

  it('#8 rejects a cleared acquisition date and saves the explicitly corrected date', async () => {
    const update = vi.spyOn(assetApiEnriched, 'updateProperty').mockResolvedValue({ message: 'Saved' });
    render(<PropertyOverview assetId={40} onBack={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Edit Property/i }));
    const date = screen.getByLabelText(/Acquisition date/);
    expect(date).toHaveValue('2026-01-10');
    fireEvent.change(date, { target: { value: '' } });
    fireEvent.submit(date.closest('form')!);
    expect(update).not.toHaveBeenCalled();
    expect(date).toHaveAttribute('aria-invalid', 'true');
    expect(date).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid acquisition date.');
    expect(screen.getByRole('dialog', { name: 'Edit property' })).toBeInTheDocument();

    fireEvent.change(date, { target: { value: '2026-02-15' } });
    fireEvent.submit(date.closest('form')!);
    await waitFor(() => expect(update).toHaveBeenCalledWith(40, expect.objectContaining({ acquisitionDate: '2026-02-15' })));
  });

  it('#8 does not prefill today when the stored acquisition date is absent', async () => {
    vi.mocked(assetApiEnriched.getAssetById).mockResolvedValue({ ...asset, acquisitionDate: undefined });
    render(<PropertyOverview assetId={40} onBack={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Edit Property/i }));
    expect(screen.getByLabelText(/Acquisition date/)).toHaveValue('');
  });

  it.each(['Manager', 'SystemAdmin', 'InventoryStaff', 'GeneralStaff'])('#9 exposes an accessible category detail action for %s and returns focus after dismissal', async role => {
    setRole(role);
    render(<App />);
    const categoryButton = await screen.findByRole('button', { name: 'Workstations: open asset details for Thinkpad' });
    expect(categoryButton).toHaveAttribute('type', 'button');
    expect(categoryButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(categoryButton.tabIndex).toBe(0);
    categoryButton.focus();
    fireEvent.click(categoryButton);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close asset details' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close asset details' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(categoryButton).toHaveFocus();
  });

  it('#9 opens the correct asset when two category actions have the same visible text', async () => {
    const secondAsset = { ...asset, id: 41, name: 'Laboratory workstation' };
    vi.mocked(api.get).mockImplementation(async url => ({ data: url.includes('summary') ? {
      totalAssetCount: 2, totalSystemValue: 70000, activeCount: 0,
      inMaintenanceCount: 0, urgentAlertCount: 0, disposedCount: 0
    } : {
      items: [asset, secondAsset], totalCount: 2, pageNumber: 1, pageSize: 20, totalPages: 1
    } }));
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Workstations: open asset details for Laboratory workstation' }));
    expect(await screen.findByRole('heading', { name: 'Laboratory workstation' })).toBeInTheDocument();
    await waitFor(() => expect(assetApi.getAssetHistory).toHaveBeenCalledWith(41));
  });
});
