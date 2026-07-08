// Simulated delay to mimic network latency
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface DashboardSummary {
  totalAssetCount: number;
  totalSystemValue: number;
  activeCount: number;
  inMaintenanceCount: number;
  disposedCount: number;
}

export interface Asset {
  id: number;
  name: string;
  categoryTag: string;
  procurementCost: number;
  roomId: string;
  custodianName: string;
  lifecycleState: number; // 1 = Procured, 2 = Active, 3 = Under Maintenance, 5 = Disposed
  isMaintenanceFlagged: boolean;
  serialNumber: string;
}

// Robust seed data mimicking your production schema
const MOCK_ASSETS: Asset[] = [
  { id: 101, name: "Lenovo Legion R7 (RTX 4060)", categoryTag: "Workstations", procurementCost: 68500, roomId: "Lab 3A", custodianName: "J. Bayonas", lifecycleState: 2, isMaintenanceFlagged: false, serialNumber: "L3N-LEGION-4060X" },
  { id: 102, name: "Dell PowerEdge R740 Server", categoryTag: "Infrastructure", procurementCost: 145000, roomId: "Server Room", custodianName: "Admin IT", lifecycleState: 2, isMaintenanceFlagged: true, serialNumber: "PE-R740-SYS99" },
  { id: 103, name: "Cisco Catalyst 2960X Switch", categoryTag: "Networking", procurementCost: 32000, roomId: "Rack B", custodianName: "Network Team", lifecycleState: 3, isMaintenanceFlagged: false, serialNumber: "CSCO-CAT-2960" },
  { id: 104, name: "HP LaserJet Enterprise M506", categoryTag: "Peripherals", procurementCost: 24500, roomId: "Admin Office", custodianName: "Dept Clerk", lifecycleState: 5, isMaintenanceFlagged: false, serialNumber: "HP-LJ-M506-PROD" },
  { id: 105, name: "MacBook Pro 16\" M3 Max", categoryTag: "Workstations", procurementCost: 185000, roomId: "Dev Lab 1", custodianName: "Lead Dev", lifecycleState: 2, isMaintenanceFlagged: false, serialNumber: "APL-MBP-M3MAX" },
  { id: 106, name: "Ubiquiti UniFi AP AC Pro", categoryTag: "Networking", procurementCost: 9500, roomId: "Hallway 2", custodianName: "Network Team", lifecycleState: 2, isMaintenanceFlagged: false, serialNumber: "UBNT-UAPAC-02" }
];

export const mockApi = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    await sleep(400); // Simulate network round-trip
    const active = MOCK_ASSETS.filter(a => a.lifecycleState === 2).length;
    const maintenance = MOCK_ASSETS.filter(a => a.lifecycleState === 3 || a.isMaintenanceFlagged).length;
    const disposed = MOCK_ASSETS.filter(a => a.lifecycleState === 5).length;
    const totalValue = MOCK_ASSETS.reduce((sum, a) => sum + a.procurementCost, 0);

    return {
      totalAssetCount: MOCK_ASSETS.length,
      totalSystemValue: totalValue,
      activeCount: active,
      inMaintenanceCount: maintenance,
      disposedCount: disposed
    };
  },

  searchAssets: async (searchTerm: string): Promise<Asset[]> => {
    await sleep(600);
    if (!searchTerm) return MOCK_ASSETS;
    
    const lowerSearch = searchTerm.toLowerCase();
    return MOCK_ASSETS.filter(asset => 
      asset.name.toLowerCase().includes(lowerSearch) ||
      asset.categoryTag.toLowerCase().includes(lowerSearch) ||
      asset.serialNumber.toLowerCase().includes(lowerSearch) ||
      asset.roomId.toLowerCase().includes(lowerSearch)
    );
  }
};