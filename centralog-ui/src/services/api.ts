import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:5162/api/v1';

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const getMediaUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface NewAssetPayloadDto {
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: number;
  custodianId: number;
  imageUrl?: string;
}

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

  propertyNumber?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  accountCategory?: string;
  imageUrl?: string;
  isStickerQueued?: boolean;
  description?: string;
}

export interface DashboardSummary {
  totalAssetCount: number;
  totalSystemValue: number;
  activeCount: number;
  inMaintenanceCount: number;
  disposedCount: number;
}

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

export interface MaintenanceResolutionPayload {
  resolutionNotes: string;
  repairCost: number;
  targetState: number;
}

export interface InitiateMaintenancePayload {
  issueDescription: string;
  isUrgent: boolean;
}

export interface UpdatePropertyPayload {
  name: string;
  propertyNumber: string;
  serialNumber: string;
  accountCategory: string;
  categoryTag: string;
  procurementCost: number;
  acquisitionDate: string;
  description: string;
  imageUrl?: string;
}

export interface UpdateCustodianPayload {
  newCustodianId: number;
  newRoomId: number;
}

// =========================================================================
// INTERCEPTORS
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

  getAssetById: async (id: number): Promise<Asset> => {
    const response = await api.get<Asset>(`/assets/${id}`);
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

export const assetApiEnriched = {
  ...assetApi,

  getHardwareNameSuggestions: async (query?: string): Promise<string[]> => {
    const response = await api.get<string[]>('/assets/suggestions/names', {
      params: { query }
    });
    return response.data;
  },

  getCategoryTagSuggestions: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/assets/suggestions/categories');
    return response.data;
  },
  
  getDepreciationLedgerReport: async (): Promise<DepreciationLedgerReportDto> => {
    const response = await api.get<DepreciationLedgerReportDto>('/assets/finance/ledger-report');
    return response.data;
  },

  initiateMaintenanceAction: async (assetId: number, payload: InitiateMaintenancePayload): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/assets/${assetId}/maintenance/initiate`, payload);
    return response.data;
  },

  resolveMaintenanceAction: async (assetId: number, payload: MaintenanceResolutionPayload): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${assetId}/maintenance/resolve`, payload);
    return response.data;
  },

  importAssetRegistryBatch: async (payload: NewAssetPayloadDto[]): Promise<{ recordsImported: number; message: string }> => {
    const response = await api.post<{ recordsImported: number; message: string }>('/assets/import', payload);
    return response.data;
  },

  updateProperty: async (id: number, payload: UpdatePropertyPayload): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/assets/${id}`, payload);
    return response.data;
  },

  updateCustodianAssignment: async (id: number, payload: UpdateCustodianPayload): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/assets/${id}/custodian`, payload);
    return response.data;
  },

  toggleStickerQueue: async (id: number): Promise<{ isStickerQueued: boolean; message: string }> => {
    const response = await api.post<{ isStickerQueued: boolean; message: string }>(`/assets/${id}/sticker-queue`);
    return response.data;
  },

  getStickerQueue: async (): Promise<Asset[]> => {
    const response = await api.get<Asset[]>('/assets/sticker-queue');
    return response.data;
  },

  verifyInventory: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${id}/verify-inventory`);
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ imageUrl: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ imageUrl: string; message: string }>(
      '/assets/upload-image', 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  activateAsset: async (id: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/assets/${id}/activate`);
    return response.data;
  },
};