import React from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { useCoordinateStore } from '../../stores/coordinateStore';

export const Dashboard: React.FC = () => {
  const { currentWorld } = useWorldStore();
  const { coordinates, filteredCoordinates } = useCoordinateStore();

  const stats = {
    totalCoordinates: coordinates.length,
    filteredCoordinates: filteredCoordinates.length,
    manuallyEdited: coordinates.filter(c => c.isManuallyEdited).length,
    byDimension: {
      overworld: coordinates.filter(c => c.dimension === 'overworld').length,
      nether: coordinates.filter(c => c.dimension === 'nether').length,
      end: coordinates.filter(c => c.dimension === 'end').length,
    },
  };

  const recentCoordinates = coordinates
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to MC Coordinate Keeper
        </h2>
        <p className="text-green-100">
          {currentWorld 
            ? `Managing coordinates for "${currentWorld.name}" (v${currentWorld.version})`
            : 'Select or create a world to get started'
          }
        </p>
      </div>

      {currentWorld ? (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Coordinates</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCoordinates}</p>
                </div>
                <div className="text-3xl">📍</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Manually Edited</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.manuallyEdited}</p>
                </div>
                <div className="text-3xl">✏️</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overworld</p>
                  <p className="text-2xl font-bold text-green-400">{stats.byDimension.overworld}</p>
                </div>
                <div className="text-3xl">🌍</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Nether</p>
                  <p className="text-2xl font-bold text-red-400">{stats.byDimension.nether}</p>
                </div>
                <div className="text-3xl">🔥</div>
              </div>
            </div>
          </div>

          {/* Recent Coordinates */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Coordinates</h3>
            
            {recentCoordinates.length > 0 ? (
              <div className="space-y-3">
                {recentCoordinates.map((coord) => (
                  <div
                    key={coord.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {coord.dimension === 'overworld' && '🌍'}
                        {coord.dimension === 'nether' && '🔥'}
                        {coord.dimension === 'end' && '🌌'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{coord.name}</p>
                        <p className="text-sm text-gray-400">
                          {coord.x}, {coord.y}, {coord.z}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {coord.isManuallyEdited && (
                        <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                          Edited
                        </span>
                      )}
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded capitalize">
                        {coord.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No coordinates found.</p>
                <p className="text-sm mt-1">Upload screenshots to get started!</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-3xl mb-2">📸</div>
              <p className="font-semibold">Upload Screenshots</p>
              <p className="text-sm text-green-100">Analyze coordinates automatically</p>
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-3xl mb-2">📍</div>
              <p className="font-semibold">Add Coordinate</p>
              <p className="text-sm text-blue-100">Manually create new coordinate</p>
            </button>

            <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="font-semibold">View Map</p>
              <p className="text-sm text-purple-100">Visualize coordinates on map</p>
            </button>
          </div>
        </>
      ) : (
        /* No World Selected */
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No World Selected
          </h3>
          <p className="text-gray-400 mb-4">
            Create a new world or select an existing one to start managing coordinates.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
            Create Your First World
          </button>
        </div>
      )}
    </div>
  );
};