// File path: centralog-ui/src/services/api.ts

import axios from 'axios';

const API_BASE_URL = 'https://localhost:7196/api/v1';

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
    // Aligned to your operational session storage key parameter
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
  /**
   * Queries the live dashboard telemetry statistics from the C# backend.
   */
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get<DashboardSummary>('/assets/dashboard/summary');
    return response.data;
  },

  /**
   * Executes a paged network search filtering the physical asset registry rows.
   */
  searchAssets: async (searchTerm: string, page: number, pageSize: number): Promise<PagedResult<Asset>> => {
    const response = await api.get<PagedResult<Asset>>('/assets/search', {
      params: { searchTerm, pageNumber: page, pageSize }
    });
    return response.data;
  },

  /**
   * Authorizes and fires a bulk relational migration payload across rooms.
   */
  executeBulkTransfer: async (assetIds: number[], destinationRoomId: number, newCustodianId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/assets/bulk-transfer', {
      assetIds,
      destinationRoomId,
      newCustodianId
    });
    return response.data;
  },

  /**
   * Retires a targeted hardware asset from active capitalization tracking logs.
   */
  disposeAsset: async (assetId: number, disposalReason: string, scrapRecoveryValue: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${assetId}/dispose`, {
      disposalReason,
      scrapRecoveryValue
    });
    return response.data;
  },

  /**
   * Pulls the complete, enriched chronological audit trail for a targeted asset.
   * Satisfies Feature 9 UI layout consumption needs completely.
   */
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

// Extend the existing export const assetApi object container with this trailing handler:
export const assetApiEnriched = {
  ...assetApi,

  /**
   * Fetches the complete real-time enterprise depreciation asset ledger report.
   * Strictly guarded by Accountant role policies client and server side.
   */
  getDepreciationLedgerReport: async (): Promise<DepreciationLedgerReportDto> => {
    const response = await api.get<DepreciationLedgerReportDto>('/assets/finance/ledger-report');
    return response.data;
  }
};