import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Star,
  Music2,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  BG_LEVEL_SRC,
  VEHICLES,
  MIMI_IMAGE_SRC,
  createShuffledTray,
  shuffleArray,
} from '../data/gameConfig';
import { CustomSoundMap, LevelConfig, VehicleId } from '../types/game';
import {
  playPopSound,
  playSuccessChime,
  playTryAgainSound,
  playVehicleSequence,
  stopAllSounds,
} from '../utils/soundEngine';
import { ProcessedSprite } from './ProcessedSprite';

interface SequenceLevelScreenProps {
  level: LevelConfig;
  customSounds: CustomSoundMap;
  onBackToMap: () => void;
  onLevelComplete: (levelId: 1 | 2 | 3 | 4) => void;
  onOpenSoundSettings: () => void;
  isMusicMuted: boolean;
  onToggleMusic: () => void;
}

type CardLocation =
  | { type: 'tray'; index: number; vehicleId: VehicleId }
  | { type: 'carriage'; index: number; vehicleId: VehicleId };

interface DragState {
  source: CardLocation;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
}

export const SequenceLevelScreen: React.FC<SequenceLevelScreenProps> = ({
  level,
  customSounds,
  onBackToMap,
  onLevelComplete,
  onOpenSoundSettings,
  isMusicMuted,
  onToggleMusic,
}) => {
  const slotCount = level.vehicles.length;

  const [targetSequence, setTargetSequence] = useState<VehicleId[]>(() =>
    shuffleArray(level.vehicles)
  );
  const [carriages, setCarriages] = useState<(VehicleId | null)[]>(() =>
    Array(level.vehicles.length).fill(null)
  );
  const [trayCards, setTrayCards] = useState<(VehicleId | null)[]>(() =>
    createShuffledTray(level.vehicles)
  );

  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [activeSoundStep, setActiveSoundStep] = useState<number | null>(null);

  const [selectedCard, setSelectedCard] = useState<CardLocation | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverCarriageIdx, setHoverCarriageIdx] = useState<number | null>(null);
  const [hoverTray, setHoverTray] = useState(false);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

  const carriageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trayRef = useRef<HTMLDivElement | null>(null);
  const customSoundsRef = useRef(customSounds);
  customSoundsRef.current = customSounds;

  const runSequencePlayback = async (seq: VehicleId[]) => {
    setIsPlayingSeq(true);
    const finished = await playVehicleSequence(
      seq,
      customSoundsRef.current,
      (step) => setActiveSoundStep(step)
    );
    setIsPlayingSeq(false);
    if (finished) {
      setActiveSoundStep(null);
    }
  };

  // Reset level state & auto-play the sound sequence on level entry
  useEffect(() => {
    stopAllSounds();
    const seq = shuffleArray(level.vehicles);
    setTargetSequence(seq);
    setCarriages(Array(level.vehicles.length).fill(null));
    setTrayCards(createShuffledTray(seq));
    setIsPlayingSeq(false);
    setActiveSoundStep(null);
    setSelectedCard(null);
    setDragState(null);
    setFeedback('IDLE');

    const autoTimer = window.setTimeout(() => {
      void runSequencePlayback(seq);
    }, 450);

    return () => {
      window.clearTimeout(autoTimer);
      stopAllSounds();
    };
  }, [level.id, level.vehicles]);

  const handlePlaySequence = async () => {
    if (feedback === 'CORRECT') return;
    await runSequencePlayback(targetSequence);
  };

  const placeIntoCarriage = (source: CardLocation, targetCarriageIdx: number) => {
    if (feedback === 'CORRECT') return;
    setFeedback('IDLE');

    if (source.type === 'carriage') {
      if (source.index === targetCarriageIdx) return;
      setCarriages((prev) => {
        const next = [...prev];
        const temp = next[targetCarriageIdx];
        next[targetCarriageIdx] = next[source.index];
        next[source.index] = temp;
        return next;
      });
      playPopSound();
      return;
    }

    const displacedVehicle = carriages[targetCarriageIdx];
    setCarriages((prev) => {
      const next = [...prev];
      next[targetCarriageIdx] = source.vehicleId;
      return next;
    });
    setTrayCards((prev) => {
      const next = [...prev];
      next[source.index] = displacedVehicle ?? null;
      return next;
    });
    playPopSound();
  };

  const returnCarriageToTray = (carriageIdx: number) => {
    if (feedback === 'CORRECT') return;
    const vehicle = carriages[carriageIdx];
    if (!vehicle) return;
    setFeedback('IDLE');

    setCarriages((prev) => {
      const next = [...prev];
      next[carriageIdx] = null;
      return next;
    });
    setTrayCards((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((c) => c === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = vehicle;
      } else {
        next.push(vehicle);
      }
      return next;
    });
    playPopSound();
  };

  const handleCardTap = (loc: CardLocation) => {
    if (feedback === 'CORRECT') return;
    if (!selectedCard) {
      setSelectedCard(loc);
      playPopSound();
      return;
    }

    if (selectedCard.type === loc.type && selectedCard.index === loc.index) {
      setSelectedCard(null);
      return;
    }

    if (loc.type === 'carriage') {
      placeIntoCarriage(selectedCard, loc.index);
      setSelectedCard(null);
      return;
    }

    setSelectedCard(loc);
    playPopSound();
  };

  const handleEmptyCarriageTap = (carriageIdx: number) => {
    if (feedback === 'CORRECT') return;
    if (selectedCard) {
      placeIntoCarriage(selectedCard, carriageIdx);
      setSelectedCard(null);
    }
  };

  const handleTrayBackgroundTap = () => {
    if (feedback === 'CORRECT') return;
    if (selectedCard && selectedCard.type === 'carriage') {
      returnCarriageToTray(selectedCard.index);
      setSelectedCard(null);
    }
  };

  useEffect(() => {
    if (!dragState) return;

    const findDropTarget = (x: number, y: number) => {
      let matchedCarriage: number | null = null;
      carriageRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (
          x >= rect.left - 8 &&
          x <= rect.right + 8 &&
          y >= rect.top - 8 &&
          y <= rect.bottom + 8
        ) {
          matchedCarriage = idx;
        }
      });

      let inTray = false;
      if (matchedCarriage === null && trayRef.current) {
        const rect = trayRef.current.getBoundingClientRect();
        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          inTray = true;
        }
      }

      return { matchedCarriage, inTray };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const movedEnough = dragState.active || Math.hypot(dx, dy) > 7;

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              active: movedEnough,
            }
          : null
      );

      if (movedEnough) {
        const { matchedCarriage, inTray } = findDropTarget(e.clientX, e.clientY);
        setHoverCarriageIdx(matchedCarriage);
        setHoverTray(inTray && dragState.source.type === 'carriage');
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragState.active) {
        const { matchedCarriage, inTray } = findDropTarget(e.clientX, e.clientY);
        if (matchedCarriage !== null) {
          placeIntoCarriage(dragState.source, matchedCarriage);
          setSelectedCard(null);
        } else if (inTray && dragState.source.type === 'carriage') {
          returnCarriageToTray(dragState.source.index);
          setSelectedCard(null);
        }
      } else {
        handleCardTap(dragState.source);
      }

      setDragState(null);
      setHoverCarriageIdx(null);
      setHoverTray(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  });

  const startPointerDrag = (e: React.PointerEvent, source: CardLocation) => {
    if (feedback === 'CORRECT') return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    setDragState({
      source,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      active: false,
    });
  };

  const allCarriagesFilled = carriages.every((c) => c !== null);

  const handleCheckAnswer = () => {
    if (!allCarriagesFilled || feedback === 'CORRECT') return;
    stopAllSounds();
    setIsPlayingSeq(false);
    setActiveSoundStep(null);
    setSelectedCard(null);

    const isCorrect = targetSequence.every(
      (expectedId, idx) => carriages[idx] === expectedId
    );

    if (isCorrect) {
      setFeedback('CORRECT');
      playSuccessChime();
    } else {
      setFeedback('INCORRECT');
      playTryAgainSound();
    }
  };

  const isFinalChallenge = slotCount === 5;

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#F9A8D4] bg-[#E6F4FE] p-3.5 shadow-xl sm:p-5">
      {/* 3D Animated Cartoon Train Station Backdrop */}
      <img
        src={BG_LEVEL_SRC}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/25"
      />

      {/* Top Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-white/92 px-4 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopAllSounds();
              onBackToMap();
            }}
            className="toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 border-sky-300 bg-[#EFF8FF] px-3.5 py-2 text-sm font-bold text-[#1E40AF] hover:bg-sky-100 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Peta Misi</span>
          </button>

          <div>
            <h1 className="font-display text-lg font-bold text-[#2B2D42] sm:text-xl">
              {level.title}
            </h1>
            <p className="hidden text-xs font-semibold text-[#5C6078] sm:block">
              {level.subtitle}
            </p>
          </div>
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
            className="toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 border-amber-300 bg-[#FEF9C3] px-3.5 py-2 text-xs font-bold text-[#854D0E] hover:bg-amber-100 sm:text-sm whitespace-nowrap shrink-0"
          >
            <Music2 className="h-4 w-4" />
            <span>Bunyi MP3</span>
          </button>
        </div>
      </header>

      {/* Audio Listen Zone + Sequence Step Pulses */}
      <section className="relative z-10 my-2 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-sm sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => void handlePlaySequence()}
            className={`toy-btn inline-flex items-center gap-2.5 rounded-2xl border-b-[5px] px-5 py-2.5 font-display text-base font-bold shadow-md sm:text-lg whitespace-nowrap shrink-0 ${
              isPlayingSeq
                ? 'border-emerald-600 bg-[#34D399] text-[#064E3B]'
                : 'border-[#0284C7] bg-[#38BDF8] text-white hover:bg-[#0EA5E9]'
            }`}
          >
            <Volume2 className={`h-5 w-5 ${isPlayingSeq ? 'animate-bounce' : ''}`} />
            <span>
              {isPlayingSeq
                ? 'Sedang Memainkan Bunyi...'
                : 'Dengar Urutan Bunyi'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handlePlaySequence()}
            className="toy-btn inline-flex items-center gap-1.5 rounded-2xl border-b-4 border-amber-400 bg-[#FDE047] px-4 py-2.5 font-display text-sm font-bold text-[#713F12] hover:bg-[#FACC15] sm:text-base whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Dengar Semula</span>
          </button>
        </div>

        <div
          className="flex items-center gap-2"
          aria-label="Penunjuk langkah bunyi"
        >
          <span className="mr-1 hidden text-xs font-bold text-[#5C6078] md:inline">
            Urutan Bunyi:
          </span>
          {targetSequence.map((_, idx) => {
            const isActive = activeSoundStep === idx;
            return (
              <div
                key={idx}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-display text-sm font-bold transition-transform duration-150 ${
                  isActive
                    ? 'scale-115 border-[#DB2777] bg-[#FF6B9D] text-white shadow-md'
                    : 'border-sky-200 bg-[#EFF8FF] text-[#1E40AF]'
                }`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </section>

      {/* Incorrect Gentle Feedback Banner */}
      <AnimatePresence>
        {feedback === 'INCORRECT' ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 mx-auto mb-1 flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-[#FEF3C7] px-5 py-2 text-center shadow-sm"
            role="status"
          >
            <span className="font-display text-base font-bold text-[#92400E] sm:text-lg">
              Cuba lagi! Dengar semula bunyi.
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Train Track & Numbered Carriages */}
      <section
        aria-label="Gerabak kereta api"
        className="relative z-10 flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-white/85 bg-white/75 px-3 py-3 shadow-inner backdrop-blur-sm sm:px-5"
      >
        <p className="mb-2 text-center text-xs font-bold text-[#2B2D42] sm:text-sm">
          {selectedCard
            ? 'Sekarang tekan gerabak bernombor untuk meletakkan kenderaan!'
            : 'Seret gambar kenderaan (atau tekan gambar lalu tekan gerabak) ikut urutan bunyi.'}
        </p>

        <div className="relative flex w-full items-end justify-center gap-2 overflow-x-auto pb-3 pt-1 sm:gap-3">
          {/* Cute Pastel Locomotive Head */}
          <div className="hidden shrink-0 flex-col items-center lg:flex">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-t-3xl rounded-bl-2xl border-4 border-[#34D399] bg-[#A7F3D0] p-2 shadow-md">
              <ProcessedSprite
                src={MIMI_IMAGE_SRC}
                alt="Mimi memandu kereta api"
                className="h-20 w-20 object-contain"
                fallbackLabel="Mimi"
              />
            </div>
            <div className="mt-1 flex gap-4">
              <span className="h-5 w-5 rounded-full border-2 border-white bg-[#4A4E69]" />
              <span className="h-5 w-5 rounded-full border-2 border-white bg-[#4A4E69]" />
            </div>
          </div>

          {/* Numbered Carriages */}
          {carriages.map((placedVehicleId, idx) => {
            const vehicle = placedVehicleId ? VEHICLES[placedVehicleId] : null;
            const isHovered = hoverCarriageIdx === idx;
            const isBeingDragged =
              dragState?.active &&
              dragState.source.type === 'carriage' &&
              dragState.source.index === idx;
            const isSelected =
              selectedCard?.type === 'carriage' && selectedCard.index === idx;

            return (
              <div key={idx} className="flex shrink-0 flex-col items-center">
                <div
                  ref={(el) => {
                    carriageRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (!vehicle) handleEmptyCarriageTap(idx);
                  }}
                  className={`relative flex flex-col items-center justify-between rounded-3xl border-4 p-2 transition-all duration-150 ${
                    isFinalChallenge
                      ? 'h-32 w-26 sm:h-36 sm:w-32'
                      : 'h-36 w-32 sm:h-40 sm:w-40'
                  } ${
                    isHovered
                      ? 'scale-105 border-[#FF6B9D] bg-[#FFF0F5] shadow-lg'
                      : isSelected
                      ? 'border-[#F59E0B] bg-[#FEF9C3] ring-4 ring-amber-200'
                      : vehicle
                      ? `${vehicle.cardBg} ${vehicle.cardBorder} shadow-md`
                      : 'border-dashed border-sky-300 bg-white/95 hover:border-pink-400'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B2D42] font-display text-sm font-bold text-white shadow-sm">
                      {idx + 1}
                    </span>

                    {vehicle && feedback !== 'CORRECT' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCard(null);
                          returnCarriageToTray(idx);
                        }}
                        aria-label={`Keluarkan ${vehicle.name} dari gerabak ${idx + 1}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm hover:bg-rose-100 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {vehicle ? (
                    <div
                      onPointerDown={(e) =>
                        startPointerDrag(e, {
                          type: 'carriage',
                          index: idx,
                          vehicleId: vehicle.id,
                        })
                      }
                      className={`flex w-full flex-1 cursor-grab flex-col items-center justify-center touch-none active:cursor-grabbing ${
                        isBeingDragged ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      <ProcessedSprite
                        src={vehicle.imageSrc}
                        alt={vehicle.name}
                        className={
                          isFinalChallenge
                            ? 'h-14 w-20 object-contain sm:h-16 sm:w-24'
                            : 'h-16 w-24 object-contain sm:h-20 sm:w-28'
                        }
                        fallbackLabel={vehicle.name}
                      />
                      <span className="mt-1 font-display text-xs font-bold text-[#2B2D42] sm:text-sm">
                        {vehicle.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <span className="font-display text-xs font-bold text-sky-600/85 sm:text-sm">
                        Letak di sini
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex gap-6">
                  <span className="h-4 w-4 rounded-full border-2 border-white bg-[#4A4E69] sm:h-5 sm:w-5" />
                  <span className="h-4 w-4 rounded-full border-2 border-white bg-[#4A4E69] sm:h-5 sm:w-5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-2.5 w-full max-w-4xl rounded-full bg-amber-300/80" />
      </section>

      {/* Bottom Zone: Draggable Vehicle Cards Tray + Check Button */}
      <section className="relative z-10 mt-2.5 flex flex-col items-center justify-between gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-sm md:flex-row">
        <div
          ref={trayRef}
          onClick={handleTrayBackgroundTap}
          className={`flex flex-1 flex-wrap items-center justify-center gap-2.5 rounded-2xl p-1.5 transition-colors sm:gap-3 ${
            hoverTray ? 'bg-pink-50 ring-2 ring-pink-300' : ''
          }`}
        >
          {trayCards.map((vehicleId, idx) => {
            if (!vehicleId) {
              return (
                <div
                  key={`empty-${idx}`}
                  className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/75 ${
                    isFinalChallenge
                      ? 'h-22 w-22 sm:h-24 sm:w-24'
                      : 'h-24 w-28 sm:h-26 sm:w-32'
                  }`}
                >
                  <span className="text-xs font-semibold text-slate-400">
                    Di gerabak
                  </span>
                </div>
              );
            }

            const v = VEHICLES[vehicleId];
            const isSelected =
              selectedCard?.type === 'tray' && selectedCard.index === idx;
            const isBeingDragged =
              dragState?.active &&
              dragState.source.type === 'tray' &&
              dragState.source.index === idx;

            return (
              <div
                key={`${vehicleId}-${idx}`}
                onPointerDown={(e) =>
                  startPointerDrag(e, {
                    type: 'tray',
                    index: idx,
                    vehicleId,
                  })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardTap({ type: 'tray', index: idx, vehicleId });
                  }
                }}
                aria-label={`Pilih kad ${v.name}`}
                className={`toy-btn flex cursor-grab flex-col items-center justify-center rounded-2xl border-2 border-b-[5px] p-2 shadow-sm touch-none active:cursor-grabbing ${
                  isFinalChallenge
                    ? 'h-22 w-22 sm:h-24 sm:w-24'
                    : 'h-24 w-28 sm:h-26 sm:w-32'
                } ${v.cardBg} ${v.cardBorder} ${
                  isSelected
                    ? 'scale-105 ring-4 ring-[#FACC15]'
                    : 'hover:brightness-[1.02]'
                } ${isBeingDragged ? 'opacity-25' : 'opacity-100'}`}
              >
                <ProcessedSprite
                  src={v.imageSrc}
                  alt={v.name}
                  className={
                    isFinalChallenge
                      ? 'h-12 w-16 object-contain sm:h-13 sm:w-18'
                      : 'h-13 w-20 object-contain sm:h-15 sm:w-22'
                  }
                  fallbackLabel={v.name}
                />
                <span className="mt-1 font-display text-xs font-bold text-[#2B2D42] sm:text-sm whitespace-nowrap">
                  {v.name}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-center">
          <button
            type="button"
            disabled={!allCarriagesFilled || feedback === 'CORRECT'}
            onClick={handleCheckAnswer}
            className={`toy-btn inline-flex items-center gap-2 rounded-2xl border-b-[5px] px-6 py-3.5 font-display text-lg font-bold shadow-md whitespace-nowrap shrink-0 ${
              allCarriagesFilled && feedback !== 'CORRECT'
                ? 'border-emerald-600 bg-[#34D399] text-[#064E3B] hover:bg-[#2EC48D]'
                : 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400'
            }`}
          >
            <CheckCircle2 className="h-6 w-6" />
            <span>Semak Jawapan</span>
          </button>
        </div>
      </section>

      {/* Floating Drag Ghost Card */}
      {dragState?.active ? (
        <div
          style={{
            left: dragState.currentX,
            top: dragState.currentY,
          }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 scale-110"
        >
          <div
            className={`flex h-26 w-28 flex-col items-center justify-center rounded-2xl border-4 p-2 shadow-2xl ${
              VEHICLES[dragState.source.vehicleId].cardBg
            } ${VEHICLES[dragState.source.vehicleId].cardBorder}`}
          >
            <ProcessedSprite
              src={VEHICLES[dragState.source.vehicleId].imageSrc}
              alt={VEHICLES[dragState.source.vehicleId].name}
              className="h-15 w-22 object-contain"
              fallbackLabel={VEHICLES[dragState.source.vehicleId].name}
            />
            <span className="mt-1 font-display text-sm font-bold text-[#2B2D42]">
              {VEHICLES[dragState.source.vehicleId].name}
            </span>
          </div>
        </div>
      ) : null}

      {/* Victory Overlay Modal */}
      <AnimatePresence>
        {feedback === 'CORRECT' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-[#2B2D42]/45 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="flex w-full max-w-md flex-col items-center rounded-3xl border-4 border-[#FDE047] bg-[#FFFDF9] p-6 text-center shadow-2xl sm:p-8"
            >
              <div className="mb-3 flex items-center gap-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1 + i * 0.12,
                      type: 'spring',
                      stiffness: 260,
                    }}
                  >
                    <Star
                      className={`fill-amber-400 text-amber-500 drop-shadow-sm ${
                        i === 1 ? 'h-12 w-12 -translate-y-2' : 'h-9 w-9'
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="h-36 w-36">
                <ProcessedSprite
                  src={MIMI_IMAGE_SRC}
                  alt="Mimi gembira meraikan kejayaan"
                  className="h-full w-full object-contain"
                  fallbackLabel="Mimi"
                />
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                <span>Misi {level.id} Selesai!</span>
              </div>

              <h2 className="mt-1 font-display text-2xl font-bold text-[#2B2D42] sm:text-3xl">
                Hebat! Susunan kamu betul!
              </h2>

              <button
                type="button"
                onClick={() => onLevelComplete(level.id)}
                className="toy-btn mt-6 inline-flex items-center gap-2 rounded-2xl border-b-[5px] border-[#DB2777] bg-[#FF6B9D] px-7 py-3.5 font-display text-xl font-bold text-white shadow-lg hover:bg-[#FF558E] whitespace-nowrap shrink-0"
              >
                <span>Level Seterusnya</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
