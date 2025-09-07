import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { World, Coordinate, ManualEdit } from '@shared/types';

interface LocalDatabase {
  worlds: World[];
  coordinates: Coordinate[];
  editHistory: ManualEdit[];
  settings: Record<string, any>;
  version: string;
}

export class LocalDataService {
  private dataPath: string;
  private data: LocalDatabase = {
    worlds: [],
    coordinates: [],
    editHistory: [],
    settings: {},
    version: '1.0.0'
  };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dataPath = path.join(userDataPath, 'mc-coordinate-keeper-data.json');
  }

  async initialize(): Promise<void> {
    try {
      await this.loadData();
    } catch (error) {
      console.log('No existing data found, starting fresh');
      await this.saveData();
    }
  }

  private async loadData(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      this.data = JSON.parse(fileContent);
      
      // Convert date strings back to Date objects
      this.data.worlds = this.data.worlds.map(world => ({
        ...world,
        createdAt: new Date(world.createdAt),
        updatedAt: new Date(world.updatedAt)
      }));

      this.data.coordinates = this.data.coordinates.map(coord => ({
        ...coord,
        createdAt: new Date(coord.createdAt),
        updatedAt: new Date(coord.updatedAt)
      }));
    } catch (error) {
      throw new Error(`Failed to load data: ${error}`);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const jsonData = JSON.stringify(this.data, null, 2);
      await fs.writeFile(this.dataPath, jsonData, 'utf-8');
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  // World operations
  async getAllWorlds(): Promise<World[]> {
    return [...this.data.worlds];
  }

  async createWorld(worldData: Omit<World, 'id' | 'createdAt' | 'updatedAt'>): Promise<World> {
    const newWorld: World = {
      ...worldData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.worlds.push(newWorld);
    await this.saveData();
    return newWorld;
  }

  async getWorld(id: number): Promise<World | null> {
    return this.data.worlds.find(world => world.id === id) || null;
  }

  async updateWorld(id: number, updates: Partial<World>): Promise<World | null> {
    const worldIndex = this.data.worlds.findIndex(world => world.id === id);
    if (worldIndex === -1) return null;

    this.data.worlds[worldIndex] = {
      ...this.data.worlds[worldIndex],
      ...updates,
      updatedAt: new Date()
    };

    await this.saveData();
    return this.data.worlds[worldIndex];
  }

  async deleteWorld(id: number): Promise<boolean> {
    const initialLength = this.data.worlds.length;
    this.data.worlds = this.data.worlds.filter(world => world.id !== id);
    
    if (this.data.worlds.length < initialLength) {
      // Also remove coordinates for this world
      this.data.coordinates = this.data.coordinates.filter(coord => coord.worldId !== id);
      await this.saveData();
      return true;
    }
    
    return false;
  }

  // Coordinate operations
  async getCoordinatesByWorld(worldId: number): Promise<Coordinate[]> {
    return this.data.coordinates.filter(coord => coord.worldId === worldId);
  }

  async createCoordinate(coordinateData: Omit<Coordinate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Coordinate> {
    const newCoordinate: Coordinate = {
      ...coordinateData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.coordinates.push(newCoordinate);
    await this.saveData();
    return newCoordinate;
  }

  async getCoordinate(id: number): Promise<Coordinate | null> {
    return this.data.coordinates.find(coord => coord.id === id) || null;
  }

  async updateCoordinate(id: number, updates: Partial<Coordinate>): Promise<Coordinate | null> {
    const coordIndex = this.data.coordinates.findIndex(coord => coord.id === id);
    if (coordIndex === -1) return null;

    this.data.coordinates[coordIndex] = {
      ...this.data.coordinates[coordIndex],
      ...updates,
      updatedAt: new Date()
    };

    await this.saveData();
    return this.data.coordinates[coordIndex];
  }

  async deleteCoordinate(id: number): Promise<boolean> {
    const initialLength = this.data.coordinates.length;
    this.data.coordinates = this.data.coordinates.filter(coord => coord.id !== id);
    
    if (this.data.coordinates.length < initialLength) {
      await this.saveData();
      return true;
    }
    
    return false;
  }

  // Edit history
  async saveEditHistory(edit: ManualEdit): Promise<void> {
    this.data.editHistory.push(edit);
    
    // Keep only the last 1000 edit history entries
    if (this.data.editHistory.length > 1000) {
      this.data.editHistory = this.data.editHistory.slice(-1000);
    }
    
    await this.saveData();
  }

  async getEditHistory(coordinateId: number): Promise<ManualEdit[]> {
    return this.data.editHistory.filter(edit => edit.coordinateId === coordinateId);
  }

  // Settings
  async getSetting(key: string): Promise<any> {
    return this.data.settings[key];
  }

  async setSetting(key: string, value: any): Promise<void> {
    this.data.settings[key] = value;
    await this.saveData();
  }

  // Utility methods
  private generateId(): number {
    const existingIds = [
      ...this.data.worlds.map(w => w.id || 0),
      ...this.data.coordinates.map(c => c.id || 0)
    ];
    return Math.max(0, ...existingIds) + 1;
  }

  // Import/Export
  async exportData(): Promise<LocalDatabase> {
    return JSON.parse(JSON.stringify(this.data));
  }

  async importData(importedData: Partial<LocalDatabase>): Promise<void> {
    // Merge imported data with existing data
    if (importedData.worlds) {
      // Re-assign IDs to avoid conflicts
      const worldIdMap = new Map<number, number>();
      importedData.worlds.forEach(world => {
        const oldId = world.id!;
        const newId = this.generateId();
        worldIdMap.set(oldId, newId);
        world.id = newId;
      });

      // Update coordinate worldIds
      if (importedData.coordinates) {
        importedData.coordinates.forEach(coord => {
          const newWorldId = worldIdMap.get(coord.worldId);
          if (newWorldId) {
            coord.worldId = newWorldId;
            coord.id = this.generateId();
          }
        });
      }

      this.data.worlds.push(...importedData.worlds);
    }

    if (importedData.coordinates) {
      this.data.coordinates.push(...importedData.coordinates);
    }

    if (importedData.settings) {
      this.data.settings = { ...this.data.settings, ...importedData.settings };
    }

    await this.saveData();
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(path.dirname(this.dataPath), `backup-${timestamp}.json`);
    
    const backupData = JSON.stringify(this.data, null, 2);
    await fs.writeFile(backupPath, backupData, 'utf-8');
    
    return backupPath;
  }

  async getDataPath(): Promise<string> {
    return this.dataPath;
  }

  async getStats(): Promise<{
    totalWorlds: number;
    totalCoordinates: number;
    totalEditHistory: number;
    dataSize: number;
    lastBackup?: Date;
  }> {
    try {
      const stats = await fs.stat(this.dataPath);
      return {
        totalWorlds: this.data.worlds.length,
        totalCoordinates: this.data.coordinates.length,
        totalEditHistory: this.data.editHistory.length,
        dataSize: stats.size,
        lastBackup: this.data.settings.lastBackup ? new Date(this.data.settings.lastBackup) : undefined
      };
    } catch (error) {
      return {
        totalWorlds: 0,
        totalCoordinates: 0,
        totalEditHistory: 0,
        dataSize: 0
      };
    }
  }

  async close(): Promise<void> {
    // For LocalDataService, we just need to save data one final time
    await this.saveData();
  }
}