import React, { useState } from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { World } from '@shared/types';

export const WorldSelector: React.FC = () => {
  const { worlds, currentWorld, setCurrentWorld, createWorld, isLoading } = useWorldStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scannedWorlds, setScannedWorlds] = useState<World[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [newWorldData, setNewWorldData] = useState({
    name: '',
    seed: '',
    version: '1.21.8',
    folderPath: '',
  });

  const handleCreateWorld = async () => {
    if (!newWorldData.name.trim()) return;

    try {
      await createWorld({
        ...newWorldData,
        isActive: true,
      });

      setShowCreateModal(false);
      setNewWorldData({
        name: '',
        seed: '',
        version: '1.21.8',
        folderPath: '',
      });
    } catch (error) {
      console.error('Failed to create world:', error);
    }
  };

  const handleScanWorlds = async () => {
    setIsScanning(true);
    try {
      const result = await window.electronAPI.minecraft.scanWorlds();
      if (result.success && result.worlds) {
        setScannedWorlds(result.worlds);
      } else {
        console.error('Failed to scan worlds:', result.error);
      }
    } catch (error) {
      console.error('Error scanning worlds:', error);
    }
    setIsScanning(false);
  };

  const handleImportWorld = async (world: World) => {
    try {
      const result = await window.electronAPI.minecraft.importWorld(world);
      if (result.success && result.world) {
        // Refresh worlds list
        location.reload();
        setShowScanModal(false);
      } else {
        console.error('Failed to import world:', result.error);
      }
    } catch (error) {
      console.error('Error importing world:', error);
    }
  };

  return (
    <div className="relative">
      {/* World Selector Dropdown */}
      <div className="flex items-center space-x-2">
        <select
          value={currentWorld?.id || ''}
          onChange={(e) => {
            const worldId = parseInt(e.target.value);
            const world = worlds.find(w => w.id === worldId);
            if (world) {
              setCurrentWorld(world);
            }
          }}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
          disabled={isLoading}
        >
          <option value="">Select World</option>
          {worlds.map((world) => (
            <option key={world.id} value={world.id}>
              {world.name} (v{world.version})
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
          title="Create New World"
        >
          ➕
        </button>

        <button
          onClick={() => {
            setShowScanModal(true);
            handleScanWorlds();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          title="Scan Local Minecraft Worlds"
          disabled={isLoading}
        >
          🔍
        </button>
      </div>

      {/* Create World Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create New World</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  World Name *
                </label>
                <input
                  type="text"
                  value={newWorldData.name}
                  onChange={(e) => setNewWorldData({ ...newWorldData, name: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
                  placeholder="My Awesome World"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Minecraft Version
                </label>
                <select
                  value={newWorldData.version}
                  onChange={(e) => setNewWorldData({ ...newWorldData, version: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
                >
                  <option value="1.21.8">1.21.8 (Latest 2025)</option>
                  <option value="1.21.7">1.21.7</option>
                  <option value="1.21.6">1.21.6 - Chase the Skies</option>
                  <option value="1.21.5">1.21.5 - Spring to Life</option>
                  <option value="1.21.4">1.21.4</option>
                  <option value="1.21.3">1.21.3</option>
                  <option value="1.21.2">1.21.2</option>
                  <option value="1.21.1">1.21.1</option>
                  <option value="1.21.0">1.21.0</option>
                  <option value="1.20.4">1.20.4</option>
                  <option value="1.20.3">1.20.3</option>
                  <option value="1.20.2">1.20.2</option>
                  <option value="1.20.1">1.20.1</option>
                  <option value="1.19.4">1.19.4</option>
                  <option value="1.19.3">1.19.3</option>
                  <option value="1.19.2">1.19.2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Seed (Optional)
                </label>
                <input
                  type="text"
                  value={newWorldData.seed}
                  onChange={(e) => setNewWorldData({ ...newWorldData, seed: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  World Folder Path (Optional)
                </label>
                <input
                  type="text"
                  value={newWorldData.folderPath}
                  onChange={(e) => setNewWorldData({ ...newWorldData, folderPath: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
                  placeholder="/path/to/minecraft/saves/MyWorld"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorld}
                disabled={!newWorldData.name.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create World
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Worlds Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Local Minecraft Worlds</h3>

            {isScanning ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white">Scanning for Minecraft worlds...</div>
              </div>
            ) : (
              <>
                {scannedWorlds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No Minecraft worlds found on this computer.</p>
                    <p className="text-sm text-gray-500">
                      Make sure Minecraft is installed and you have created at least one world.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-300 mb-4">
                      Found {scannedWorlds.length} world(s). Click "Import" to add them to your coordinate manager.
                    </p>
                    
                    {scannedWorlds.map((world, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{world.name}</h4>
                          <p className="text-sm text-gray-400">Version: {world.version}</p>
                          {world.seed && (
                            <p className="text-sm text-gray-400">Seed: {world.seed}</p>
                          )}
                          <p className="text-xs text-gray-500 truncate" title={world.folderPath}>
                            {world.folderPath}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleImportWorld(world)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Import
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowScanModal(false);
                  setScannedWorlds([]);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleScanWorlds}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Rescan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};