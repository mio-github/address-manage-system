import React from 'react';
import { AppView } from '../../App';

interface LayoutProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: '🏠' },
    { id: 'coordinates' as AppView, label: 'Coordinates', icon: '📍' },
    { id: 'live-game' as AppView, label: 'Live Game', icon: '🎮' },
    { id: 'screenshots' as AppView, label: 'Screenshots', icon: '📸' },
    { id: 'seed-analysis' as AppView, label: 'Seed Analysis', icon: '🌱' },
    { id: 'map' as AppView, label: 'Map', icon: '🗺️' },
    { id: 'settings' as AppView, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-green-400 mb-4">Navigation</h2>
          
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Quick Stats</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Coords:</span>
              <span className="text-white">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This World:</span>
              <span className="text-white">--</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Auto-detected:</span>
              <span className="text-green-400">--</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};