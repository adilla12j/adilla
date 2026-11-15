import { CustomSoundEntry, CustomSoundMap, VehicleId } from '../types/game';

const DB_NAME = 'misi_selamatkan_mimi_audio_v1';
const STORE_NAME = 'custom_sounds';

let audioCtx: AudioContext | null = null;
let activeAudioEl: HTMLAudioElement | null = null;
let activeTimerIds: number[] = [];
let activeOscillators: AudioNode[] = [];
let playbackAbortController: AbortController | null = null;

// Cheerful gentle preschool background music loop state
let bgmTimerId: number | null = null;
let bgmGain: GainNode | null = null;
let bgmStep = 0;
let isBgmMuted = false;
let isBgmDucked = false;

const BGM_MELODY = [
  523.25, // C5
  659.25, // E5
  783.99, // G5
  659.25, // E5
  880.0,  // A5
  783.99, // G5
  659.25, // E5
  587.33, // D5
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  659.25, // E5
  587.33, // D5
  523.25, // C5
  0,      // rest
];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAndStartAudio(startBgm = true): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    if (startBgm && !isBgmMuted) {
      startBackgroundMusic();
    }
  } catch {
    // ignore
  }
}

export function startBackgroundMusic(): void {
  if (isBgmMuted || bgmTimerId !== null) return;
  try {
    const ctx = getAudioContext();
    if (!bgmGain) {
      bgmGain = ctx.createGain();
      bgmGain.gain.setValueAtTime(isBgmDucked ? 0.0 : 0.055, ctx.currentTime);
      bgmGain.connect(ctx.destination);
    }

    const playNextNote = () => {
      if (isBgmMuted) return;
      if (!isBgmDucked && ctx.state === 'running' && bgmGain) {
        const freq = BGM_MELODY[bgmStep % BGM_MELODY.length];
        if (freq > 0) {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.exponentialRampToValueAtTime(0.42, now + 0.03);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

          osc.connect(noteGain);
          noteGain.connect(bgmGain);
          osc.start(now);
          osc.stop(now + 0.38);
        }
      }
      bgmStep = (bgmStep + 1) % BGM_MELODY.length;
    };

    playNextNote();
    bgmTimerId = window.setInterval(playNextNote, 420);
  } catch {
    // ignore
  }
}

export function stopBackgroundMusic(): void {
  if (bgmTimerId !== null) {
    window.clearInterval(bgmTimerId);
    bgmTimerId = null;
  }
}

export function setBackgroundMusicMuted(muted: boolean): void {
  isBgmMuted = muted;
  if (muted) {
    stopBackgroundMusic();
  } else {
    unlockAndStartAudio(true);
  }
}

export function getBackgroundMusicMuted(): boolean {
  return isBgmMuted;
}

function setBgmDucked(ducked: boolean): void {
  isBgmDucked = ducked;
  if (bgmGain && audioCtx) {
    const now = audioCtx.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setTargetAtTime(ducked || isBgmMuted ? 0 : 0.055, now, 0.04);
  }
}

export function stopAllSounds(): void {
  if (playbackAbortController) {
    playbackAbortController.abort();
    playbackAbortController = null;
  }

  for (const id of activeTimerIds) {
    window.clearTimeout(id);
  }
  activeTimerIds = [];

  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioEl = null;
  }

  for (const node of activeOscillators) {
    try {
      if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
        (node as OscillatorNode).stop();
      }
      node.disconnect();
    } catch {
      // ignore
    }
  }
  activeOscillators = [];
  setBgmDucked(false);
}

function trackNode(node: AudioNode): void {
  activeOscillators.push(node);
}

function waitMs(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    activeTimerIds.push(timer);

    const onAbort = () => {
      window.clearTimeout(timer);
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSec);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Synthesizes crisp, unmistakable built-in sound effects for all 5 vehicles
 * automatically out-of-the-box when no custom MP3 file is uploaded.
 */
async function playSynthesizedVehicleSound(
  vehicleId: VehicleId,
  signal?: AbortSignal
): Promise<void> {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  switch (vehicleId) {
    case 'kereta': {
      // Friendly double car horn: "Pin! Pin!" + subtle engine purr
      const toots = [
        { start: 0.02, dur: 0.24 },
        { start: 0.36, dur: 0.38 },
      ];
      for (const toot of toots) {
        const master = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(980, now + toot.start);
        filter.Q.setValueAtTime(1.3, now + toot.start);

        master.gain.setValueAtTime(0.0001, now + toot.start);
        master.gain.exponentialRampToValueAtTime(0.36, now + toot.start + 0.025);
        master.gain.setValueAtTime(0.32, now + toot.start + toot.dur - 0.04);
        master.gain.exponentialRampToValueAtTime(0.0001, now + toot.start + toot.dur);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(415, now + toot.start);
        osc2.frequency.setValueAtTime(523.25, now + toot.start);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(master);
        master.connect(ctx.destination);

        osc1.start(now + toot.start);
        osc2.start(now + toot.start);
        osc1.stop(now + toot.start + toot.dur + 0.02);
        osc2.stop(now + toot.start + toot.dur + 0.02);
        trackNode(osc1);
        trackNode(osc2);
      }
      await waitMs(860, signal);
      break;
    }

    case 'motor': {
      // Scooter / motorcycle engine revving: "Vroom-vrooooom!"
      const master = ctx.createGain();
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(360, now);
      lowpass.frequency.linearRampToValueAtTime(980, now + 0.35);
      lowpass.frequency.linearRampToValueAtTime(540, now + 0.62);
      lowpass.frequency.linearRampToValueAtTime(1220, now + 0.95);
      lowpass.frequency.linearRampToValueAtTime(340, now + 1.25);
      lowpass.Q.setValueAtTime(3.4, now);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.36, now + 0.08);
      master.gain.setValueAtTime(0.32, now + 0.95);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.28);

      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      osc.type = 'sawtooth';
      sub.type = 'square';

      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.34);
      osc.frequency.exponentialRampToValueAtTime(112, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(225, now + 0.94);
      osc.frequency.exponentialRampToValueAtTime(84, now + 1.26);

      sub.frequency.setValueAtTime(38, now);
      sub.frequency.exponentialRampToValueAtTime(95, now + 0.34);
      sub.frequency.exponentialRampToValueAtTime(56, now + 0.6);
      sub.frequency.exponentialRampToValueAtTime(112, now + 0.94);
      sub.frequency.exponentialRampToValueAtTime(42, now + 1.26);

      const subGain = ctx.createGain();
      subGain.gain.value = 0.45;

      osc.connect(lowpass);
      sub.connect(subGain);
      subGain.connect(lowpass);
      lowpass.connect(master);
      master.connect(ctx.destination);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 1.3);
      sub.stop(now + 1.3);
      trackNode(osc);
      trackNode(sub);
      await waitMs(1340, signal);
      break;
    }

    case 'ambulans': {
      // Classic two-tone siren: "Nee-naw, nee-naw!"
      const master = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2400;

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
      master.gain.setValueAtTime(0.28, now + 1.15);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';

      const steps = [
        { t: 0.0, f: 880 },
        { t: 0.3, f: 660 },
        { t: 0.6, f: 880 },
        { t: 0.9, f: 660 },
      ];
      for (const s of steps) {
        osc1.frequency.setValueAtTime(s.f, now + s.t);
        osc2.frequency.setValueAtTime(s.f * 1.004, now + s.t);
      }

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.value = 0.35;

      osc1.connect(filter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      filter.connect(master);
      master.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.32);
      osc2.stop(now + 1.32);
      trackNode(osc1);
      trackNode(osc2);
      await waitMs(1350, signal);
      break;
    }

    case 'kereta_api': {
      // Steam train whistle ("Choo-Choo!") + steam chug puffs
      const bursts = [
        { start: 0.02, dur: 0.32 },
        { start: 0.44, dur: 0.54 },
      ];

      for (const b of bursts) {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now + b.start);
        g.gain.exponentialRampToValueAtTime(0.24, now + b.start + 0.04);
        g.gain.setValueAtTime(0.2, now + b.start + b.dur - 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + b.start + b.dur);

        const freqs = [554.37, 659.25, 830.61];
        for (const f of freqs) {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f * 0.96, now + b.start);
          osc.frequency.exponentialRampToValueAtTime(f, now + b.start + 0.05);
          osc.connect(g);
          osc.start(now + b.start);
          osc.stop(now + b.start + b.dur + 0.02);
          trackNode(osc);
        }
        g.connect(ctx.destination);
      }

      const noiseBuf = createNoiseBuffer(ctx, 1.3);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1100;
      bandpass.Q.value = 1.2;

      const chugGain = ctx.createGain();
      chugGain.gain.setValueAtTime(0.0001, now);
      [0.05, 0.3, 0.55, 0.8, 1.05].forEach((t) => {
        chugGain.gain.setValueAtTime(0.001, now + t);
        chugGain.gain.exponentialRampToValueAtTime(0.16, now + t + 0.03);
        chugGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.16);
      });

      noise.connect(bandpass);
      bandpass.connect(chugGain);
      chugGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 1.28);
      trackNode(noise);

      await waitMs(1320, signal);
      break;
    }

    case 'bas': {
      // Deep friendly bus air-horn ("Pooon-pooon!") + pneumatic brake hiss
      const hornBursts = [
        { start: 0.02, dur: 0.36 },
        { start: 0.46, dur: 0.42 },
      ];
      for (const b of hornBursts) {
        const g = ctx.createGain();
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 820;

        g.gain.setValueAtTime(0.0001, now + b.start);
        g.gain.exponentialRampToValueAtTime(0.3, now + b.start + 0.035);
        g.gain.setValueAtTime(0.26, now + b.start + b.dur - 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + b.start + b.dur);

        const freqs = [196, 246.94, 293.66];
        for (const f of freqs) {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + b.start);
          osc.connect(lowpass);
          osc.start(now + b.start);
          osc.stop(now + b.start + b.dur + 0.02);
          trackNode(osc);
        }
        lowpass.connect(g);
        g.connect(ctx.destination);
      }

      const hissBuf = createNoiseBuffer(ctx, 0.35);
      const hiss = ctx.createBufferSource();
      hiss.buffer = hissBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2600;
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.0001, now + 0.94);
      hissGain.gain.exponentialRampToValueAtTime(0.14, now + 0.97);
      hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      hiss.connect(hp);
      hp.connect(hissGain);
      hissGain.connect(ctx.destination);
      hiss.start(now + 0.94);
      hiss.stop(now + 1.28);
      trackNode(hiss);

      await waitMs(1320, signal);
      break;
    }
  }
}

async function playCustomAudioFile(
  dataUrl: string,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const audio = new Audio(dataUrl);
    activeAudioEl = audio;
    let settled = false;

    const cleanup = () => {
      audio.onended = null;
      audio.onerror = null;
      signal?.removeEventListener('abort', onAbort);
      if (activeAudioEl === audio) {
        activeAudioEl = null;
      }
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(maxCapTimer);
      cleanup();
      resolve();
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(maxCapTimer);
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore
      }
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const maxCapTimer = window.setTimeout(() => {
      try {
        audio.pause();
      } catch {
        // ignore
      }
      finish();
    }, 3200);
    activeTimerIds.push(maxCapTimer);

    audio.onended = finish;
    audio.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(maxCapTimer);
      cleanup();
      reject(new Error('Audio file failed'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
    audio.play().catch(() => {
      if (settled) return;
      settled = true;
      window.clearTimeout(maxCapTimer);
      cleanup();
      reject(new Error('Audio play blocked'));
    });
  });
}

export async function playSingleVehicleSound(
  vehicleId: VehicleId,
  customSounds: CustomSoundMap,
  signal?: AbortSignal
): Promise<void> {
  setBgmDucked(true);
  try {
    const custom = customSounds[vehicleId];
    if (custom?.dataUrl) {
      try {
        await playCustomAudioFile(custom.dataUrl, signal);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
      }
    }
    await playSynthesizedVehicleSound(vehicleId, signal);
  } finally {
    if (!playbackAbortController) {
      setBgmDucked(false);
    }
  }
}

export async function playVehicleSequence(
  sequence: VehicleId[],
  customSounds: CustomSoundMap,
  onStepChange: (activeIndex: number | null) => void
): Promise<boolean> {
  stopAllSounds();
  setBgmDucked(true);
  const controller = new AbortController();
  playbackAbortController = controller;

  try {
    for (let i = 0; i < sequence.length; i++) {
      onStepChange(i);
      await playSingleVehicleSound(sequence[i], customSounds, controller.signal);
      if (i < sequence.length - 1) {
        onStepChange(null);
        await waitMs(580, controller.signal);
      }
    }
    onStepChange(null);
    return true;
  } catch (err) {
    onStepChange(null);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return false;
    }
    return false;
  } finally {
    if (playbackAbortController === controller) {
      playbackAbortController = null;
    }
    setBgmDucked(false);
  }
}

export function playPopSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // ignore
  }
}

export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.38);
    });
  } catch {
    // ignore
  }
}

export function playTryAgainSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [392, 330];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.16;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  } catch {
    // ignore
  }
}

export function playShutterSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const buf = createNoiseBuffer(ctx, 0.12);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.12);
  } catch {
    // ignore
  }
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadCustomSoundsFromStorage(): Promise<CustomSoundMap> {
  try {
    const db = await openAudioDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('sounds');
      req.onsuccess = () => resolve((req.result as CustomSoundMap) || {});
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function saveCustomSoundToStorage(
  vehicleId: VehicleId,
  entry: CustomSoundEntry | null,
  currentMap: CustomSoundMap
): Promise<CustomSoundMap> {
  const next: CustomSoundMap = { ...currentMap };
  if (entry) {
    next[vehicleId] = entry;
  } else {
    delete next[vehicleId];
  }
  try {
    const db = await openAudioDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(next, 'sounds');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
  return next;
}
