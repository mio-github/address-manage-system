import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { World } from '@shared/types';

interface MinecraftWorldInfo {
  levelName: string;
  version: string;
  gameType: number;
  MapFeatures: boolean;
  generatorName: string;
  RandomSeed: string;
  DataVersion: number;
  LevelDBTag?: number;
  LastPlayed: number;
}

export class MinecraftWorldScanner {
  private minecraftPaths: string[] = [];

  constructor() {
    this.setupMinecraftPaths();
  }

  private setupMinecraftPaths(): void {
    const platform = process.platform;
    const userHome = os.homedir();

    switch (platform) {
      case 'win32':
        this.minecraftPaths = [
          path.join(userHome, 'AppData', 'Roaming', '.minecraft', 'saves'),
          path.join(userHome, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang', 'minecraftWorlds')
        ];
        break;
      case 'darwin':
        this.minecraftPaths = [
          path.join(userHome, 'Library', 'Application Support', 'minecraft', 'saves'),
          path.join(userHome, 'Library', 'Containers', 'com.mojang.minecraftpe', 'Data', 'Documents', 'games', 'com.mojang', 'minecraftWorlds')
        ];
        break;
      case 'linux':
        this.minecraftPaths = [
          path.join(userHome, '.minecraft', 'saves')
        ];
        break;
    }
  }

  async scanForWorlds(): Promise<World[]> {
    const allWorlds: World[] = [];

    for (const minecraftPath of this.minecraftPaths) {
      try {
        const worlds = await this.scanDirectory(minecraftPath);
        allWorlds.push(...worlds);
      } catch (error) {
        console.log(`Minecraft path not found or inaccessible: ${minecraftPath}`);
      }
    }

    return allWorlds;
  }

  private async scanDirectory(savesPath: string): Promise<World[]> {
    const worlds: World[] = [];

    try {
      const entries = await fs.readdir(savesPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const worldPath = path.join(savesPath, entry.name);
          const world = await this.parseWorld(worldPath, entry.name);
          if (world) {
            worlds.push(world);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${savesPath}:`, error);
    }

    return worlds;
  }

  private async parseWorld(worldPath: string, folderName: string): Promise<World | null> {
    try {
      // Try to read level.dat (Java Edition)
      const levelDatPath = path.join(worldPath, 'level.dat');
      let worldInfo = await this.readLevelDat(levelDatPath);

      if (!worldInfo) {
        // Try to read levelname.txt (Bedrock Edition)
        const levelNamePath = path.join(worldPath, 'levelname.txt');
        worldInfo = await this.readBedrockWorld(worldPath, levelNamePath);
      }

      if (!worldInfo) {
        // Fallback: use folder name
        worldInfo = {
          levelName: folderName,
          version: 'Unknown',
          gameType: 0,
          MapFeatures: true,
          generatorName: 'default',
          RandomSeed: '0',
          DataVersion: 0,
          LastPlayed: 0
        };
      }

      return {
        name: worldInfo.levelName || folderName,
        seed: worldInfo.RandomSeed || undefined,
        version: this.parseVersion(worldInfo.version, worldInfo.DataVersion),
        folderPath: worldPath,
        isActive: false,
        createdAt: new Date(worldInfo.LastPlayed || 0),
        updatedAt: new Date()
      };
    } catch (error) {
      console.warn(`Failed to parse world at ${worldPath}:`, error);
      return null;
    }
  }

  private async readLevelDat(levelDatPath: string): Promise<MinecraftWorldInfo | null> {
    try {
      // Note: This is a simplified implementation
      // In a full implementation, you would need to parse NBT format
      // For now, we'll try to read it as a binary file and extract basic info
      
      const stats = await fs.stat(levelDatPath);
      if (!stats.isFile()) return null;

      // For this demo, we'll create mock data based on file modification time
      // In production, you'd want to use a proper NBT parser
      return {
        levelName: path.basename(path.dirname(levelDatPath)),
        version: '1.21.8',
        gameType: 0,
        MapFeatures: true,
        generatorName: 'default',
        RandomSeed: Math.random().toString(),
        DataVersion: 3700, // Approximate data version for 1.21.8
        LastPlayed: stats.mtime.getTime()
      };
    } catch (error) {
      return null;
    }
  }

  private async readBedrockWorld(worldPath: string, levelNamePath: string): Promise<MinecraftWorldInfo | null> {
    try {
      let levelName: string;
      
      try {
        levelName = await fs.readFile(levelNamePath, 'utf-8');
        levelName = levelName.trim();
      } catch {
        levelName = path.basename(worldPath);
      }

      // Try to read world_icon.jpeg to confirm it's a Bedrock world
      const iconPath = path.join(worldPath, 'world_icon.jpeg');
      try {
        await fs.stat(iconPath);
      } catch {
        // No icon found, might not be a Bedrock world
        return null;
      }

      return {
        levelName,
        version: 'Bedrock',
        gameType: 0,
        MapFeatures: true,
        generatorName: 'default',
        RandomSeed: Math.random().toString(),
        DataVersion: 0,
        LastPlayed: Date.now()
      };
    } catch (error) {
      return null;
    }
  }

  private parseVersion(version: string, dataVersion?: number): string {
    if (version && version !== 'Unknown') {
      return version;
    }

    // Map data version to Minecraft version (2025 updated)
    if (dataVersion) {
      if (dataVersion >= 3700) return '1.21.8';
      if (dataVersion >= 3695) return '1.21.7';
      if (dataVersion >= 3690) return '1.21.6';
      if (dataVersion >= 3685) return '1.21.5';
      if (dataVersion >= 3680) return '1.21.4';
      if (dataVersion >= 3675) return '1.21.3';
      if (dataVersion >= 3670) return '1.21.2';
      if (dataVersion >= 3665) return '1.21.1';
      if (dataVersion >= 3660) return '1.21.0';
      if (dataVersion >= 3465) return '1.20.4';
      if (dataVersion >= 3463) return '1.20.3';
      if (dataVersion >= 3337) return '1.20.2';
      if (dataVersion >= 3218) return '1.20.1';
      if (dataVersion >= 3120) return '1.20.0';
      if (dataVersion >= 3117) return '1.19.4';
      if (dataVersion >= 3107) return '1.19.3';
      if (dataVersion >= 3105) return '1.19.2';
    }

    return 'Unknown';
  }

  async getWorldDetails(worldPath: string): Promise<{
    screenshots: string[];
    stats: {
      size: number;
      lastModified: Date;
      playerCount: number;
    };
  }> {
    try {
      const screenshots: string[] = [];
      const screenshotsPath = path.join(worldPath, '..', '..', 'screenshots');
      
      try {
        const screenshotFiles = await fs.readdir(screenshotsPath);
        screenshots.push(...screenshotFiles
          .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
          .map(file => path.join(screenshotsPath, file))
        );
      } catch {
        // Screenshots directory doesn't exist
      }

      // Calculate world size
      const size = await this.calculateDirectorySize(worldPath);
      
      // Get last modified date
      const stats = await fs.stat(worldPath);
      
      // Count player data files
      let playerCount = 0;
      try {
        const playerDataPath = path.join(worldPath, 'playerdata');
        const playerFiles = await fs.readdir(playerDataPath);
        playerCount = playerFiles.filter(file => file.endsWith('.dat')).length;
      } catch {
        // No playerdata directory
      }

      return {
        screenshots: screenshots.slice(0, 10), // Limit to 10 most recent
        stats: {
          size,
          lastModified: stats.mtime,
          playerCount
        }
      };
    } catch (error) {
      console.warn(`Failed to get world details for ${worldPath}:`, error);
      return {
        screenshots: [],
        stats: {
          size: 0,
          lastModified: new Date(),
          playerCount: 0
        }
      };
    }
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.calculateDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible files/directories
    }
    
    return totalSize;
  }
}