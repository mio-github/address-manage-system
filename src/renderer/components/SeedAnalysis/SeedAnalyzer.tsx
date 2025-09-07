import React, { useState } from 'react';
import { useWorldStore } from '../../stores/worldStore';
import { useCoordinateStore } from '../../stores/coordinateStore';

interface AnalysisResult {
  seed: string;
  spawnPoint: { x: number; y: number; z: number };
  nearbyStructures: any[];
  strongholds: any[];
  biomePredictions: any[];
  analysisDate: Date;
}

interface PredictedStructure {
  name: string;
  category: string;
  locationType: string;
  x: number;
  z: number;
  y?: number;
  dimension: string;
  confidence: number;
  distance: number;
  description: string;
}

export const SeedAnalyzer: React.FC = () => {
  const { currentWorld } = useWorldStore();
  const { refreshCoordinates } = useCoordinateStore();
  const [seedInput, setSeedInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const structureTypes = [
    { id: 'village', name: 'Villages', description: 'Trading and shelter' },
    { id: 'stronghold', name: 'Strongholds', description: 'End portal locations' },
    { id: 'monument', name: 'Ocean Monuments', description: 'Underwater temples' },
    { id: 'trial_chamber', name: 'Trial Chambers', description: '1.21+ underground challenges' },
    { id: 'ancient_city', name: 'Ancient Cities', description: 'Deep dark structures' },
    { id: 'landmark', name: 'Other Landmarks', description: 'Temples, outposts, etc.' }
  ];

  const handleAnalyzeSeed = async () => {
    if (!currentWorld) {
      alert('Please select a world first');
      return;
    }

    if (!seedInput.trim()) {
      alert('Please enter a seed value');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await window.electronAPI.seed.analyze(seedInput, currentWorld.id!);
      
      if (result.success) {
        setAnalysisResult(result.result);
      } else {
        console.error('Seed analysis failed:', result.error);
        alert(`Analysis failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error analyzing seed:', error);
      alert('Failed to analyze seed');
    }
    setIsAnalyzing(false);
  };

  const handleGenerateCoordinates = async () => {
    if (!currentWorld || !analysisResult) return;

    setIsAnalyzing(true);
    try {
      const result = await window.electronAPI.seed.generateCoordinates(
        analysisResult.seed,
        currentWorld.id!,
        selectedStructures.length > 0 ? selectedStructures : undefined
      );

      if (result.success) {
        alert(`Successfully generated ${result.totalGenerated} coordinates!`);
        await refreshCoordinates(currentWorld.id!);
      } else {
        console.error('Coordinate generation failed:', result.error);
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating coordinates:', error);
      alert('Failed to generate coordinates');
    }
    setIsAnalyzing(false);
  };

  const toggleStructureSelection = (structureId: string) => {
    setSelectedStructures(prev =>
      prev.includes(structureId)
        ? prev.filter(id => id !== structureId)
        : [...prev, structureId]
    );
  };

  if (!currentWorld) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Please select a world to analyze seeds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seed Input Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌱 Seed Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              World Seed
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-green-500"
                placeholder="Enter seed (e.g., 12345 or 'amazing_world')"
                disabled={isAnalyzing}
              />
              <button
                onClick={handleAnalyzeSeed}
                disabled={isAnalyzing || !seedInput.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze'}
              </button>
            </div>
            {currentWorld.seed && (
              <p className="text-sm text-gray-400 mt-1">
                Current world seed: {currentWorld.seed}
                <button
                  onClick={() => setSeedInput(currentWorld.seed || '')}
                  className="text-green-400 hover:text-green-300 ml-2 underline"
                >
                  Use This
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📊 Analysis Results</h3>
            <span className="text-sm text-gray-400">
              Seed: {analysisResult.seed}
            </span>
          </div>

          {/* Spawn Point */}
          <div className="mb-6">
            <h4 className="font-medium text-green-400 mb-2">🎯 Spawn Point</h4>
            <p className="text-white">
              X: {analysisResult.spawnPoint.x}, Y: {analysisResult.spawnPoint.y}, Z: {analysisResult.spawnPoint.z}
            </p>
          </div>

          {/* Structure Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-400">🏗️ Structure Types to Generate</h4>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-gray-400 hover:text-white"
              >
                {showAdvanced ? 'Hide Options' : 'Show Options'}
              </button>
            </div>
            
            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {structureTypes.map(structure => (
                  <label key={structure.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStructures.includes(structure.id)}
                      onChange={() => toggleStructureSelection(structure.id)}
                      className="rounded border-gray-600 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-white text-sm">{structure.name}</span>
                      <p className="text-xs text-gray-400">{structure.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            
            <button
              onClick={handleGenerateCoordinates}
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isAnalyzing ? '⚡ Generating...' : `⚡ Generate Coordinates (${analysisResult.nearbyStructures.length} found)`}
            </button>
          </div>

          {/* Structures Summary */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-400 mb-2">
                🏰 Nearby Structures ({analysisResult.nearbyStructures.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {analysisResult.nearbyStructures.slice(0, 10).map((structure: PredictedStructure, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{structure.name}</p>
                        <p className="text-gray-400">{structure.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400">{structure.distance}m away</p>
                        <p className="text-gray-400">{Math.floor(structure.confidence * 100)}% confident</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-yellow-400 mb-2">
                ⚡ Strongholds ({analysisResult.strongholds.length})
              </h4>
              <div className="space-y-2">
                {analysisResult.strongholds.map((stronghold: PredictedStructure, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">{stronghold.name}</span>
                      <span className="text-yellow-400">{stronghold.distance}m away</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analysisResult.biomePredictions.length > 0 && (
              <div>
                <h4 className="font-medium text-emerald-400 mb-2">
                  🌿 Special Biomes ({analysisResult.biomePredictions.length})
                </h4>
                <div className="space-y-2">
                  {analysisResult.biomePredictions.map((biome: any, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 text-sm">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-white">{biome.name}</span>
                          <p className="text-gray-400 text-xs">{biome.description}</p>
                        </div>
                        <span className="text-emerald-400">({biome.x}, {biome.z})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};