import mimiImg from '../assets/images/mimi_character_1794703075928.jpg';
import keretaImg from '../assets/images/vehicle_kereta_1794703076093.jpg';
import motorImg from '../assets/images/vehicle_motor_1794703076920.jpg';
import ambulansImg from '../assets/images/vehicle_ambulans_1794703077621.jpg';
import keretaApiImg from '../assets/images/vehicle_kereta_api_1794703077511.jpg';
import basImg from '../assets/images/vehicle_bas_1794703078098.jpg';
import bgWelcomeImg from '../assets/images/bg_welcome_park_1794703485130.jpg';
import bgMapImg from '../assets/images/bg_mission_map_1794703485999.jpg';
import bgLevelImg from '../assets/images/bg_level_station_1794703485883.jpg';
import { LevelConfig, VehicleDefinition, VehicleId } from '../types/game';

export const MIMI_IMAGE_SRC = mimiImg;
export const BG_WELCOME_SRC = bgWelcomeImg;
export const BG_MAP_SRC = bgMapImg;
export const BG_LEVEL_SRC = bgLevelImg;

export const VEHICLES: Record<VehicleId, VehicleDefinition> = {
  kereta: {
    id: 'kereta',
    name: 'Kereta',
    imageSrc: keretaImg,
    cardBg: 'bg-[#EFF8FF]',
    cardBorder: 'border-[#93C5FD]',
    accentHex: '#60A5FA',
    badgeTextHex: '#1E40AF',
  },
  motor: {
    id: 'motor',
    name: 'Motor',
    imageSrc: motorImg,
    cardBg: 'bg-[#FFF1F5]',
    cardBorder: 'border-[#F9A8D4]',
    accentHex: '#F472B6',
    badgeTextHex: '#9D174D',
  },
  ambulans: {
    id: 'ambulans',
    name: 'Ambulans',
    imageSrc: ambulansImg,
    cardBg: 'bg-[#FFF5F5]',
    cardBorder: 'border-[#FCA5A5]',
    accentHex: '#F87171',
    badgeTextHex: '#991B1B',
  },
  kereta_api: {
    id: 'kereta_api',
    name: 'Kereta api',
    imageSrc: keretaApiImg,
    cardBg: 'bg-[#ECFDF5]',
    cardBorder: 'border-[#6EE7B7]',
    accentHex: '#34D399',
    badgeTextHex: '#065F46',
  },
  bas: {
    id: 'bas',
    name: 'Bas',
    imageSrc: basImg,
    cardBg: 'bg-[#FEFCE8]',
    cardBorder: 'border-[#FDE047]',
    accentHex: '#FACC15',
    badgeTextHex: '#854D0E',
  },
};

export const VEHICLE_ORDER: VehicleId[] = [
  'kereta',
  'motor',
  'ambulans',
  'kereta_api',
  'bas',
];

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Misi 1: Jalan Taman',
    subtitle: 'Dengar 3 bunyi kenderaan dan susun ikut urutan.',
    vehicles: ['kereta', 'motor', 'ambulans'],
  },
  {
    id: 2,
    title: 'Misi 2: Stesen Ceria',
    subtitle: 'Dengar 3 bunyi kenderaan dan susun ikut urutan.',
    vehicles: ['kereta_api', 'kereta', 'bas'],
  },
  {
    id: 3,
    title: 'Misi 3: Pekan Pelangi',
    subtitle: 'Dengar 3 bunyi kenderaan dan susun ikut urutan.',
    vehicles: ['ambulans', 'bas', 'motor'],
  },
  {
    id: 4,
    title: 'Misi 4: Cabaran Akhir',
    subtitle: 'Susun semua 5 kenderaan untuk selamatkan Mimi!',
    vehicles: ['kereta', 'motor', 'ambulans', 'kereta_api', 'bas'],
    isFinal: true,
  },
];

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createShuffledTray(targetSequence: VehicleId[]): VehicleId[] {
  if (targetSequence.length <= 1) return [...targetSequence];
  let candidate = shuffleArray(targetSequence);
  let attempts = 0;
  while (
    attempts < 6 &&
    candidate.every((item, idx) => item === targetSequence[idx])
  ) {
    candidate = shuffleArray(targetSequence);
    attempts++;
  }
  return candidate;
}
