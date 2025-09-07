import { create } from 'zustand';
import { Coordinate, CoordinateCategory, DimensionType } from '@shared/types';

interface CoordinateStore {
  coordinates: Coordinate[];
  filteredCoordinates: Coordinate[];
  filters: {
    dimension: DimensionType | 'all';
    category: CoordinateCategory | 'all';
    searchTerm: string;
    showManuallyEdited: boolean;
  };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCoordinates: (worldId: number) => Promise<void>;
  refreshCoordinates: (worldId: number) => Promise<void>;
  createCoordinate: (coordinate: Omit<Coordinate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Coordinate>;
  updateCoordinate: (id: number, updates: Partial<Coordinate>) => Promise<void>;
  updateCoordinateManually: (id: number, updates: Partial<Coordinate>, fieldName: string, oldValue: any, newValue: any) => Promise<void>;
  deleteCoordinate: (id: number) => Promise<void>;
  setFilters: (filters: Partial<CoordinateStore['filters']>) => void;
  applyFilters: () => void;
}

export const useCoordinateStore = create<CoordinateStore>((set, get) => ({
  coordinates: [],
  filteredCoordinates: [],
  filters: {
    dimension: 'all',
    category: 'all',
    searchTerm: '',
    showManuallyEdited: false
  },
  isLoading: false,
  error: null,

  loadCoordinates: async (worldId: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const coordinates = await window.electronAPI.coordinates.getByWorld(worldId);
      
      set({ 
        coordinates,
        isLoading: false 
      });

      // Apply current filters
      get().applyFilters();
    } catch (error) {
      console.error('Failed to load coordinates:', error);
      set({ 
        error: 'Failed to load coordinates',
        isLoading: false 
      });
    }
  },

  refreshCoordinates: async (worldId: number) => {
    // Refresh coordinates - same as load but without showing loading state
    try {
      const coordinates = await window.electronAPI.coordinates.getByWorld(worldId);
      set({ coordinates });
      get().applyFilters();
    } catch (error) {
      console.error('Failed to refresh coordinates:', error);
    }
  },

  createCoordinate: async (coordinateData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newCoordinate = await window.electronAPI.coordinates.create(coordinateData);
      const coordinates = [...get().coordinates, newCoordinate];
      
      set({ 
        coordinates,
        isLoading: false 
      });

      get().applyFilters();
      return newCoordinate;
    } catch (error) {
      console.error('Failed to create coordinate:', error);
      set({ 
        error: 'Failed to create coordinate',
        isLoading: false 
      });
      throw error;
    }
  },

  updateCoordinate: async (id: number, updates: Partial<Coordinate>) => {
    try {
      const updatedCoordinate = await window.electronAPI.coordinates.update(id, updates);
      
      if (updatedCoordinate) {
        const coordinates = get().coordinates.map(coord => 
          coord.id === id ? updatedCoordinate : coord
        );
        
        set({ coordinates });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to update coordinate:', error);
      set({ error: 'Failed to update coordinate' });
    }
  },

  updateCoordinateManually: async (id: number, updates: Partial<Coordinate>, fieldName: string, oldValue: any, newValue: any) => {
    try {
      const updatedCoordinate = await window.electronAPI.coordinates.updateManually(
        id, 
        updates, 
        fieldName, 
        oldValue, 
        newValue
      );
      
      if (updatedCoordinate) {
        const coordinates = get().coordinates.map(coord => 
          coord.id === id ? updatedCoordinate : coord
        );
        
        set({ coordinates });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to update coordinate manually:', error);
      set({ error: 'Failed to update coordinate' });
    }
  },

  deleteCoordinate: async (id: number) => {
    try {
      const success = await window.electronAPI.coordinates.delete(id);
      
      if (success) {
        const coordinates = get().coordinates.filter(coord => coord.id !== id);
        set({ coordinates });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to delete coordinate:', error);
      set({ error: 'Failed to delete coordinate' });
    }
  },

  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
    get().applyFilters();
  },

  applyFilters: () => {
    const { coordinates, filters } = get();
    let filtered = [...coordinates];

    // Filter by dimension
    if (filters.dimension !== 'all') {
      filtered = filtered.filter(coord => coord.dimension === filters.dimension);
    }

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(coord => coord.category === filters.category);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(coord => 
        coord.name.toLowerCase().includes(searchTerm) ||
        coord.description?.toLowerCase().includes(searchTerm) ||
        coord.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by manually edited
    if (filters.showManuallyEdited) {
      filtered = filtered.filter(coord => coord.isManuallyEdited);
    }

    set({ filteredCoordinates: filtered });
  },
}));