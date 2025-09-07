import { app, BrowserWindow } from 'electron';
import path from 'path';
import { DatabaseService } from './database/DatabaseService';
import { LocalDataService } from './services/LocalDataService';
import { MinecraftWorldScanner } from './services/MinecraftWorldScanner';
import { ImageAnalysisService } from './services/ImageAnalysisService';
import { FileManager } from './services/FileManager';
import { SeedAnalysisService } from './services/SeedAnalysisService';
import { MinecraftConnectionService } from './services/MinecraftConnectionService';
import { setupIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;
let databaseService: DatabaseService | LocalDataService;
let worldScanner: MinecraftWorldScanner;
let imageAnalysisService: ImageAnalysisService;
let fileManager: FileManager;
let seedAnalysisService: SeedAnalysisService;
let minecraftConnectionService: MinecraftConnectionService;

const isDevelopment = process.env.NODE_ENV === 'development';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '../../assets/icon.png'),
    backgroundColor: '#1A1A1A'
  });

  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  try {
    // Try SQLite database first
    databaseService = new DatabaseService();
    await databaseService.initialize();
    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.warn('SQLite database failed, falling back to JSON storage:', error);
    // Fallback to JSON-based local storage
    databaseService = new LocalDataService();
    await databaseService.initialize();
    console.log('Local JSON storage initialized successfully');
  }

  // Initialize world scanner
  worldScanner = new MinecraftWorldScanner();

  // Initialize other services
  imageAnalysisService = new ImageAnalysisService();
  fileManager = new FileManager();
  seedAnalysisService = new SeedAnalysisService();
  minecraftConnectionService = new MinecraftConnectionService();

  // Setup IPC handlers
  setupIpcHandlers({
    databaseService,
    worldScanner,
    imageAnalysisService,
    fileManager,
    seedAnalysisService,
    minecraftConnectionService
  });
}

app.whenReady().then(async () => {
  await initializeServices();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app updates
app.on('before-quit', async () => {
  if (databaseService) {
    await databaseService.close();
  }
});