import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';

export interface MinecraftPlayerState {
  name: string;
  position: { x: number; y: number; z: number };
  dimension: string;
  health: number;
  gameMode: string;
  lastUpdate: Date;
}

export interface MinecraftGameState {
  isRunning: boolean;
  worldName: string;
  gameMode: string;
  difficulty: string;
  player: MinecraftPlayerState | null;
  serverInfo: {
    type: 'singleplayer' | 'multiplayer';
    address?: string;
    port?: number;
  };
  lastActivity: Date;
}

export interface MinecraftLogEntry {
  timestamp: Date;
  level: string;
  message: string;
  source: string;
  data?: any;
}

export class MinecraftConnectionService extends EventEmitter {
  private gameState: MinecraftGameState = {
    isRunning: false,
    worldName: '',
    gameMode: 'survival',
    difficulty: 'normal',
    player: null,
    serverInfo: { type: 'singleplayer' },
    lastActivity: new Date()
  };

  private logWatcher: any = null;
  private logFilePath: string = '';
  private lastLogPosition: number = 0;
  private minecraftPaths: string[] = [];
  private watchInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.setupMinecraftPaths();
  }

  private setupMinecraftPaths(): void {
    const platform = process.platform;
    const userHome = os.homedir();

    switch (platform) {
      case 'win32':
        this.minecraftPaths = [
          path.join(userHome, 'AppData', 'Roaming', '.minecraft'),
          path.join(userHome, 'AppData', 'Local', 'Packages', 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', 'LocalState', 'games', 'com.mojang')
        ];
        break;
      case 'darwin':
        this.minecraftPaths = [
          path.join(userHome, 'Library', 'Application Support', 'minecraft')
        ];
        break;
      case 'linux':
        this.minecraftPaths = [
          path.join(userHome, '.minecraft')
        ];
        break;
    }
  }

  /**
   * Minecraftとの接続を開始
   */
  async startConnection(): Promise<void> {
    try {
      // Minecraftのログファイルを見つける
      await this.findMinecraftLogFile();
      
      if (this.logFilePath) {
        console.log('Found Minecraft log file:', this.logFilePath);
        await this.startLogWatching();
        await this.parseExistingLogs();
        
        // 定期的にゲーム状態をチェック
        this.startGameStateMonitoring();
        
        this.emit('connected', this.gameState);
      } else {
        throw new Error('Minecraft log file not found');
      }
    } catch (error) {
      console.error('Failed to connect to Minecraft:', error);
      this.emit('error', error);
    }
  }

  /**
   * Minecraftとの接続を停止
   */
  async stopConnection(): Promise<void> {
    if (this.logWatcher) {
      this.logWatcher.close();
      this.logWatcher = null;
    }

    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }

    this.gameState.isRunning = false;
    this.emit('disconnected');
  }

  /**
   * 現在のゲーム状態を取得
   */
  getGameState(): MinecraftGameState {
    return { ...this.gameState };
  }

  /**
   * プレイヤーの現在位置を取得
   */
  getPlayerPosition(): { x: number; y: number; z: number } | null {
    return this.gameState.player?.position || null;
  }

  /**
   * Minecraftのログファイルを検索
   */
  private async findMinecraftLogFile(): Promise<void> {
    for (const minecraftPath of this.minecraftPaths) {
      try {
        const logsPath = path.join(minecraftPath, 'logs');
        const latestLogPath = path.join(logsPath, 'latest.log');
        
        await fs.access(latestLogPath);
        this.logFilePath = latestLogPath;
        return;
      } catch (error) {
        // 次のパスを試行
        continue;
      }
    }
  }

  /**
   * ログファイルの監視を開始
   */
  private async startLogWatching(): Promise<void> {
    if (!this.logFilePath) return;

    try {
      // ファイルの現在のサイズを取得
      const stats = await fs.stat(this.logFilePath);
      this.lastLogPosition = stats.size;

      this.logWatcher = watch(this.logFilePath, (eventType) => {
        if (eventType === 'change') {
          this.parseNewLogEntries();
        }
      });

      console.log('Started watching Minecraft log file');
    } catch (error) {
      console.error('Failed to start log watching:', error);
    }
  }

  /**
   * 新しいログエントリを解析
   */
  private async parseNewLogEntries(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFilePath);
      if (stats.size <= this.lastLogPosition) return;

      const fileHandle = await fs.open(this.logFilePath, 'r');
      const buffer = Buffer.alloc(stats.size - this.lastLogPosition);
      
      await fileHandle.read(buffer, 0, buffer.length, this.lastLogPosition);
      await fileHandle.close();

      const newContent = buffer.toString('utf8');
      const lines = newContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const logEntry = this.parseLogLine(line);
        if (logEntry) {
          this.processLogEntry(logEntry);
        }
      }

      this.lastLogPosition = stats.size;
    } catch (error) {
      console.error('Error parsing new log entries:', error);
    }
  }

  /**
   * 既存のログを解析して初期状態を設定
   */
  private async parseExistingLogs(): Promise<void> {
    try {
      const content = await fs.readFile(this.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // 最後の1000行のみを処理（パフォーマンス対策）
      const recentLines = lines.slice(-1000);
      
      for (const line of recentLines) {
        const logEntry = this.parseLogLine(line);
        if (logEntry) {
          this.processLogEntry(logEntry);
        }
      }
    } catch (error) {
      console.error('Error parsing existing logs:', error);
    }
  }

  /**
   * ログ行を解析してLogEntryに変換
   */
  private parseLogLine(line: string): MinecraftLogEntry | null {
    // Minecraftログの一般的な形式: [HH:MM:SS] [Thread/LEVEL]: Message
    const logRegex = /^\[(\d{2}:\d{2}:\d{2})\] \[([^\/]+)\/([A-Z]+)\]: (.+)$/;
    const match = line.match(logRegex);
    
    if (match) {
      const [, time, source, level, message] = match;
      const today = new Date();
      const [hour, minute, second] = time.split(':').map(Number);
      
      const timestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute, second);
      
      return {
        timestamp,
        level,
        message,
        source,
      };
    }
    
    return null;
  }

  /**
   * ログエントリを処理してゲーム状態を更新
   */
  private processLogEntry(entry: MinecraftLogEntry): void {
    this.gameState.lastActivity = entry.timestamp;
    this.gameState.isRunning = true;

    // 様々なログパターンを処理
    this.processWorldLoading(entry);
    this.processPlayerPosition(entry);
    this.processGameMode(entry);
    this.processDimension(entry);
    this.processServerConnection(entry);
    this.processPlayerStats(entry);

    this.emit('logEntry', entry);
    this.emit('gameStateUpdate', this.gameState);
  }

  /**
   * ワールド読み込みログを処理
   */
  private processWorldLoading(entry: MinecraftLogEntry): void {
    if (entry.message.includes('Loading world') || entry.message.includes('Preparing spawn area')) {
      const worldMatch = entry.message.match(/Loading world "([^"]+)"/);
      if (worldMatch) {
        this.gameState.worldName = worldMatch[1];
        this.emit('worldChanged', this.gameState.worldName);
      }
    }

    if (entry.message.includes('Joined the game') || entry.message.includes('logged in')) {
      this.gameState.isRunning = true;
      this.emit('playerJoined');
    }
  }

  /**
   * プレイヤー位置ログを処理
   */
  private processPlayerPosition(entry: MinecraftLogEntry): void {
    // デバッグ情報からプレイヤー位置を取得 (F3デバッグ情報)
    const positionMatch = entry.message.match(/XYZ: ([\d.-]+) \/ ([\d.-]+) \/ ([\d.-]+)/);
    if (positionMatch) {
      const [, x, y, z] = positionMatch;
      
      if (!this.gameState.player) {
        this.gameState.player = {
          name: 'Player',
          position: { x: 0, y: 0, z: 0 },
          dimension: 'overworld',
          health: 20,
          gameMode: 'survival',
          lastUpdate: new Date()
        };
      }

      this.gameState.player.position = {
        x: parseFloat(x),
        y: parseFloat(y),
        z: parseFloat(z)
      };
      this.gameState.player.lastUpdate = entry.timestamp;
      
      this.emit('playerPositionUpdate', this.gameState.player.position);
    }

    // テレポートコマンドの監視
    const teleportMatch = entry.message.match(/Teleported .+ to ([\d.-]+), ([\d.-]+), ([\d.-]+)/);
    if (teleportMatch) {
      const [, x, y, z] = teleportMatch;
      
      if (!this.gameState.player) {
        this.gameState.player = {
          name: 'Player',
          position: { x: 0, y: 0, z: 0 },
          dimension: 'overworld',
          health: 20,
          gameMode: 'survival',
          lastUpdate: new Date()
        };
      }

      this.gameState.player.position = {
        x: parseFloat(x),
        y: parseFloat(y),
        z: parseFloat(z)
      };
      this.gameState.player.lastUpdate = entry.timestamp;
      
      this.emit('playerTeleported', this.gameState.player.position);
    }
  }

  /**
   * ゲームモード変更を処理
   */
  private processGameMode(entry: MinecraftLogEntry): void {
    const gameModeMatch = entry.message.match(/Set own game mode to (\w+)/);
    if (gameModeMatch) {
      this.gameState.gameMode = gameModeMatch[1];
      if (this.gameState.player) {
        this.gameState.player.gameMode = gameModeMatch[1];
      }
      this.emit('gameModeChanged', this.gameState.gameMode);
    }
  }

  /**
   * ディメンション変更を処理
   */
  private processDimension(entry: MinecraftLogEntry): void {
    if (entry.message.includes('Changing dimension')) {
      const dimMatch = entry.message.match(/to (\w+):(\w+)/);
      if (dimMatch) {
        const dimension = dimMatch[2];
        if (this.gameState.player) {
          this.gameState.player.dimension = dimension;
        }
        this.emit('dimensionChanged', dimension);
      }
    }
  }

  /**
   * サーバー接続情報を処理
   */
  private processServerConnection(entry: MinecraftLogEntry): void {
    if (entry.message.includes('Connecting to') || entry.message.includes('Joining world')) {
      const serverMatch = entry.message.match(/Connecting to ([^,]+), (\d+)/);
      if (serverMatch) {
        this.gameState.serverInfo = {
          type: 'multiplayer',
          address: serverMatch[1],
          port: parseInt(serverMatch[2])
        };
        this.emit('serverConnected', this.gameState.serverInfo);
      } else {
        this.gameState.serverInfo = { type: 'singleplayer' };
      }
    }
  }

  /**
   * プレイヤー統計を処理
   */
  private processPlayerStats(entry: MinecraftLogEntry): void {
    // 体力やその他の統計情報があれば処理
    if (entry.message.includes('Health') && this.gameState.player) {
      const healthMatch = entry.message.match(/Health: ([\d.]+)/);
      if (healthMatch) {
        this.gameState.player.health = parseFloat(healthMatch[1]);
        this.emit('playerStatsUpdate', this.gameState.player);
      }
    }
  }

  /**
   * ゲーム状態の定期監視
   */
  private startGameStateMonitoring(): void {
    this.watchInterval = setInterval(async () => {
      // 最後のアクティビティから5分以上経過していたら非アクティブとする
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (this.gameState.lastActivity < fiveMinutesAgo) {
        this.gameState.isRunning = false;
        this.emit('gameInactive');
      }

      // ログファイルの存在確認
      if (this.logFilePath) {
        try {
          await fs.access(this.logFilePath);
        } catch {
          this.gameState.isRunning = false;
          this.emit('disconnected');
        }
      }
    }, 30000); // 30秒間隔でチェック
  }

  /**
   * 座標を自動記録
   */
  async autoSaveCoordinate(name?: string): Promise<void> {
    if (!this.gameState.player?.position) {
      throw new Error('Player position not available');
    }

    const coordinate = {
      worldId: 1, // TODO: 実際のワールドIDを使用
      x: Math.floor(this.gameState.player.position.x),
      y: Math.floor(this.gameState.player.position.y), 
      z: Math.floor(this.gameState.player.position.z),
      dimension: this.gameState.player.dimension as any,
      name: name || `Auto-saved (${new Date().toLocaleTimeString()})`,
      description: `Automatically saved from live game at ${new Date().toLocaleString()}`,
      category: 'OTHER' as any,
      locationType: 'CUSTOM' as any,
      isManuallyEdited: false,
      tags: ['auto-saved', 'live-game']
    };

    this.emit('autoSaveCoordinate', coordinate);
  }

  /**
   * 近くの座標を検索
   */
  findNearbyCoordinates(radius: number = 100): any[] {
    if (!this.gameState.player?.position) return [];

    const playerPos = this.gameState.player.position;
    // TODO: データベースから近くの座標を検索
    // この情報をUIに送信
    this.emit('nearbyCoordinatesFound', {
      playerPosition: playerPos,
      radius,
      coordinates: [] // TODO: 実際の座標データ
    });

    return [];
  }

  /**
   * ゲーム内コマンド実行のサポート
   */
  suggestCommands(): string[] {
    const suggestions = [];
    
    if (this.gameState.player?.position) {
      const pos = this.gameState.player.position;
      suggestions.push(
        `/tp ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)}`,
        `/setworldspawn ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)}`,
        `/spawnpoint @p ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)}`
      );
    }

    return suggestions;
  }
}