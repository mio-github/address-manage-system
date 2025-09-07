import React, { useEffect, useState } from 'react';
import { useCoordinateStore } from '../../stores/coordinateStore';
import { CoordinateCategory, DimensionType } from '@shared/types';

export const CoordinateFilters: React.FC = () => {
  const { filters, setFilters } = useCoordinateStore();
  const [categories, setCategories] = useState<CoordinateCategory[]>([]);
  const [dimensions, setDimensions] = useState<DimensionType[]>([]);

  useEffect(() => {
    // Load constants
    window.electronAPI.constants.getCoordinateCategories().then(setCategories);
    window.electronAPI.constants.getDimensions().then(setDimensions);
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Filters</h3>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search
        </label>
        <input
          type="text"
          value={filters.searchTerm}
          onChange={(e) => setFilters({ searchTerm: e.target.value })}
          placeholder="Search coordinates..."
          className="minecraft-input w-full"
        />
      </div>

      {/* Dimension Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Dimension
        </label>
        <select
          value={filters.dimension}
          onChange={(e) => setFilters({ dimension: e.target.value as DimensionType | 'all' })}
          className="minecraft-input w-full"
        >
          <option value="all">All Dimensions</option>
          {dimensions.map((dimension) => (
            <option key={dimension} value={dimension}>
              {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value as CoordinateCategory | 'all' })}
          className="minecraft-input w-full"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Show Manually Edited */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.showManuallyEdited}
            onChange={(e) => setFilters({ showManuallyEdited: e.target.checked })}
            className="rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm text-gray-300">Show only manually edited</span>
        </label>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => setFilters({
          dimension: 'all',
          category: 'all',
          searchTerm: '',
          showManuallyEdited: false
        })}
        className="w-full minecraft-button"
      >
        Clear Filters
      </button>
    </div>
  );
};