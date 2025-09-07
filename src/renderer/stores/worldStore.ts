import { create } from 'zustand';
import { World } from '@shared/types';

interface WorldStore {
  worlds: World[];
  currentWorld: World | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentWorld: (world: World) => void;
  loadWorlds: () => Promise<void>;
  createWorld: (world: Omit<World, 'id' | 'createdAt' | 'updatedAt'>) => Promise<World>;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  worlds: [],
  currentWorld: null,
  isLoading: false,
  error: null,

  setCurrentWorld: (world: World) => {
    set({ currentWorld: world });
  },

  loadWorlds: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const worlds = await window.electronAPI.worlds.getAll();
      
      // Set first world as current if no current world selected
      const currentWorld = get().currentWorld || worlds[0] || null;
      
      set({ 
        worlds, 
        currentWorld, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load worlds:', error);
      set({ 
        error: 'Failed to load worlds',
        isLoading: false 
      });
    }
  },

  createWorld: async (worldData) => {
    set({ isLoading: true, error: null });
    
    try {
      const newWorld = await window.electronAPI.worlds.create(worldData);
      const worlds = [...get().worlds, newWorld];
      
      set({ 
        worlds,
        currentWorld: newWorld, // Set new world as current
        isLoading: false 
      });
      
      return newWorld;
    } catch (error) {
      console.error('Failed to create world:', error);
      set({ 
        error: 'Failed to create world',
        isLoading: false 
      });
      throw error;
    }
  },
}));