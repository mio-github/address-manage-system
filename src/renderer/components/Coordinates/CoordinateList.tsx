import React, { useState } from 'react';
import { useCoordinateStore } from '../../stores/coordinateStore';
import { useWorldStore } from '../../stores/worldStore';
import { CoordinateCard } from './CoordinateCard';
import { CoordinateFilters } from './CoordinateFilters';

export const CoordinateList: React.FC = () => {
  const { currentWorld } = useWorldStore();
  const { filteredCoordinates, isLoading, error } = useCoordinateStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (!currentWorld) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🌍</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No World Selected
        </h3>
        <p className="text-gray-400">
          Please select a world to view coordinates.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Loading coordinates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Filters Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
        <CoordinateFilters />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Coordinates for {currentWorld.name}
              </h2>
              <p className="text-gray-400 text-sm">
                {filteredCoordinates.length} coordinate{filteredCoordinates.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="bg-gray-700 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Add Coordinate Button */}
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                ➕ Add Coordinate
              </button>
            </div>
          </div>
        </div>

        {/* Coordinates Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredCoordinates.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
                  : 'space-y-2'
              }
            >
              {filteredCoordinates.map((coordinate) => (
                <CoordinateCard
                  key={coordinate.id}
                  coordinate={coordinate}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Coordinates Found
              </h3>
              <p className="text-gray-400 mb-4">
                No coordinates match your current filters, or this world doesn't have any coordinates yet.
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                Upload Screenshots
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};