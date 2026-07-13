import axios from 'axios';

// Instantiating the gateway pointer targeting our Visual Studio development environment server
const API_BASE_URL = 'https://localhost:7196/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Structural interface matching the exact layout contract returned by AuthController.cs
export interface AuthResponse {
  userId: number;
  username: string;
  email: string;
  roleName: string;
  token: string;
}

// Interface for standard paginated wrappers returned by PagedResult<T>
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Hard domain model mapping parameters from our core Asset entity fields
export interface Asset {
  id: number;
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: number;
  custodianId: number;
  lifecycleState: number; // 1=Procured, 2=Active, 3=InMaintenance, 4=Depreciated, 5=Disposed
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

// Configuration registry to inject secure bearer claim headers automatically into outbound threads
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

// Add these explicit structural mappings to the bottom of your existing api.ts file

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