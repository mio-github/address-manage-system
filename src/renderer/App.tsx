import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CoordinateList } from './components/Coordinates/CoordinateList';
import { ScreenshotProcessor } from './components/Screenshots/ScreenshotProcessor';
import { WorldSelector } from './components/Worlds/WorldSelector';
import { SeedAnalyzer } from './components/SeedAnalysis/SeedAnalyzer';
import { LiveGameMonitor } from './components/LiveGame/LiveGameMonitor';
import { useWorldStore } from './stores/worldStore';
import { useCoordinateStore } from './stores/coordinateStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export type AppView = 'dashboard' | 'coordinates' | 'live-game' | 'screenshots' | 'seed-analysis' | 'map' | 'settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const { currentWorld, loadWorlds } = useWorldStore();
  const { loadCoordinates } = useCoordinateStore();

  useEffect(() => {
    // Load initial data
    loadWorlds();
  }, [loadWorlds]);

  useEffect(() => {
    // Load coordinates when world changes
    if (currentWorld) {
      loadCoordinates(currentWorld.id!);
    }
  }, [currentWorld, loadCoordinates]);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'coordinates':
        return <CoordinateList />;
      case 'live-game':
        return <LiveGameMonitor />;
      case 'screenshots':
        return <ScreenshotProcessor />;
      case 'seed-analysis':
        return <SeedAnalyzer />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Layout 
          currentView={currentView} 
          onViewChange={setCurrentView}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-green-400">
                    MC Coordinate Keeper
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Manage your Minecraft coordinates with AI-powered screenshot analysis
                  </p>
                </div>
                
                <WorldSelector />
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
              {renderContent()}
            </main>
          </div>
        </Layout>
      </div>
    </QueryClientProvider>
  );
};

export default App;