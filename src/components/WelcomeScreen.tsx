import React from 'react';
import { motion } from 'motion/react';
import { Play, Music2, Star, Volume2, VolumeX } from 'lucide-react';
import { BG_WELCOME_SRC, MIMI_IMAGE_SRC, VEHICLES } from '../data/gameConfig';
import { ProcessedSprite } from './ProcessedSprite';

interface WelcomeScreenProps {
  onStartGame: () => void;
  onOpenSoundSettings: () => void;
  hasCustomSoundsCount: number;
  isMusicMuted: boolean;
  onToggleMusic: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartGame,
  onOpenSoundSettings,
  hasCustomSoundsCount,
  isMusicMuted,
  onToggleMusic,
}) => {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#FDE047] bg-[#E6F4FE] p-5 shadow-xl sm:p-8">
      {/* Lush 3D Storybook Park Backdrop */}
      <img
        src={BG_WELCOME_SRC}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {/* Gentle readable pastel scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/35 via-white/50 to-white/75"
      />

      {/* Top minimal bar */}
      <header className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 px-3.5 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF8FAB] text-white shadow-sm">
            <Star className="h-5 w-5 fill-current" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[#2B2D42] sm:text-xl whitespace-nowrap shrink-0">
            Misi Selamatkan Mimi
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={isMusicMuted ? 'Hidupkan muzik latar' : 'Senyapkan muzik latar'}
            className="toy-btn inline-flex items-center gap-1.5 rounded-2xl border-b-4 border-pink-300 bg-white/95 px-3.5 py-2 text-xs font-bold text-[#BE185D] shadow-sm hover:bg-pink-50 sm:text-sm whitespace-nowrap shrink-0"
          >
            {isMusicMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span>{isMusicMuted ? 'Muzik: Senyap' : 'Muzik: Hidup'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSoundSettings}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-sky-300 bg-white/95 px-4 py-2 text-xs font-bold text-[#1E40AF] shadow-sm hover:bg-sky-50 sm:text-sm whitespace-nowrap shrink-0"
          >
            <Music2 className="h-4 w-4" />
            <span>
              Bunyi Kenderaan{hasCustomSoundsCount > 0 ? ` (${hasCustomSoundsCount}/5 MP3)` : ''}
            </span>
          </button>
        </div>
      </header>

      {/* Main 2-column hero stage */}
      <main className="relative z-10 my-auto grid grid-cols-1 items-center gap-6 py-4 md:grid-cols-12 md:gap-8">
        {/* Left: Mimi Character */}
        <div className="flex flex-col items-center justify-center md:col-span-5">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-[#FFF0F5]/95 to-[#FEF9C3]/95 p-4 shadow-xl sm:h-72 sm:w-72"
          >
            <ProcessedSprite
              src={MIMI_IMAGE_SRC}
              alt="Mimi memakai tudung krim dengan reben merah jambu dan baju merah jambu"
              className="h-full w-full object-contain drop-shadow-md"
              fallbackLabel="Mimi"
            />
          </motion.div>
        </div>

        {/* Right: Title, Kid-Friendly Brief & Primary Start CTA */}
        <div className="flex flex-col items-center rounded-3xl border-2 border-white/80 bg-white/85 p-6 text-center shadow-lg backdrop-blur-md md:col-span-7 md:items-start md:text-left">
          <p className="mb-1.5 text-sm font-bold tracking-wide text-[#D9468F] sm:text-base">
            Permainan Pengembaraan Bunyi Kenderaan
          </p>
          <h1
            className="font-display text-4xl font-bold leading-tight text-[#2B2D42] sm:text-5xl"
            style={{ textWrap: 'balance' }}
          >
            Misi Selamatkan Mimi!
          </h1>
          <p className="mt-3 max-w-xl text-base font-semibold leading-relaxed text-[#4A4E69] sm:text-lg">
            Jom bantu Mimi sampai ke destinasi! Dengar bunyi kenderaan dengan teliti dan susun gambar ke dalam gerabak kereta api ikut urutan yang betul.
          </p>

          {/* Vehicle lineup preview */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
            {(['kereta', 'motor', 'ambulans', 'kereta_api', 'bas'] as const).map(
              (id) => (
                <div
                  key={id}
                  className="flex h-14 w-16 items-center justify-center rounded-2xl border-2 border-white bg-white p-1.5 shadow-sm"
                  title={VEHICLES[id].name}
                >
                  <ProcessedSprite
                    src={VEHICLES[id].imageSrc}
                    alt={VEHICLES[id].name}
                    className="h-full w-full object-contain"
                    fallbackLabel={VEHICLES[id].name}
                  />
                </div>
              )
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <button
              type="button"
              onClick={onStartGame}
              className="toy-btn inline-flex items-center gap-3 rounded-3xl border-b-[6px] border-[#DB2777] bg-[#FF6B9D] px-8 py-4 font-display text-2xl font-bold text-white shadow-lg hover:bg-[#FF558E] focus-visible:outline-4 focus-visible:outline-pink-300 whitespace-nowrap shrink-0"
            >
              <Play className="h-7 w-7 fill-current" />
              <span>Mula Pengembaraan</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom quiet helper text */}
      <footer className="relative z-10 flex items-center justify-between rounded-2xl bg-white/85 px-4 py-2 text-xs font-bold text-[#4A4E69] shadow-sm backdrop-blur-sm sm:text-sm">
        <span>4 Misi Seronok · Ganjaran Photobooth Bersama Mimi</span>
        <span className="hidden sm:inline">Bunyi kenderaan sedia dimainkan secara automatik</span>
      </footer>
    </div>
  );
};
