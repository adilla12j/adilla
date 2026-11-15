import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Star,
  Check,
  Play,
  Music2,
  Camera,
  Home,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BG_MAP_SRC, LEVELS, MIMI_IMAGE_SRC } from '../data/gameConfig';
import { ProcessedSprite } from './ProcessedSprite';

interface MissionMapProps {
  completedLevels: number[];
  unlockedLevel: number;
  onSelectLevel: (levelId: 1 | 2 | 3 | 4) => void;
  onBackHome: () => void;
  onOpenSoundSettings: () => void;
  onGoToPhotobooth: () => void;
  isMusicMuted: boolean;
  onToggleMusic: () => void;
}

const CHECKPOINT_POSITIONS: Record<
  1 | 2 | 3 | 4,
  { x: number; y: number; labelOffsetY: number }
> = {
  1: { x: 225, y: 315, labelOffsetY: 64 },
  2: { x: 470, y: 175, labelOffsetY: -68 },
  3: { x: 725, y: 325, labelOffsetY: 64 },
  4: { x: 960, y: 170, labelOffsetY: -68 },
};

const MIMI_ROAD_POSITIONS: Record<number, { x: number; y: number }> = {
  0: { x: 115, y: 335 },
  1: { x: 345, y: 235 },
  2: { x: 598, y: 235 },
  3: { x: 842, y: 235 },
  4: { x: 1035, y: 132 },
};

export const MissionMap: React.FC<MissionMapProps> = ({
  completedLevels,
  unlockedLevel,
  onSelectLevel,
  onBackHome,
  onOpenSoundSettings,
  onGoToPhotobooth,
  isMusicMuted,
  onToggleMusic,
}) => {
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [shakingId, setShakingId] = useState<number | null>(null);

  const completedCount = completedLevels.length;
  const totalStars = completedCount * 3;
  const allCompleted = completedCount >= 4;

  const mimiPos = MIMI_ROAD_POSITIONS[Math.min(completedCount, 4)];

  const handleCheckpointClick = (levelId: 1 | 2 | 3 | 4) => {
    const isCompleted = completedLevels.includes(levelId);
    const isUnlocked = levelId <= unlockedLevel || isCompleted;

    if (!isUnlocked) {
      setShakingId(levelId);
      setLockedNotice(`Selesaikan Misi ${levelId - 1} dahulu untuk membuka Misi ${levelId}!`);
      window.setTimeout(() => setShakingId(null), 500);
      return;
    }

    setLockedNotice(null);
    onSelectLevel(levelId);
  };

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#93C5FD] bg-[#DBEAFE] p-4 shadow-xl sm:p-5">
      {/* Header Bar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackHome}
            aria-label="Kembali ke laman utama"
            className="toy-btn flex h-10 w-10 items-center justify-center rounded-xl border-b-4 border-pink-300 bg-[#FFF0F5] text-[#BE185D] hover:bg-pink-100 shrink-0"
          >
            <Home className="h-5 w-5" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#2B2D42] sm:text-2xl whitespace-nowrap">
            Peta Misi Mimi
          </h1>
        </div>

        {/* Unboxed Progress & Stars */}
        <div className="flex items-center gap-4 text-sm font-bold text-[#2B2D42] sm:text-base">
          <span>Kemajuan: {completedCount}/4 Misi</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-600 tabular-nums">
            <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
            {totalStars} / 12 Bintang
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={isMusicMuted ? 'Hidupkan muzik latar' : 'Senyapkan muzik latar'}
            className="toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 border-pink-300 bg-[#FFF0F5] px-3 py-2 text-xs font-bold text-[#BE185D] hover:bg-pink-100 sm:text-sm whitespace-nowrap shrink-0"
          >
            {isMusicMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="hidden md:inline">
              {isMusicMuted ? 'Muzik Senyap' : 'Muzik'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSoundSettings}
            className="toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 border-sky-300 bg-[#EFF8FF] px-3.5 py-2 text-xs font-bold text-[#1E40AF] hover:bg-sky-100 sm:text-sm whitespace-nowrap shrink-0"
          >
            <Music2 className="h-4 w-4" />
            <span>Bunyi MP3</span>
          </button>

          {allCompleted ? (
            <button
              type="button"
              onClick={onGoToPhotobooth}
              className="toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 border-pink-500 bg-[#FF6B9D] px-4 py-2 text-xs font-bold text-white hover:bg-[#FF558E] sm:text-sm whitespace-nowrap shrink-0"
            >
              <Camera className="h-4 w-4" />
              <span>Photobooth Mimi!</span>
            </button>
          ) : null}
        </div>
      </header>

      {/* Interactive Winding Road Stage over 3D Pastel Landscape */}
      <div className="relative my-3 flex-1 overflow-hidden rounded-3xl border-4 border-white shadow-inner">
        <img
          src={BG_MAP_SRC}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />

        {/* Winding Road & Rainbow Destination Arch Overlay */}
        <svg
          viewBox="0 0 1120 480"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Soft drop shadow beneath road */}
          <path
            d="M 35 375 C 140 365, 175 340, 225 315 C 310 275, 360 190, 470 175 C 585 160, 620 315, 725 325 C 835 335, 875 215, 960 170 C 1015 142, 1055 138, 1095 138"
            fill="none"
            stroke="rgba(43, 45, 66, 0.14)"
            strokeWidth="70"
            strokeLinecap="round"
            transform="translate(0, 8)"
          />
          {/* Winding Road Border */}
          <path
            d="M 35 375 C 140 365, 175 340, 225 315 C 310 275, 360 190, 470 175 C 585 160, 620 315, 725 325 C 835 335, 875 215, 960 170 C 1015 142, 1055 138, 1095 138"
            fill="none"
            stroke="#FDBA74"
            strokeWidth="62"
            strokeLinecap="round"
          />
          {/* Winding Road Surface */}
          <path
            d="M 35 375 C 140 365, 175 340, 225 315 C 310 275, 360 190, 470 175 C 585 160, 620 315, 725 325 C 835 335, 875 215, 960 170 C 1015 142, 1055 138, 1095 138"
            fill="none"
            stroke="#FEF3C7"
            strokeWidth="48"
            strokeLinecap="round"
          />
          {/* Dashed Center Line */}
          <path
            d="M 35 375 C 140 365, 175 340, 225 315 C 310 275, 360 190, 470 175 C 585 160, 620 315, 725 325 C 835 335, 875 215, 960 170 C 1015 142, 1055 138, 1095 138"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeDasharray="16 14"
            strokeLinecap="round"
          />

          {/* Destination Rainbow Arch near Checkpoint 4 */}
          <g transform="translate(1035, 130)">
            <path d="M-38,20 A38,38 0 0,1 38,20" fill="none" stroke="#F472B6" strokeWidth="7" strokeLinecap="round" />
            <path d="M-31,20 A31,31 0 0,1 31,20" fill="none" stroke="#FACC15" strokeWidth="7" strokeLinecap="round" />
            <path d="M-24,20 A24,24 0 0,1 24,20" fill="none" stroke="#34D399" strokeWidth="7" strokeLinecap="round" />
            <path d="M-17,20 A17,17 0 0,1 17,20" fill="none" stroke="#60A5FA" strokeWidth="7" strokeLinecap="round" />
          </g>
        </svg>

        {/* Exactly FOUR Numbered Checkpoints */}
        {LEVELS.map((level) => {
          const pos = CHECKPOINT_POSITIONS[level.id];
          const isCompleted = completedLevels.includes(level.id);
          const isUnlocked = level.id <= unlockedLevel || isCompleted;
          const isCurrent = level.id === unlockedLevel && !isCompleted;
          const isShaking = shakingId === level.id;

          return (
            <motion.div
              key={level.id}
              animate={isShaking ? { x: [-6, 6, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                left: `${(pos.x / 1120) * 100}%`,
                top: `${(pos.y / 480) * 100}%`,
              }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            >
              {isCurrent ? (
                <motion.div
                  animate={{ scale: [1, 1.24, 1], opacity: [0.65, 0.15, 0.65] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute -inset-3 rounded-full bg-[#FF8FAB]"
                />
              ) : null}

              <button
                type="button"
                onClick={() => handleCheckpointClick(level.id)}
                aria-label={`Misi ${level.id}: ${level.title}${isCompleted ? ' (Selesai)' : isUnlocked ? ' (Dibuka)' : ' (Terkunci)'}`}
                className={`toy-btn relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-white shadow-lg sm:h-20 sm:w-20 ${
                  isCompleted
                    ? 'bg-[#34D399] text-[#064E3B] ring-4 ring-emerald-200'
                    : isCurrent
                    ? 'bg-[#FF6B9D] text-white ring-4 ring-pink-200'
                    : isUnlocked
                    ? 'bg-[#60A5FA] text-white'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <>
                    <span className="font-display text-xl font-bold leading-none sm:text-2xl">
                      {level.id}
                    </span>
                    <Check className="mt-0.5 h-4 w-4 stroke-[3]" />
                  </>
                ) : isUnlocked ? (
                  <>
                    <span className="font-display text-xl font-bold leading-none sm:text-2xl">
                      {level.id}
                    </span>
                    <Play className="mt-0.5 h-4 w-4 fill-current" />
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span className="font-display text-sm font-bold">{level.id}</span>
                  </>
                )}
              </button>

              {/* Checkpoint Label */}
              <div
                className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border-2 px-3 py-1 text-center shadow-md ${
                  pos.labelOffsetY < 0 ? '-top-14 sm:-top-16' : 'top-18 sm:top-22'
                } ${
                  isCompleted
                    ? 'border-emerald-200 bg-white text-emerald-800'
                    : isCurrent
                    ? 'border-pink-300 bg-white text-[#BE185D]'
                    : 'border-slate-200 bg-white/95 text-slate-600'
                }`}
              >
                <div className="font-display text-xs font-bold sm:text-sm">
                  {level.isFinal ? 'Misi 4 · Akhir' : `Misi ${level.id}`}
                </div>
                <div className="flex items-center justify-center gap-0.5 text-[11px] font-bold">
                  {isCompleted ? (
                    <>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    </>
                  ) : isCurrent ? (
                    <span>Mula di sini!</span>
                  ) : (
                    <span>Terkunci</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Mimi Character Moving Forward Along the Winding Road */}
        <motion.div
          animate={{
            left: `${(mimiPos.x / 1120) * 100}%`,
            top: `${(mimiPos.y / 480) * 100}%`,
          }}
          transition={{ type: 'spring', stiffness: 90, damping: 14 }}
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center"
          >
            <div className="h-20 w-20 sm:h-24 sm:w-24">
              <ProcessedSprite
                src={MIMI_IMAGE_SRC}
                alt="Mimi di atas peta"
                className="h-full w-full object-contain drop-shadow-md"
                fallbackLabel="Mimi"
              />
            </div>
            <span className="-mt-1 rounded-xl bg-white/95 px-2.5 py-0.5 font-display text-xs font-bold text-[#BE185D] shadow-sm">
              Mimi
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Prompt / Locked Warning */}
      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-5 py-2.5 shadow-sm">
        <p className="text-sm font-bold text-[#2B2D42] sm:text-base">
          {lockedNotice ? (
            <span className="text-rose-600">{lockedNotice}</span>
          ) : allCompleted ? (
            <span className="text-emerald-700">
              Syabas! Semua 4 misi selesai! Jom bergambar di Photobooth Bersama Mimi!
            </span>
          ) : (
            <span>
              Tekan nombor <strong className="text-[#DB2777]">Misi {unlockedLevel}</strong> pada peta untuk memulakan cabaran!
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={() =>
            allCompleted
              ? onGoToPhotobooth()
              : onSelectLevel(Math.min(unlockedLevel, 4) as 1 | 2 | 3 | 4)
          }
          className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-[#DB2777] bg-[#FF6B9D] px-5 py-2.5 font-display text-base font-bold text-white hover:bg-[#FF558E] whitespace-nowrap shrink-0"
        >
          {allCompleted ? (
            <>
              <Camera className="h-5 w-5" />
              <span>Buka Photobooth</span>
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" />
              <span>Main Misi {unlockedLevel}</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
