/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { LEVELS } from './data/gameConfig';
import { CustomSoundMap, GameScreen, VehicleId } from './types/game';
import {
  getBackgroundMusicMuted,
  loadCustomSoundsFromStorage,
  saveCustomSoundToStorage,
  setBackgroundMusicMuted,
  stopAllSounds,
  unlockAndStartAudio,
} from './utils/soundEngine';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MissionMap } from './components/MissionMap';
import { SequenceLevelScreen } from './components/SequenceLevelScreen';
import { CongratulationsScreen } from './components/CongratulationsScreen';
import { PhotoboothScreen } from './components/PhotoboothScreen';
import { SoundUploadModal } from './components/SoundUploadModal';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('WELCOME');
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [activeLevelId, setActiveLevelId] = useState<1 | 2 | 3 | 4>(1);
  const [sessionSeed, setSessionSeed] = useState<number>(1);

  const [customSounds, setCustomSounds] = useState<CustomSoundMap>({});
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() =>
    getBackgroundMusicMuted()
  );

  useEffect(() => {
    void loadCustomSoundsFromStorage().then((loaded) => {
      setCustomSounds(loaded);
    });
  }, []);

  // Unlock Web Audio & start gentle background music on first pointer/key interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAndStartAudio(true);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const handleToggleMusic = () => {
    const nextMuted = !isMusicMuted;
    setIsMusicMuted(nextMuted);
    setBackgroundMusicMuted(nextMuted);
  };

  const handleUploadSound = async (
    vehicleId: VehicleId,
    fileName: string,
    dataUrl: string
  ) => {
    const updated = await saveCustomSoundToStorage(
      vehicleId,
      { fileName, dataUrl },
      customSounds
    );
    setCustomSounds(updated);
  };

  const handleResetSound = async (vehicleId: VehicleId) => {
    const updated = await saveCustomSoundToStorage(vehicleId, null, customSounds);
    setCustomSounds(updated);
  };

  const handleStartGame = () => {
    unlockAndStartAudio(true);
    stopAllSounds();
    setScreen('MAP');
  };

  const handleSelectLevel = (levelId: 1 | 2 | 3 | 4) => {
    unlockAndStartAudio(true);
    stopAllSounds();
    setActiveLevelId(levelId);
    setScreen('LEVEL');
  };

  const handleLevelComplete = (levelId: 1 | 2 | 3 | 4) => {
    stopAllSounds();
    setCompletedLevels((prev) =>
      prev.includes(levelId) ? prev : [...prev, levelId]
    );
    setUnlockedLevel((prev) => Math.max(prev, Math.min(4, levelId + 1)));

    if (levelId === 4) {
      setScreen('CONGRATULATIONS');
    } else {
      setScreen('MAP');
    }
  };

  const handleRestartGame = () => {
    stopAllSounds();
    setCompletedLevels([]);
    setUnlockedLevel(1);
    setActiveLevelId(1);
    setSessionSeed((s) => s + 1);
    setScreen('WELCOME');
  };

  const activeLevel =
    LEVELS.find((l) => l.id === activeLevelId) || LEVELS[0];
  const customSoundsCount = Object.keys(customSounds).length;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#FFFDF9] to-[#E6F4FE] p-2 sm:p-4 lg:p-6">
      <div className="relative flex w-full max-w-[1280px] flex-col md:aspect-[16/9] md:max-h-[92vh] min-h-[540px]">
        {screen === 'WELCOME' ? (
          <WelcomeScreen
            onStartGame={handleStartGame}
            onOpenSoundSettings={() => setIsSoundModalOpen(true)}
            hasCustomSoundsCount={customSoundsCount}
            isMusicMuted={isMusicMuted}
            onToggleMusic={handleToggleMusic}
          />
        ) : null}

        {screen === 'MAP' ? (
          <MissionMap
            completedLevels={completedLevels}
            unlockedLevel={unlockedLevel}
            onSelectLevel={handleSelectLevel}
            onBackHome={() => {
              stopAllSounds();
              setScreen('WELCOME');
            }}
            onOpenSoundSettings={() => setIsSoundModalOpen(true)}
            onGoToPhotobooth={() => setScreen('PHOTOBOOTH')}
            isMusicMuted={isMusicMuted}
            onToggleMusic={handleToggleMusic}
          />
        ) : null}

        {screen === 'LEVEL' ? (
          <SequenceLevelScreen
            key={`${activeLevel.id}-${sessionSeed}`}
            level={activeLevel}
            customSounds={customSounds}
            onBackToMap={() => setScreen('MAP')}
            onLevelComplete={handleLevelComplete}
            onOpenSoundSettings={() => setIsSoundModalOpen(true)}
            isMusicMuted={isMusicMuted}
            onToggleMusic={handleToggleMusic}
          />
        ) : null}

        {screen === 'CONGRATULATIONS' ? (
          <CongratulationsScreen
            onGoToPhotobooth={() => setScreen('PHOTOBOOTH')}
            onBackToMap={() => setScreen('MAP')}
          />
        ) : null}

        {screen === 'PHOTOBOOTH' ? (
          <PhotoboothScreen onRestartGame={handleRestartGame} />
        ) : null}
      </div>

      <SoundUploadModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        customSounds={customSounds}
        onUploadSound={handleUploadSound}
        onResetSound={handleResetSound}
      />
    </div>
  );
}
