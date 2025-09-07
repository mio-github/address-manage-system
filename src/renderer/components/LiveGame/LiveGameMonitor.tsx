import React, { useState, useEffect } from 'react';

interface GameState {
  isRunning: boolean;
  worldName: string;
  gameMode: string;
  difficulty: string;
  player: {
    name: string;
    position: { x: number; y: number; z: number };
    dimension: string;
    health: number;
    gameMode: string;
    lastUpdate: Date;
  } | null;
  serverInfo: {
    type: 'singleplayer' | 'multiplayer';
    address?: string;
    port?: number;
  };
  lastActivity: Date;
}

export const LiveGameMonitor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestedCommands, setSuggestedCommands] = useState<string[]>([]);
  const [autoSaveName, setAutoSaveName] = useState('');

  // 接続開始
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.minecraft.connect();
      if (result.success) {
        setIsConnected(true);
        startGameStatePolling();
      } else {
        setError(result.error || 'Failed to connect to Minecraft');
      }
    } catch (err) {
      setError('Failed to connect to Minecraft');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // 接続終了
  const handleDisconnect = async () => {
    try {
      const result = await window.electronAPI.minecraft.disconnect();
      if (result.success) {
        setIsConnected(false);
        setGameState(null);
        stopGameStatePolling();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  // ゲーム状態のポーリング
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const startGameStatePolling = () => {
    const interval = setInterval(async () => {
      try {
        const result = await window.electronAPI.minecraft.getGameState();
        if (result.success && result.gameState) {
          setGameState(result.gameState);
          
          // コマンド提案を更新
          const commandsResult = await window.electronAPI.minecraft.getSuggestedCommands();
          if (commandsResult.success && commandsResult.commands) {
            setSuggestedCommands(commandsResult.commands);
          }
        }
      } catch (err) {
        console.error('Failed to get game state:', err);
      }
    }, 2000); // 2秒間隔で更新

    setPollingInterval(interval);
  };

  const stopGameStatePolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // 自動座標保存
  const handleAutoSave = async () => {
    if (!gameState?.player?.position) {
      setError('No player position available');
      return;
    }

    try {
      const result = await window.electronAPI.minecraft.autoSaveCoordinate(autoSaveName || undefined);
      if (result.success) {
        setAutoSaveName('');
        // 成功通知（UI上で表示）
      } else {
        setError(result.error || 'Failed to save coordinate');
      }
    } catch (err) {
      setError('Failed to save coordinate');
      console.error('Auto save error:', err);
    }
  };

  // 近くの座標を検索
  const handleFindNearby = async () => {
    try {
      const result = await window.electronAPI.minecraft.findNearbyCoordinates(100);
      if (result.success) {
        console.log('Nearby coordinates:', result.coordinates);
        // TODO: 結果を表示するUI
      }
    } catch (err) {
      console.error('Find nearby error:', err);
    }
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      stopGameStatePolling();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-green-400">🎮 Live Game Monitor</h2>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? '接続中...' : 'Minecraftに接続'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              接続を切断
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-300 hover:text-red-200"
          >
            ✕ 閉じる
          </button>
        </div>
      )}

      {isConnected && gameState && (
        <div className="space-y-6">
          {/* ゲーム状態表示 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3">🌍 World Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">World:</span>
                  <span className="text-white">{gameState.worldName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Game Mode:</span>
                  <span className="text-white capitalize">{gameState.gameMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className="text-white capitalize">{gameState.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Server Type:</span>
                  <span className="text-white capitalize">{gameState.serverInfo.type}</span>
                </div>
                {gameState.serverInfo.type === 'multiplayer' && gameState.serverInfo.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white">{gameState.serverInfo.address}:{gameState.serverInfo.port}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3">👤 Player Info</h3>
              {gameState.player ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{gameState.player.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white font-mono">
                      {Math.floor(gameState.player.position.x)}, {Math.floor(gameState.player.position.y)}, {Math.floor(gameState.player.position.z)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dimension:</span>
                    <span className="text-white capitalize">{gameState.player.dimension}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className="text-red-400">❤️ {gameState.player.health}/20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update:</span>
                    <span className="text-gray-300">
                      {new Date(gameState.player.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No player data available</p>
              )}
            </div>
          </div>

          {/* 座標保存セクション */}
          {gameState.player && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3">📍 Coordinate Actions</h3>
              <div className="flex items-center space-x-4 mb-4">
                <input
                  type="text"
                  placeholder="座標の名前（オプション）"
                  value={autoSaveName}
                  onChange={(e) => setAutoSaveName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:border-green-400"
                />
                <button
                  onClick={handleAutoSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  現在位置を保存
                </button>
                <button
                  onClick={handleFindNearby}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  近くの座標を検索
                </button>
              </div>

              {/* 提案コマンド */}
              {suggestedCommands.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">📋 Suggested Commands:</h4>
                  <div className="space-y-1">
                    {suggestedCommands.map((command, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-gray-600 rounded text-sm font-mono text-green-300 cursor-pointer hover:bg-gray-500"
                        onClick={() => navigator.clipboard.writeText(command)}
                        title="Click to copy"
                      >
                        {command}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    💡 Click on any command to copy it to clipboard
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isConnected && !isConnecting && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⛏️</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Minecraft Connection</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect to your running Minecraft instance to monitor your game state in real-time,
            automatically save coordinates, and get helpful command suggestions.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-md mx-auto text-left">
            <h4 className="font-semibold text-green-400 mb-2">📋 Requirements:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Minecraft Java Edition running</li>
              <li>• World must be loaded and active</li>
              <li>• Log files must be accessible</li>
              <li>• Supports both Singleplayer and Multiplayer</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};