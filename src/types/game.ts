export type VehicleId = 'kereta' | 'motor' | 'ambulans' | 'kereta_api' | 'bas';

export interface VehicleDefinition {
  id: VehicleId;
  name: string;
  imageSrc: string;
  cardBg: string;
  cardBorder: string;
  accentHex: string;
  badgeTextHex: string;
}

export interface LevelConfig {
  id: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  vehicles: VehicleId[];
  isFinal?: boolean;
}

export type GameScreen =
  | 'WELCOME'
  | 'MAP'
  | 'LEVEL'
  | 'CONGRATULATIONS'
  | 'PHOTOBOOTH';

export type FrameOption = 'rainbow' | 'stars' | 'bandar_ceria';

export interface CustomSoundEntry {
  fileName: string;
  dataUrl: string;
}

export type CustomSoundMap = Partial<Record<VehicleId, CustomSoundEntry>>;
