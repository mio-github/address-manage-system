import { ipcMain, dialog } from 'electron';
import fs from 'fs/promises';
import { DatabaseService } from '../database/DatabaseService';
import { LocalDataService } from '../services/LocalDataService';
import { MinecraftWorldScanner } from '../services/MinecraftWorldScanner';
import { ImageAnalysisService } from '../services/ImageAnalysisService';
import { FileManager } from '../services/FileManager';
import { SeedAnalysisService } from '../services/SeedAnalysisService';
import { Coordinate, World, CoordinateCategory, DimensionType, LocationType } from '@shared/types';

import { MinecraftConnectionService } from '../services/MinecraftConnectionService';

interface Services {
  databaseService: DatabaseService | LocalDataService;
  worldScanner: MinecraftWorldScanner;
  imageAnalysisService: ImageAnalysisService;
  fileManager: FileManager;
  seedAnalysisService: SeedAnalysisService;
  minecraftConnectionService: MinecraftConnectionService;
}

export function setupIpcHandlers({ databaseService, worldScanner, imageAnalysisService, fileManager, seedAnalysisService, minecraftConnectionService }: Services) {
  
  // World operations
  ipcMain.handle('db:worlds:getAll', async () => {
    if (!databaseService) return [];
    try {
      return await databaseService.getAllWorlds();
    } catch (error) {
      console.warn('Database operation failed:', error);
      return [];
    }
  });

  ipcMain.handle('db:worlds:create', async (_, world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!databaseService) return null;
    try {
      return await databaseService.createWorld(world);
    } catch (error) {
      console.warn('Database operation failed:', error);
      return null;
    }
  });

  ipcMain.handle('db:worlds:get', async (_, id: number) => {
    if (!databaseService) return null;
    try {
      return await databaseService.getWorld(id);
    } catch (error) {
      console.warn('Database operation failed:', error);
      return null;
    }
  });

  // Coordinate operations
  ipcMain.handle('db:coordinates:getByWorld', async (_, worldId: number) => {
    if (!databaseService) return [];
    try {
      return await databaseService.getCoordinatesByWorld(worldId);
    } catch (error) {
      console.warn('Database operation failed:', error);
      return [];
    }
  });

  ipcMain.handle('db:coordinates:create', async (_, coordinate: Omit<Coordinate, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await databaseService.createCoordinate(coordinate);
  });

  ipcMain.handle('db:coordinates:update', async (_, { id, updates }: { id: number; updates: Partial<Coordinate> }) => {
    return await databaseService.updateCoordinate(id, updates);
  });

  ipcMain.handle('db:coordinates:delete', async (_, id: number) => {
    return await databaseService.deleteCoordinate(id);
  });

  ipcMain.handle('db:coordinates:updateManually', async (_, { id, updates, fieldName, oldValue, newValue }: { 
    id: number; 
    updates: Partial<Coordinate>;
    fieldName: string;
    oldValue: any;
    newValue: any;
  }) => {
    const result = await databaseService.updateCoordinate(id, { ...updates, isManuallyEdited: true });
    
    // Save edit history
    await databaseService.saveEditHistory({
      coordinateId: id,
      fieldName,
      oldValue,
      newValue,
      editType: 'manual'
    });

    return result;
  });

  // Image analysis operations
  ipcMain.handle('image:analyze', async (_, { imagePath }: { imagePath: string; options?: any }) => {
    try {
      const result = await imageAnalysisService.analyzeScreenshot(imagePath);
      return { success: true, result };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('image:upload', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Screenshot',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }
        ],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'No file selected' };
      }

      const uploadResults = [];

      for (const filePath of result.filePaths) {
        const imageBuffer = await fs.readFile(filePath);
        const filename = filePath.split('/').pop() || 'screenshot.png';
        
        const { screenshotPath, thumbnailPath } = await fileManager.saveScreenshot(imageBuffer, filename);
        
        uploadResults.push({
          originalPath: filePath,
          screenshotPath,
          thumbnailPath,
          filename
        });
      }

      return { success: true, uploads: uploadResults };
    } catch (error) {
      console.error('Upload failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // File operations
  ipcMain.handle('file:export', async (_, { format, worldId }: { 
    format: 'json' | 'csv';
    worldId?: number;
    filters?: any;
  }) => {
    try {
      let coordinates;
      if (worldId) {
        coordinates = await databaseService.getCoordinatesByWorld(worldId);
      } else {
        // Get all coordinates across worlds
        const worlds = await databaseService.getAllWorlds();
        coordinates = [];
        for (const world of worlds) {
          const worldCoords = await databaseService.getCoordinatesByWorld(world.id!);
          coordinates.push(...worldCoords);
        }
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `coordinates_export_${timestamp}.${format}`;
      
      const exportPath = await fileManager.exportData(coordinates, format, filename);
      
      return { success: true, path: exportPath };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:import', async (_, { format }: { format: 'json' | 'csv' }) => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Coordinates',
        filters: [
          { name: format.toUpperCase(), extensions: [format] }
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, error: 'No file selected' };
      }

      const data = await fileManager.importData(result.filePaths[0], format);
      
      return { success: true, data };
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('file:backup', async (_) => {
    try {
      // Create database backup
      const backupPath = await fileManager.createBackup(''); // TODO: get actual db path
      
      return { success: true, path: backupPath };
    } catch (error) {
      console.error('Backup failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Utility operations
  ipcMain.handle('dialog:showOpenDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    return result;
  });

  ipcMain.handle('dialog:showSaveDialog', async (_, options: any) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  // Constants for renderer
  ipcMain.handle('constants:getCoordinateCategories', () => {
    return Object.values(CoordinateCategory);
  });

  ipcMain.handle('constants:getDimensions', () => {
    return ['overworld', 'nether', 'end'] as DimensionType[];
  });

  ipcMain.handle('constants:getLocationTypes', () => {
    return Object.values(LocationType);
  });

  // Minecraft world scanning
  ipcMain.handle('minecraft:scanWorlds', async () => {
    try {
      const discoveredWorlds = await worldScanner.scanForWorlds();
      return { success: true, worlds: discoveredWorlds };
    } catch (error) {
      console.error('World scanning failed:', error);
      return { success: false, error: (error as Error).message, worlds: [] };
    }
  });

  ipcMain.handle('minecraft:getWorldDetails', async (_, worldPath: string) => {
    try {
      const details = await worldScanner.getWorldDetails(worldPath);
      return { success: true, details };
    } catch (error) {
      console.error('Failed to get world details:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:importWorld', async (_, worldData: World) => {
    try {
      if (!databaseService) return { success: false, error: 'Database not available' };
      
      // Check if world already exists
      const existingWorlds = await databaseService.getAllWorlds();
      const existingWorld = existingWorlds.find(w => w.folderPath === worldData.folderPath);
      
      if (existingWorld) {
        return { success: false, error: 'World already imported', world: existingWorld };
      }

      // Create new world entry
      const newWorld = await databaseService.createWorld(worldData);
      return { success: true, world: newWorld };
    } catch (error) {
      console.error('Failed to import world:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Seed analysis operations
  ipcMain.handle('seed:analyze', async (_, { seed }: { seed: string; worldId: number }) => {
    try {
      const analysisResult = await seedAnalysisService.analyzeWorldSeed(seed);
      return { success: true, result: analysisResult };
    } catch (error) {
      console.error('Seed analysis failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('seed:generateCoordinates', async (_, { seed, worldId, structureTypes }: { 
    seed: string; 
    worldId: number; 
    structureTypes?: string[]; 
  }) => {
    try {
      const analysisResult = await seedAnalysisService.analyzeWorldSeed(seed);
      
      // フィルター処理
      let structures = analysisResult.nearbyStructures;
      if (structureTypes && structureTypes.length > 0) {
        structures = structures.filter(s => 
          structureTypes.includes(s.locationType) || 
          structureTypes.includes(s.category)
        );
      }
      
      // 座標データを生成
      const coordinates = await seedAnalysisService.generateCoordinatesFromStructures(worldId, structures);
      
      // データベースに一括保存
      const savedCoordinates = [];
      for (const coordinate of coordinates) {
        try {
          const saved = await databaseService.createCoordinate(coordinate);
          savedCoordinates.push(saved);
        } catch (error) {
          console.warn('Failed to save coordinate:', error);
        }
      }
      
      return { 
        success: true, 
        coordinates: savedCoordinates, 
        analysisResult,
        totalGenerated: savedCoordinates.length 
      };
    } catch (error) {
      console.error('Coordinate generation failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('seed:findStrongholds', async (_, { seed }: { seed: string }) => {
    try {
      const analysisResult = await seedAnalysisService.analyzeWorldSeed(seed);
      return { success: true, strongholds: analysisResult.strongholds };
    } catch (error) {
      console.error('Stronghold search failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('seed:predictBiomes', async (_, { seed }: { seed: string }) => {
    try {
      const analysisResult = await seedAnalysisService.analyzeWorldSeed(seed);
      return { success: true, biomes: analysisResult.biomePredictions };
    } catch (error) {
      console.error('Biome prediction failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Minecraft live connection operations
  ipcMain.handle('minecraft:connect', async () => {
    try {
      await minecraftConnectionService.startConnection();
      return { success: true };
    } catch (error) {
      console.error('Failed to connect to Minecraft:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:disconnect', async () => {
    try {
      await minecraftConnectionService.stopConnection();
      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect from Minecraft:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:getGameState', () => {
    try {
      const gameState = minecraftConnectionService.getGameState();
      return { success: true, gameState };
    } catch (error) {
      console.error('Failed to get game state:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:getPlayerPosition', () => {
    try {
      const position = minecraftConnectionService.getPlayerPosition();
      return { success: true, position };
    } catch (error) {
      console.error('Failed to get player position:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:autoSaveCoordinate', async (_, name?: string) => {
    try {
      await minecraftConnectionService.autoSaveCoordinate(name);
      return { success: true };
    } catch (error) {
      console.error('Failed to auto-save coordinate:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:findNearbyCoordinates', (_, radius?: number) => {
    try {
      const coordinates = minecraftConnectionService.findNearbyCoordinates(radius);
      return { success: true, coordinates };
    } catch (error) {
      console.error('Failed to find nearby coordinates:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('minecraft:getSuggestedCommands', () => {
    try {
      const commands = minecraftConnectionService.suggestCommands();
      return { success: true, commands };
    } catch (error) {
      console.error('Failed to get suggested commands:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Setup event forwarding from MinecraftConnectionService
  minecraftConnectionService.on('connected', (gameState) => {
    // Forward to renderer via webContents (will be handled by main window)
  });

  minecraftConnectionService.on('disconnected', () => {
    // Forward to renderer
  });

  minecraftConnectionService.on('gameStateUpdate', (gameState) => {
    // Forward to renderer
  });

  minecraftConnectionService.on('playerPositionUpdate', (position) => {
    // Forward to renderer
  });

  minecraftConnectionService.on('autoSaveCoordinate', (coordinate) => {
    // Forward to renderer
  });
}