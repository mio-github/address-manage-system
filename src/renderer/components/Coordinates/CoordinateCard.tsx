import React from 'react';
import { Coordinate } from '@shared/types';

interface CoordinateCardProps {
  coordinate: Coordinate;
  viewMode: 'grid' | 'list';
}

export const CoordinateCard: React.FC<CoordinateCardProps> = ({ coordinate, viewMode }) => {
  const getDimensionIcon = (dimension: string) => {
    switch (dimension) {
      case 'overworld': return '🌍';
      case 'nether': return '🔥';
      case 'end': return '🌌';
      default: return '📍';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'base': return '🏠';
      case 'farm': return '🌾';
      case 'village': return '🏘️';
      case 'stronghold': return '🏰';
      case 'monument': return '🏛️';
      case 'portal': return '🌀';
      case 'resource': return '⛏️';
      case 'landmark': return '🗿';
      default: return '📍';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="minecraft-card flex items-center justify-between p-4 hover:bg-gray-700 transition-colors">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">
            {getDimensionIcon(coordinate.dimension)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{coordinate.name}</h3>
            <p className="text-sm text-gray-400">
              {coordinate.x}, {coordinate.y}, {coordinate.z}
            </p>
            {coordinate.description && (
              <p className="text-sm text-gray-500 mt-1">{coordinate.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getCategoryIcon(coordinate.category)}</span>
          {coordinate.isManuallyEdited && (
            <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
              Edited
            </span>
          )}
          <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded capitalize">
            {coordinate.category}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="minecraft-card hover:border-green-500 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getDimensionIcon(coordinate.dimension)}</span>
          <span className="text-lg">{getCategoryIcon(coordinate.category)}</span>
        </div>
        {coordinate.isManuallyEdited && (
          <span className="text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
            ✏️
          </span>
        )}
      </div>

      <h3 className="font-semibold text-white mb-2 truncate">{coordinate.name}</h3>
      
      <div className="text-green-400 font-mono text-sm mb-2">
        X: {coordinate.x} / Y: {coordinate.y} / Z: {coordinate.z}
      </div>

      {coordinate.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {coordinate.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded capitalize">
          {coordinate.category}
        </span>
        <span className="text-xs text-gray-500 capitalize">
          {coordinate.dimension}
        </span>
      </div>

      {coordinate.tags && coordinate.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {coordinate.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="text-xs bg-blue-600 text-blue-100 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {coordinate.tags.length > 3 && (
            <span className="text-xs text-gray-500">
              +{coordinate.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};