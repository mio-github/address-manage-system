import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

export class FileManager {
  private screenshotsDir: string;
  private thumbnailsDir: string;
  private backupsDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.screenshotsDir = path.join(userDataPath, 'screenshots');
    this.thumbnailsDir = path.join(userDataPath, 'thumbnails');
    this.backupsDir = path.join(userDataPath, 'backups');
    
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.screenshotsDir, { recursive: true });
    await fs.mkdir(this.thumbnailsDir, { recursive: true });
    await fs.mkdir(this.backupsDir, { recursive: true });
  }

  async saveScreenshot(imageBuffer: Buffer, filename: string): Promise<{ screenshotPath: string; thumbnailPath: string }> {
    const timestamp = Date.now();
    const screenshotFilename = `${timestamp}_${filename}`;
    const thumbnailFilename = `thumb_${timestamp}_${filename}`;

    const screenshotPath = path.join(this.screenshotsDir, screenshotFilename);
    const thumbnailPath = path.join(this.thumbnailsDir, thumbnailFilename);

    // Save original screenshot
    await fs.writeFile(screenshotPath, imageBuffer);

    // Create and save thumbnail
    await sharp(imageBuffer)
      .resize(320, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
      .toFile(thumbnailPath);

    return { screenshotPath, thumbnailPath };
  }

  async deleteScreenshot(screenshotPath: string, thumbnailPath?: string): Promise<void> {
    try {
      await fs.unlink(screenshotPath);
      if (thumbnailPath) {
        await fs.unlink(thumbnailPath);
      }
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
    }
  }

  async exportData(data: any, format: 'json' | 'csv', filename: string): Promise<string> {
    const exportPath = path.join(app.getPath('downloads'), filename);
    
    if (format === 'json') {
      await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      const csv = this.convertToCSV(data);
      await fs.writeFile(exportPath, csv);
    }

    return exportPath;
  }

  async importData(filePath: string, format: 'json' | 'csv'): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (format === 'json') {
      return JSON.parse(content);
    } else if (format === 'csv') {
      return this.parseCSV(content);
    }

    throw new Error('Unsupported format');
  }

  async createBackup(databasePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(this.backupsDir, backupFilename);

    await fs.copyFile(databasePath, backupPath);

    // Keep only last 10 backups
    await this.cleanOldBackups();

    return backupPath;
  }

  private async cleanOldBackups(): Promise<void> {
    const files = await fs.readdir(this.backupsDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup_'))
      .sort()
      .reverse();

    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.backupsDir, file));
      }
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index]?.replace(/^"|"$/g, '');
        return obj;
      }, {} as any);
    });
  }
}