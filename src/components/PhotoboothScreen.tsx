import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  RotateCcw,
  Download,
  RefreshCw,
  Sparkles,
  Star,
  Building2,
  Rainbow,
} from 'lucide-react';
import { BG_WELCOME_SRC, MIMI_IMAGE_SRC } from '../data/gameConfig';
import { FrameOption } from '../types/game';
import { removeWhiteBackground } from '../utils/imageCutout';
import { playShutterSound } from '../utils/soundEngine';
import { ProcessedSprite } from './ProcessedSprite';

interface PhotoboothScreenProps {
  onRestartGame: () => void;
}

const FRAME_OPTIONS: {
  id: FrameOption;
  label: string;
  bgClass: string;
  borderClass: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'rainbow',
    label: 'Rainbow',
    bgClass: 'bg-gradient-to-br from-[#FFF0F5]/90 via-[#FEF9C3]/90 to-[#E0F2FE]/90',
    borderClass: 'border-[#F9A8D4]',
    icon: <Rainbow className="h-4 w-4 text-pink-500" />,
  },
  {
    id: 'stars',
    label: 'Stars',
    bgClass: 'bg-gradient-to-br from-[#EEF2FF]/90 via-[#FEF9C3]/90 to-[#FDF2F8]/90',
    borderClass: 'border-[#FDE047]',
    icon: <Star className="h-4 w-4 fill-amber-400 text-amber-500" />,
  },
  {
    id: 'bandar_ceria',
    label: 'Bandar Ceria',
    bgClass: 'bg-gradient-to-br from-[#E0F2FE]/90 via-[#ECFDF5]/90 to-[#FEF3C7]/90',
    borderClass: 'border-[#6EE7B7]',
    icon: <Building2 className="h-4 w-4 text-emerald-600" />,
  },
];

export const PhotoboothScreen: React.FC<PhotoboothScreenProps> = ({
  onRestartGame,
}) => {
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>('rainbow');
  const [cameraState, setCameraState] = useState<
    'IDLE' | 'REQUESTING' | 'LIVE' | 'CAPTURED' | 'UNAVAILABLE'
  >('IDLE');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (cameraState === 'LIVE' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {
        // ignore
      });
    }
  }, [cameraState]);

  const requestCameraAndStart = async () => {
    setStatusMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('UNAVAILABLE');
      setStatusMessage(
        'Kamera tidak disokong pada peranti ini. Kamu masih boleh simpan gambar ganjaran bersama Mimi!'
      );
      return;
    }

    setCameraState('REQUESTING');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState('LIVE');
      setStatusMessage('Kamera sedia! Senyum dan tekan "Ambil Selfie" untuk menangkap gambar.');
    } catch {
      stopCameraStream();
      setCameraState('UNAVAILABLE');
      setStatusMessage(
        'Akses kamera tidak dibenarkan atau tiada kamera dikesan. Kamu boleh terus simpan kad ganjaran bersama Mimi!'
      );
    }
  };

  const captureFromVideo = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    playShutterSound();
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedPhotoUrl(dataUrl);
    setCameraState('CAPTURED');
    setStatusMessage('Cantiknya gambar kamu! Tekan "Simpan Gambar" untuk muat turun.');
  };

  const handleAmbilSelfieClick = () => {
    if (cameraState === 'LIVE') {
      captureFromVideo();
      return;
    }
    if (cameraState === 'CAPTURED') {
      setCapturedPhotoUrl(null);
      if (streamRef.current) {
        setCameraState('LIVE');
      } else {
        void requestCameraAndStart();
      }
      return;
    }
    if (cameraState === 'IDLE' || cameraState === 'UNAVAILABLE') {
      void requestCameraAndStart();
    }
  };

  const handleAmbilSemula = () => {
    setCapturedPhotoUrl(null);
    if (streamRef.current) {
      setCameraState('LIVE');
      setStatusMessage('Sedia untuk gambar baharu! Tekan "Ambil Selfie".');
    } else if (cameraState === 'UNAVAILABLE') {
      void requestCameraAndStart();
    } else {
      setCameraState('IDLE');
      setStatusMessage(null);
    }
  };

  const handleSaveImage = async () => {
    setIsSaving(true);
    try {
      const width = 1280;
      const height = 840;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (selectedFrame === 'rainbow') {
        grad.addColorStop(0, '#FFE4EE');
        grad.addColorStop(0.5, '#FEF9C3');
        grad.addColorStop(1, '#E0F2FE');
      } else if (selectedFrame === 'stars') {
        grad.addColorStop(0, '#E0E7FF');
        grad.addColorStop(0.5, '#FEF9C3');
        grad.addColorStop(1, '#FCE7F3');
      } else {
        grad.addColorStop(0, '#DBEAFE');
        grad.addColorStop(0.6, '#DCFCE7');
        grad.addColorStop(1, '#FEF3C7');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (selectedFrame === 'rainbow') {
        const colors = ['#F472B6', '#FB923C', '#FACC15', '#34D399', '#60A5FA'];
        colors.forEach((col, i) => {
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.88, 560 - i * 26, Math.PI, 0);
          ctx.strokeStyle = col;
          ctx.lineWidth = 22;
          ctx.globalAlpha = 0.25;
          ctx.stroke();
        });
        ctx.globalAlpha = 1;
      } else if (selectedFrame === 'stars') {
        const starSpots = [
          [110, 90], [260, 65], [1160, 95], [1040, 140],
          [85, 720], [1180, 720], [640, 70], [920, 740],
        ];
        ctx.fillStyle = '#FACC15';
        starSpots.forEach(([sx, sy]) => {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? 22 : 10;
            const a = (Math.PI * i) / 5 - Math.PI / 2;
            const px = sx + Math.cos(a) * r;
            const py = sy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        });
      } else {
        const buildings = [
          { x: 30, w: 120, h: 170, c: '#93C5FD' },
          { x: 165, w: 95, h: 130, c: '#F9A8D4' },
          { x: 960, w: 110, h: 160, c: '#6EE7B7' },
          { x: 1085, w: 140, h: 200, c: '#FDE047' },
        ];
        buildings.forEach((b) => {
          ctx.fillStyle = b.c;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(b.x, height - b.h - 40, b.w, b.h);
        });
        ctx.globalAlpha = 1;
      }

      const photoX = 72;
      const photoY = 92;
      const photoW = 730;
      const photoH = 560;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.clip();

      if (capturedPhotoUrl) {
        const photoImg = await loadImg(capturedPhotoUrl);
        const scale = Math.max(photoW / photoImg.width, photoH / photoImg.height);
        const dw = photoImg.width * scale;
        const dh = photoImg.height * scale;
        ctx.drawImage(
          photoImg,
          photoX + (photoW - dw) / 2,
          photoY + (photoH - dh) / 2,
          dw,
          dh
        );
      } else {
        const cardGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
        cardGrad.addColorStop(0, '#FFF0F5');
        cardGrad.addColorStop(1, '#E0F2FE');
        ctx.fillStyle = cardGrad;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        ctx.fillStyle = '#2B2D42';
        ctx.font = 'bold 42px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Kad Ganjaran Istimewa!', photoX + photoW / 2, photoY + 230);
        ctx.fillStyle = '#DB2777';
        ctx.font = 'bold 30px Plus Jakarta Sans, sans-serif';
        ctx.fillText('Tahniah! Semua 4 Misi Berjaya!', photoX + photoW / 2, photoY + 295);
        ctx.fillStyle = '#D97706';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('★ ★ ★ ★ ★', photoX + photoW / 2, photoY + 365);
      }
      ctx.restore();

      const mimiCutoutSrc = await removeWhiteBackground(MIMI_IMAGE_SRC);
      const mimiImg = await loadImg(mimiCutoutSrc);
      const mimiSize = 460;
      ctx.drawImage(
        mimiImg,
        width - mimiSize - 55,
        height - mimiSize - 110,
        mimiSize,
        mimiSize
      );

      ctx.lineWidth = 20;
      ctx.strokeStyle =
        selectedFrame === 'rainbow'
          ? '#F472B6'
          : selectedFrame === 'stars'
          ? '#FACC15'
          : '#34D399';
      ctx.strokeRect(10, 10, width - 20, height - 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(140, height - 125, width - 280, 78, 28);
      ctx.fill();

      ctx.fillStyle = '#2B2D42';
      ctx.font = 'bold 34px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Photobooth Bersama Mimi · Misi Selamatkan Mimi!',
        width / 2,
        height - 74
      );

      const link = document.createElement('a');
      link.download = `photobooth-mimi-${selectedFrame}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setStatusMessage('Gambar berjaya disimpan ke peranti kamu!');
    } finally {
      setIsSaving(false);
    }
  };

  const activeFrameObj =
    FRAME_OPTIONS.find((f) => f.id === selectedFrame) || FRAME_OPTIONS[0];

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border-4 border-[#F9A8D4] bg-[#FFF0F5] p-4 shadow-xl sm:p-5">
      <img
        src={BG_WELCOME_SRC}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/45 backdrop-blur-[2px]"
      />

      {/* Header */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-5 py-3 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B2D42] sm:text-3xl">
            Photobooth Bersama Mimi!
          </h1>
          <p className="text-sm font-bold text-[#DB2777] sm:text-base">
            Tahniah! Kamu berjaya menyelamatkan Mimi! Jom bergambar bersama Mimi!
          </p>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Pilihan bingkai gambar">
          <span className="hidden text-xs font-bold text-[#5C6078] sm:inline">
            Pilih Bingkai:
          </span>
          {FRAME_OPTIONS.map((opt) => {
            const active = selectedFrame === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedFrame(opt.id)}
                className={`toy-btn inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-bold sm:text-sm whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[#DB2777] bg-[#FFF0F5] text-[#BE185D] shadow-sm'
                    : 'border-slate-200 bg-white text-[#4A4E69] hover:bg-slate-50'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Photobooth Stage */}
      <main
        className={`relative z-10 my-3 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border-4 p-4 shadow-inner backdrop-blur-sm transition-colors sm:p-5 ${activeFrameObj.bgClass} ${activeFrameObj.borderClass}`}
      >
        <FrameDecoration frame={selectedFrame} />

        <div className="relative z-10 grid h-full w-full max-w-5xl grid-cols-1 items-center gap-4 md:grid-cols-12">
          <div className="flex h-full min-h-[240px] items-center justify-center md:col-span-8">
            <div className="relative flex aspect-[4/3] w-full max-h-[380px] items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white/90 shadow-lg">
              {cameraState === 'LIVE' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full scale-x-[-1] object-cover"
                />
              ) : cameraState === 'CAPTURED' && capturedPhotoUrl ? (
                <img
                  src={capturedPhotoUrl}
                  alt="Gambar selfie bersama Mimi"
                  className="h-full w-full object-cover"
                />
              ) : cameraState === 'UNAVAILABLE' ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#E0F2FE] p-6 text-center">
                  <Sparkles className="h-12 w-12 text-amber-400" />
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#2B2D42]">
                    Kad Ganjaran Istimewa!
                  </h2>
                  <p className="mt-1 max-w-sm text-sm font-semibold text-[#4A4E69]">
                    Kamera tidak tersedia pada peranti ini. Kamu masih boleh tekan &ldquo;Simpan Gambar&rdquo; untuk muat turun poster kenangan bersama Mimi!
                  </p>
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EFF8FF] to-[#FFF0F5] p-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                    <Camera className="h-10 w-10 text-[#FF6B9D]" />
                  </div>
                  <p className="mt-3 font-display text-xl font-bold text-[#2B2D42]">
                    {cameraState === 'REQUESTING'
                      ? 'Sedang membuka kamera...'
                      : 'Kawasan Kamera Selfie'}
                  </p>
                  <p className="mt-1 max-w-sm text-xs font-semibold text-[#5C6078] sm:text-sm">
                    Tekan butang &ldquo;Ambil Selfie&rdquo; di bawah untuk memulakan kamera. Gambar disimpan di peranti kamu sahaja.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center md:col-span-4">
            <div className="h-44 w-44 sm:h-60 sm:w-60">
              <ProcessedSprite
                src={MIMI_IMAGE_SRC}
                alt="Mimi berdiri gembira di sebelah kawasan gambar"
                className="h-full w-full object-contain drop-shadow-xl"
                fallbackLabel="Mimi"
              />
            </div>
            <div className="mt-1 rounded-2xl bg-white/95 px-4 py-1.5 text-center shadow-sm">
              <span className="font-display text-sm font-bold text-[#BE185D]">
                Bingkai: {activeFrameObj.label}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
        {statusMessage ? (
          <p className="text-center text-xs font-bold text-[#1E40AF] sm:text-sm">
            {statusMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleAmbilSelfieClick}
            disabled={cameraState === 'REQUESTING'}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-[5px] border-[#DB2777] bg-[#FF6B9D] px-6 py-3 font-display text-base font-bold text-white shadow-md hover:bg-[#FF558E] sm:text-lg whitespace-nowrap shrink-0"
          >
            <Camera className="h-5 w-5" />
            <span>
              {cameraState === 'LIVE' ? 'Ambil Selfie (Tangkap!)' : 'Ambil Selfie'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleAmbilSemula}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-amber-400 bg-[#FEF08A] px-5 py-3 font-display text-base font-bold text-[#713F12] hover:bg-[#FDE047] whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Ambil Semula</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSaveImage()}
            disabled={isSaving}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-emerald-600 bg-[#34D399] px-5 py-3 font-display text-base font-bold text-[#064E3B] hover:bg-[#2EC48D] whitespace-nowrap shrink-0"
          >
            <Download className="h-5 w-5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Gambar'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onRestartGame();
            }}
            className="toy-btn inline-flex items-center gap-2 rounded-2xl border-b-4 border-sky-300 bg-[#EFF8FF] px-5 py-3 font-display text-base font-bold text-[#1E40AF] hover:bg-sky-100 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Main Semula</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

const FrameDecoration: React.FC<{ frame: FrameOption }> = ({ frame }) => {
  if (frame === 'rainbow') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
      >
        <path d="M50,480 A450,420 0 0,1 950,480" fill="none" stroke="#F472B6" strokeWidth="18" />
        <path d="M80,480 A420,390 0 0,1 920,480" fill="none" stroke="#FB923C" strokeWidth="18" />
        <path d="M110,480 A390,360 0 0,1 890,480" fill="none" stroke="#FACC15" strokeWidth="18" />
        <path d="M140,480 A360,330 0 0,1 860,480" fill="none" stroke="#34D399" strokeWidth="18" />
        <path d="M170,480 A330,300 0 0,1 830,480" fill="none" stroke="#60A5FA" strokeWidth="18" />
      </svg>
    );
  }

  if (frame === 'stars') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
      >
        {[
          [70, 70], [220, 45], [500, 42], [790, 55], [935, 85],
          [60, 430], [930, 420], [520, 460],
        ].map(([cx, cy], idx) => (
          <circle key={idx} cx={cx} cy={cy} r="10" fill="#FACC15" />
        ))}
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 500"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
    >
      <rect x="20" y="340" width="90" height="160" rx="12" fill="#93C5FD" />
      <rect x="125" y="380" width="75" height="120" rx="12" fill="#F9A8D4" />
      <rect x="810" y="365" width="80" height="135" rx="12" fill="#6EE7B7" />
      <rect x="905" y="325" width="80" height="175" rx="12" fill="#FDE047" />
    </svg>
  );
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
