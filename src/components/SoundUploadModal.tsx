import React, { useState } from 'react';
import { Upload, Volume2, RotateCcw, X, CheckCircle2 } from 'lucide-react';
import { VEHICLE_ORDER, VEHICLES } from '../data/gameConfig';
import { CustomSoundMap, VehicleId } from '../types/game';
import {
  playSingleVehicleSound,
  stopAllSounds,
  unlockAndStartAudio,
} from '../utils/soundEngine';
import { ProcessedSprite } from './ProcessedSprite';

interface SoundUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSounds: CustomSoundMap;
  onUploadSound: (vehicleId: VehicleId, fileName: string, dataUrl: string) => Promise<void>;
  onResetSound: (vehicleId: VehicleId) => Promise<void>;
}

export const SoundUploadModal: React.FC<SoundUploadModalProps> = ({
  isOpen,
  onClose,
  customSounds,
  onUploadSound,
  onResetSound,
}) => {
  const [testingId, setTestingId] = useState<VehicleId | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTest = async (vehicleId: VehicleId) => {
    setErrorMsg(null);
    unlockAndStartAudio(false);
    stopAllSounds();
    setTestingId(vehicleId);
    try {
      await playSingleVehicleSound(vehicleId, customSounds);
    } catch {
      // ignore abort
    } finally {
      setTestingId((prev) => (prev === vehicleId ? null : prev));
    }
  };

  const handleFileChange = (
    vehicleId: VehicleId,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setErrorMsg(null);
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setErrorMsg('Saiz fail terlalu besar. Sila pilih fail MP3 bawah 6 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await onUploadSound(vehicleId, file.name, reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Gagal membaca fail audio. Sila cuba fail MP3 lain.');
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopAllSounds();
    setTestingId(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2D42]/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-modal-title"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-4 border-[#FDE047] bg-[#FFFDF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-[#FEF9C3]/70 px-6 py-4">
          <div>
            <h2
              id="sound-modal-title"
              className="font-display text-2xl font-bold text-[#2B2D42]"
            >
              Bunyi Kenderaan (Automatik & MP3)
            </h2>
            <p className="mt-0.5 text-sm font-medium text-[#5C6078]">
              Kesemua 5 bunyi kenderaan sudah tersedia secara automatik! Anda juga boleh muat naik fail MP3 sendiri jika mahu.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup tetapan bunyi"
            className="toy-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-b-4 border-pink-300 bg-white text-[#2B2D42] hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {errorMsg ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMsg}
            </div>
          ) : null}

          <div className="grid gap-3.5 sm:grid-cols-1">
            {VEHICLE_ORDER.map((vehicleId) => {
              const v = VEHICLES[vehicleId];
              const custom = customSounds[vehicleId];
              const isTesting = testingId === vehicleId;

              return (
                <div
                  key={vehicleId}
                  className={`flex flex-col justify-between gap-3 rounded-2xl border-2 p-3.5 sm:flex-row sm:items-center ${v.cardBg} ${v.cardBorder}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                      <ProcessedSprite
                        src={v.imageSrc}
                        alt={v.name}
                        className="h-full w-full object-contain"
                        fallbackLabel={v.name}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-bold text-[#2B2D42]">
                          {v.name} (.mp3)
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          {custom ? 'MP3 Tersuai' : 'Sedia Ada'}
                        </span>
                      </div>
                      <p className="truncate text-xs font-semibold text-[#5C6078]">
                        {custom
                          ? `Fail aktif: ${custom.fileName}`
                          : 'Bunyi aktif: Bunyi kesan kenderaan automatik terbina dalam'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleTest(vehicleId)}
                      className={`toy-btn inline-flex items-center gap-1.5 rounded-xl border-b-4 px-3.5 py-2 text-sm font-bold whitespace-nowrap shrink-0 ${
                        isTesting
                          ? 'border-emerald-600 bg-emerald-500 text-white'
                          : 'border-sky-300 bg-white text-[#1E40AF] hover:bg-sky-50'
                      }`}
                    >
                      <Volume2 className="h-4 w-4" />
                      {isTesting ? 'Sedang Bunyi...' : 'Uji Bunyi'}
                    </button>

                    <label className="toy-btn inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-b-4 border-pink-400 bg-[#FF7AA2] px-3.5 py-2 text-sm font-bold text-white hover:bg-[#FF6594] whitespace-nowrap shrink-0">
                      <Upload className="h-4 w-4" />
                      <span>Muat Naik MP3</span>
                      <input
                        type="file"
                        accept=".mp3,audio/mpeg,audio/*"
                        className="sr-only"
                        onChange={(e) => handleFileChange(vehicleId, e)}
                      />
                    </label>

                    {custom ? (
                      <button
                        type="button"
                        onClick={() => void onResetSound(vehicleId)}
                        title="Guna bunyi asal"
                        className="toy-btn inline-flex items-center gap-1 rounded-xl border-b-4 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Asal
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-amber-100 bg-white px-6 py-3.5">
          <button
            type="button"
            onClick={handleClose}
            className="toy-btn rounded-2xl border-b-4 border-emerald-600 bg-[#34D399] px-6 py-2.5 font-display text-base font-bold text-[#064E3B] hover:bg-[#2EC48D] whitespace-nowrap shrink-0"
          >
            Selesai & Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
