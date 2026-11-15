import React from 'react';
import { motion } from 'motion/react';
import { Camera, Star, Map } from 'lucide-react';
import { BG_WELCOME_SRC, MIMI_IMAGE_SRC } from '../data/gameConfig';
import { ProcessedSprite } from './ProcessedSprite';

interface CongratulationsScreenProps {
  onGoToPhotobooth: () => void;
  onBackToMap: () => void;
}

export const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  onGoToPhotobooth,
  onBackToMap,
}) => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border-4 border-[#FDE047] bg-[#FFF0F5] p-6 text-center shadow-xl sm:p-10">
      <img
        src={BG_WELCOME_SRC}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/60 backdrop-blur-[2px]"
      />

      {/* Celebration Card */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center rounded-3xl border-4 border-white bg-white/90 px-6 py-6 shadow-2xl backdrop-blur-md sm:px-10 sm:py-8">
        <div className="mb-2 flex items-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 220 }}
            >
              <Star className="h-9 w-9 fill-amber-400 text-amber-500 drop-shadow sm:h-11 sm:w-11" />
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="h-44 w-44 sm:h-52 sm:w-52"
        >
          <ProcessedSprite
            src={MIMI_IMAGE_SRC}
            alt="Mimi gembira selepas berjaya diselamatkan"
            className="h-full w-full object-contain drop-shadow-lg"
            fallbackLabel="Mimi"
          />
        </motion.div>

        <h1
          className="mt-1 font-display text-3xl font-bold text-[#2B2D42] sm:text-5xl"
          style={{ textWrap: 'balance' }}
        >
          Tahniah! Semua Misi Berjaya!
        </h1>

        <p className="mt-2.5 max-w-xl text-base font-semibold text-[#4A4E69] sm:text-lg">
          Kamu telah mendengar dengan hebat dan berjaya menyelamatkan Mimi! Kini ganjaran istimewa menanti kamu!
        </p>

        <div className="mt-2 text-base font-bold text-amber-600">
          12 / 12 Bintang Dikumpul
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onGoToPhotobooth}
            className="toy-btn inline-flex items-center gap-3 rounded-3xl border-b-[6px] border-[#DB2777] bg-[#FF6B9D] px-8 py-4 font-display text-xl font-bold text-white shadow-lg hover:bg-[#FF558E] sm:text-2xl whitespace-nowrap shrink-0"
          >
            <Camera className="h-7 w-7" />
            <span>Jom ke Photobooth!</span>
          </button>

          <button
            type="button"
            onClick={onBackToMap}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-sky-300 bg-white px-5 py-3.5 font-display text-base font-bold text-[#1E40AF] shadow-sm hover:bg-sky-50 whitespace-nowrap shrink-0"
          >
            <Map className="h-5 w-5" />
            <span>Lihat Peta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
