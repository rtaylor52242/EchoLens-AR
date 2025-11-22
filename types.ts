export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface Memory {
  id: string;
  url: string;
  thumbnail: string;
  timestamp: string; // ISO Date
  location: {
    lat: number;
    lng: number;
    placeName: string;
  };
  description: string;
}

export interface ARSettings {
  opacity: number;
  scale: number;
  rotation: number;
  xOffset: number;
  yOffset: number;
}

export enum AppMode {
  SCANNING = 'SCANNING',
  AR_VIEW = 'AR_VIEW',
  ANALYZING = 'ANALYZING',
  CAPTURED = 'CAPTURED'
}
