import { contextBridge, ipcRenderer } from 'electron';
import { Coordinate, World, CoordinateCategory, DimensionType, LocationType } from '@shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // World operations
  worlds: {
    getAll: () => ipcRenderer.invoke('db:worlds:getAll'),
    create: (world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => 
      ipcRenderer.invoke('db:worlds:create', world),
    get: (id: number) => ipcRenderer.invoke('db:worlds:get', id),
  },

  // Coordinate operations
  coordinates: {
    getByWorld: (worldId: number) => ipcRenderer.invoke('db:coordinates:getByWorld', worldId),
    create: (coordinate: Omit<Coordinate, 'id' | 'createdAt' | 'updatedAt'>) => 
      ipcRenderer.invoke('db:coordinates:create', coordinate),
    update: (id: number, updates: Partial<Coordinate>) => 
      ipcRenderer.invoke('db:coordinates:update', { id, updates }),
    updateManually: (id: number, updates: Partial<Coordinate>, fieldName: string, oldValue: any, newValue: any) =>
      ipcRenderer.invoke('db:coordinates:updateManually', { id, updates, fieldName, oldValue, newValue }),
    delete: (id: number) => ipcRenderer.invoke('db:coordinates:delete', id),
  },

  // Image operations
  image: {
    analyze: (imagePath: string, options: any) => 
      ipcRenderer.invoke('image:analyze', { imagePath, options }),
    upload: () => ipcRenderer.invoke('image:upload'),
  },

  // File operations
  file: {
    export: (format: 'json' | 'csv', worldId?: number, filters?: any) => 
      ipcRenderer.invoke('file:export', { format, worldId, filters }),
    import: (format: 'json' | 'csv') => 
      ipcRenderer.invoke('file:import', { format }),
    backup: (includeImages: boolean = false) => 
      ipcRenderer.invoke('file:backup', { includeImages }),
  },

  // Dialog operations
  dialog: {
    showOpenDirectory: () => ipcRenderer.invoke('dialog:showOpenDirectory'),
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSaveDialog', options),
  },

  // Constants
  constants: {
    getCoordinateCategories: () => ipcRenderer.invoke('constants:getCoordinateCategories'),
    getDimensions: () => ipcRenderer.invoke('constants:getDimensions'),
    getLocationTypes: () => ipcRenderer.invoke('constants:getLocationTypes'),
  },

  // Minecraft world operations
  minecraft: {
    scanWorlds: () => ipcRenderer.invoke('minecraft:scanWorlds'),
    getWorldDetails: (worldPath: string) => ipcRenderer.invoke('minecraft:getWorldDetails', worldPath),
    importWorld: (worldData: World) => ipcRenderer.invoke('minecraft:importWorld', worldData),
    // Live connection operations
    connect: () => ipcRenderer.invoke('minecraft:connect'),
    disconnect: () => ipcRenderer.invoke('minecraft:disconnect'),
    getGameState: () => ipcRenderer.invoke('minecraft:getGameState'),
    getPlayerPosition: () => ipcRenderer.invoke('minecraft:getPlayerPosition'),
    autoSaveCoordinate: (name?: string) => ipcRenderer.invoke('minecraft:autoSaveCoordinate', name),
    findNearbyCoordinates: (radius?: number) => ipcRenderer.invoke('minecraft:findNearbyCoordinates', radius),
    getSuggestedCommands: () => ipcRenderer.invoke('minecraft:getSuggestedCommands'),
  },

  // Seed analysis operations
  seed: {
    analyze: (seed: string, worldId: number) => ipcRenderer.invoke('seed:analyze', { seed, worldId }),
    generateCoordinates: (seed: string, worldId: number, structureTypes?: string[]) => 
      ipcRenderer.invoke('seed:generateCoordinates', { seed, worldId, structureTypes }),
    findStrongholds: (seed: string) => ipcRenderer.invoke('seed:findStrongholds', { seed }),
    predictBiomes: (seed: string) => ipcRenderer.invoke('seed:predictBiomes', { seed }),
  },
});

// Type definitions for the renderer process
declare global {
  interface Window {
    electronAPI: {
      worlds: {
        getAll: () => Promise<World[]>;
        create: (world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => Promise<World>;
        get: (id: number) => Promise<World | null>;
      };
      coordinates: {
        getByWorld: (worldId: number) => Promise<Coordinate[]>;
        create: (coordinate: Omit<Coordinate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Coordinate>;
        update: (id: number, updates: Partial<Coordinate>) => Promise<Coordinate | null>;
        updateManually: (id: number, updates: Partial<Coordinate>, fieldName: string, oldValue: any, newValue: any) => Promise<Coordinate | null>;
        delete: (id: number) => Promise<boolean>;
      };
      image: {
        analyze: (imagePath: string, options: any) => Promise<{ success: boolean; result?: any; error?: string }>;
        upload: () => Promise<{ success: boolean; uploads?: any[]; error?: string }>;
      };
      file: {
        export: (format: 'json' | 'csv', worldId?: number, filters?: any) => Promise<{ success: boolean; path?: string; error?: string }>;
        import: (format: 'json' | 'csv') => Promise<{ success: boolean; data?: any; error?: string }>;
        backup: (includeImages?: boolean) => Promise<{ success: boolean; path?: string; error?: string }>;
      };
      dialog: {
        showOpenDirectory: () => Promise<any>;
        showSaveDialog: (options: any) => Promise<any>;
      };
      constants: {
        getCoordinateCategories: () => Promise<CoordinateCategory[]>;
        getDimensions: () => Promise<DimensionType[]>;
        getLocationTypes: () => Promise<LocationType[]>;
      };
      minecraft: {
        scanWorlds: () => Promise<{ success: boolean; worlds?: World[]; error?: string }>;
        getWorldDetails: (worldPath: string) => Promise<{ success: boolean; details?: any; error?: string }>;
        importWorld: (worldData: World) => Promise<{ success: boolean; world?: World; error?: string }>;
        // Live connection operations
        connect: () => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean; error?: string }>;
        getGameState: () => Promise<{ success: boolean; gameState?: any; error?: string }>;
        getPlayerPosition: () => Promise<{ success: boolean; position?: { x: number; y: number; z: number } | null; error?: string }>;
        autoSaveCoordinate: (name?: string) => Promise<{ success: boolean; error?: string }>;
        findNearbyCoordinates: (radius?: number) => Promise<{ success: boolean; coordinates?: any[]; error?: string }>;
        getSuggestedCommands: () => Promise<{ success: boolean; commands?: string[]; error?: string }>;
      };
      seed: {
        analyze: (seed: string, worldId: number) => Promise<{ success: boolean; result?: any; error?: string }>;
        generateCoordinates: (seed: string, worldId: number, structureTypes?: string[]) => Promise<{
          success: boolean;
          coordinates?: Coordinate[];
          analysisResult?: any;
          totalGenerated?: number;
          error?: string;
        }>;
        findStrongholds: (seed: string) => Promise<{ success: boolean; strongholds?: any[]; error?: string }>;
        predictBiomes: (seed: string) => Promise<{ success: boolean; biomes?: any[]; error?: string }>;
      };
    };
  }
}