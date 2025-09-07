export type DimensionType = 'overworld' | 'nether' | 'end';

export enum CoordinateCategory {
  BASE = 'base',
  FARM = 'farm',
  VILLAGE = 'village',
  STRONGHOLD = 'stronghold',
  MONUMENT = 'monument',
  PORTAL = 'portal',
  RESOURCE = 'resource',
  LANDMARK = 'landmark',
  TRIAL_CHAMBER = 'trial_chamber', // 1.21+ feature
  ANCIENT_CITY = 'ancient_city',   // Deep dark cities
  OTHER = 'other'
}

export enum LocationType {
  PLAYER_BASE = 'player_base',
  VILLAGE = 'village',
  STRONGHOLD = 'stronghold',
  DUNGEON = 'dungeon',
  MINESHAFT = 'mineshaft',
  MONUMENT = 'monument',
  MANSION = 'mansion',
  PORTAL = 'portal',
  FARM = 'farm',
  TRIAL_CHAMBER = 'trial_chamber', // 1.21+ Trial Chambers
  ANCIENT_CITY = 'ancient_city',   // Deep Dark Ancient Cities
  CHERRY_GROVE = 'cherry_grove',   // Cherry blossom biome
  NATURAL = 'natural',
  CUSTOM = 'custom'
}

export interface Coordinate {
  id?: number;
  worldId: number;
  x: number;
  y: number;
  z: number;
  dimension: DimensionType;
  name: string;
  description?: string;
  category: CoordinateCategory;
  locationType?: LocationType;
  locationDetails?: LocationDetails;
  isManuallyEdited: boolean;
  tags: string[];
  screenshotPath?: string;
  thumbnailPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDetails {
  structures?: string[];
  biome?: string;
  entities?: string[];
  blocks?: string[];
}

export interface DetectedLocation {
  id?: number;
  type: LocationType;
  name: string;
  confidence: number;
  details: LocationDetails;
  isManuallyEdited?: boolean;
}

export interface OcrResult {
  id?: number;
  screenshotId: number;
  detectedCoordinates?: {
    x: number;
    y: number;
    z: number;
    confidence: number;
    isManuallyEdited?: boolean;
  };
  rawText: string;
  processedAt: Date;
}

export interface AnalysisResult {
  coordinates?: {
    x: number;
    y: number;
    z: number;
    confidence: number;
  };
  location?: DetectedLocation;
  rawOcrText?: string;
}

export interface ManualEdit {
  coordinateId: number;
  fieldName: string;
  oldValue: any;
  newValue: any;
  editType: 'manual' | 'auto';
}