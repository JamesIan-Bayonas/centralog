import axios from 'axios';

// const API_BASE_URL = 'https://localhost:7196/api/v1'; //<-- this is the link for the local development environment

/**
 * ARCHITECTURAL NETWORK BRIDGE CONFIGURATION
 * Vercel builds adaptively select the base production server URL,
 * while local runtimes fallback gracefully to your active Kestrel HTTP port profile.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5162/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =========================================================================
// SECURITY & DATA TRANSFER PROFILES
// =========================================================================
export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  roleName: string;
  token: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface Asset {
  id: number;
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: number;
  custodianId: number;
  lifecycleState: number; 
  createdAt: string;
  updatedAt: string;
  nextServiceDate: string | null;
  isMaintenanceFlagged: boolean;
  expectedLifespanMonths: number;
  depreciationMethod: number;
  salvageValue: number;
}

export interface DashboardSummary {
  totalAssetCount: number;
  totalSystemValue: number;
  activeCount: number;
  inMaintenanceCount: number;
  disposedCount: number;
}

// =========================================================================
// FEATURE 9: IMMUTABLE AUDIT TRAIL TIMELINE PROFILE DEFINITIONS
// =========================================================================
export interface AuditLogTimelineEntryDto {
  logId: number;
  oldRoomId: number;
  oldRoomName: string;
  newRoomId: number;
  newRoomName: string;
  oldCustodianId: number;
  oldCustodianName: string;
  newCustodianId: number;
  newCustodianName: string;
  modifiedByUserId: number;
  operatorUsername: string;
  timestamp: string;
}

export interface AssetHistoryDto {
  assetId: number;
  assetName: string;
  timelineEntries: AuditLogTimelineEntryDto[];
}

// =========================================================================
// INTERCEPTORS (REQUEST & RESPONSE ENFORCEMENT LABELS)
// =========================================================================
api.interceptors.request.use(
  (config) => {
    const sessionToken = sessionStorage.getItem('cl_session_token');
    if (sessionToken && config.headers) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      const serverError = error.response.data;
      if (serverError.error) {
        error.message = serverError.error;
      } else if (serverError.message) {
        error.message = serverError.message;
      }
    } else if (error.request) {
      error.message = 'Network Error: Gateway timeout or server connection refused.';
    }
    return Promise.reject(error);
  }
);

// =========================================================================
// INTERACTIVE DOMAIN MAPPINGS
// =========================================================================
export const DepreciationMethodMap: Record<number, string> = {
  1: 'Straight-Line Depreciation',
  2: 'Double-Declining Balance'
};

export const LifecycleStateMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Procured', color: 'var(--text-muted)' },
  2: { label: 'Active Fleet', color: 'var(--clr-success)' },
  3: { label: 'In Maintenance', color: 'var(--clr-warning)' },
  4: { label: 'Fully Depreciated', color: 'var(--accent)' },
  5: { label: 'Disposed / Retired', color: 'var(--clr-danger)' }
};

// =========================================================================
// REST API ROUTER COMPONENT MODULE ACTIONS
// =========================================================================
export const assetApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/assets/dashboard/summary');
    return response.data;
  },

  searchAssets: async (searchTerm: string, page: number, pageSize: number): Promise<PagedResult<Asset>> => {
    const response = await api.get<PagedResult<Asset>>('/assets/search', {
      params: { searchTerm, pageNumber: page, pageSize }
    });
    return response.data;
  },

  executeBulkTransfer: async (assetIds: number[], destinationRoomId: number, newCustodianId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/assets/bulk-transfer', {
      assetIds,
      destinationRoomId,
      newCustodianId
    });
    return response.data;
  },

  disposeAsset: async (assetId: number, disposalReason: string, scrapRecoveryValue: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${assetId}/dispose`, {
      disposalReason,
      scrapRecoveryValue
    });
    return response.data;
  },

  getAssetHistory: async (assetId: number): Promise<AssetHistoryDto> => {
    const response = await api.get<AssetHistoryDto>(`/assets/${assetId}/history`);
    return response.data;
  }
};

// =========================================================================
// FEATURE 7: FINANCIAL LEDGER DTO PROFILES
// =========================================================================
export interface LedgerAssetRowDto {
  assetId: number;
  assetName: string;
  categoryTag: string;
  depreciationMethod: string;
  historicalCost: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  salvageValue: number;
  currentStatus: string;
}

export interface DepreciationLedgerReportDto {
  generatedAt: string;
  totalHistoricalCost: number;
  totalCurrentBookValue: number;
  rows: LedgerAssetRowDto[];
}

// 1. ADDED: Payload contract interface matching C# API Controller expectation exactly
export interface MaintenanceResolutionPayload {
  resolutionNotes: string;
  repairCost: number;
  targetState: number;
}

export interface InitiateMaintenancePayload {
  issueDescription: string;
  isUrgent: boolean;
}

export interface MaintenanceResolutionPayload {
  resolutionNotes: string;
  repairCost: number;
  targetState: number; // Maps to C# LifecycleState Enum (e.g., 2 = Active)
}

export interface NewAssetPayloadDto {
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: number;
  custodianId: number;
}
// 2. EXTENDED: Enriched endpoints tracking features natively
export const assetApiEnriched = {
  ...assetApi,

  /**
   * Fetches the complete real-time enterprise depreciation asset ledger report.
   * Guarded tightly by Accountant/SystemAdmin policies on both client and server layers.
   */
  getDepreciationLedgerReport: async (): Promise<DepreciationLedgerReportDto> => {
    const response = await api.get<DepreciationLedgerReportDto>('/assets/finance/ledger-report');
    return response.data;
  },

  /**
   * Transitions an asset out of active operations into an InMaintenance repair loop.
   * Automatically halts mathematical depreciation updates in the backend financial layers.
   */
  initiateMaintenanceAction: async (assetId: number, payload: InitiateMaintenancePayload): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/assets/${assetId}/maintenance/initiate`, payload);
    return response.data;
  },

  /**
   * Dispatches resolution notes and overhead costs to close out calibration loops.
   * Restores the asset back to standard active fleet tracking configurations.
   */
  resolveMaintenanceAction: async (assetId: number, payload: MaintenanceResolutionPayload): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${assetId}/maintenance/resolve`, payload);
    return response.data;
  },
  /**
   * Dispatches a fresh procurement batch entry collection to the database context layer.
   * Cleared for InventoryStaff, Managers, and SystemAdmin profiles.
   */
  importAssetRegistryBatch: async (payload: NewAssetPayloadDto[]): Promise<{ recordsImported: number; message: string }> => {
    const response = await api.post<{ recordsImported: number; message: string }>('/assets/import', payload);
    return response.data;
  } 
};