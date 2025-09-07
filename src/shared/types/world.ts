export interface World {
  id?: number;
  name: string;
  seed?: string;
  version: string;
  folderPath?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Screenshot {
  id?: number;
  coordinateId?: number;
  filePath: string;
  thumbnailPath?: string;
  ocrResult?: string;
  aiAnalysis?: string;
  isProcessed: boolean;
  processedAt?: Date;
  createdAt: Date;
}