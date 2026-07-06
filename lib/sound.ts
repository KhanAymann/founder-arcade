export type SoundName =
  | "uiClick"
  | "hover"
  | "dialogue"
  | "choice"
  | "money"
  | "energyLoss"
  | "hype"
  | "minigameStart"
  | "pickup"
  | "damage"
  | "success"
  | "fail"
  | "ending"
  | "pongHit"
  | "shoot";

type MutableAudioContext = AudioContext & { webkitAudioContext?: never };
type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

const STORAGE_KEY = "founder-arcade-muted";
const volume = 0.18;
let context: MutableAudioContext | null = null;
let muted = false;
let didReadPreference = false;
let lastHoverAt = 0;
const subscribers = new Set<(nextMuted: boolean) => void>();

function readPreference() {
  if (didReadPreference || typeof window === "undefined") return;
  didReadPreference = true;
  muted = window.localStorage.getItem(STORAGE_KEY) === "true";
}

function getContext() {
  if (typeof window === "undefined") return null;
  readPreference();
  try {
    const audioWindow = window as AudioWindow;
    const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioCtor) return null;
    if (!context) context = new AudioCtor() as MutableAudioContext;
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", gain = 1, delay = 0) {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume * gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  } catch {
    // Sound should never break gameplay.
  }
}

function playNoise(duration: number, gain = 1, delay = 0) {
  const audio = getContext();
  if (!audio || muted) return;
  try {
    const start = audio.currentTime + delay;
    const buffer = audio.createBuffer(1, Math.max(1, audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = audio.createBufferSource();
    const envelope = audio.createGain();
    source.buffer = buffer;
    envelope.gain.setValueAtTime(volume * gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(envelope);
    envelope.connect(audio.destination);
    source.start(start);
  } catch {
    // Sound should never break gameplay.
  }
}

export function initSound() {
  readPreference();
  const unlock = () => {
    const audio = getContext();
    if (audio?.state === "suspended") void audio.resume();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }
}

export function getSoundMuted() {
  readPreference();
  return muted;
}

export function setSoundMuted(nextMuted: boolean) {
  muted = nextMuted;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(nextMuted));
  subscribers.forEach((listener) => listener(muted));
}

export function subscribeSoundMuted(listener: (nextMuted: boolean) => void) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

export function playSound(name: SoundName) {
  if (muted) return;
  if (name === "hover") {
    const now = Date.now();
    if (now - lastHoverAt < 90) return;
    lastHoverAt = now;
  }

  switch (name) {
    case "hover":
      playTone(760, 0.035, "triangle", 0.22);
      break;
    case "uiClick":
      playTone(360, 0.045, "square", 0.34);
      playTone(620, 0.055, "triangle", 0.22, 0.018);
      break;
    case "choice":
      playTone(260, 0.055, "square", 0.36);
      playTone(720, 0.08, "triangle", 0.32, 0.025);
      break;
    case "dialogue":
      playTone(540, 0.026, "sine", 0.16);
      break;
    case "money":
      playTone(740, 0.07, "triangle", 0.36);
      playTone(1120, 0.09, "sine", 0.28, 0.055);
      break;
    case "hype":
      playTone(620, 0.055, "sine", 0.28);
      playTone(930, 0.075, "triangle", 0.24, 0.045);
      break;
    case "energyLoss":
    case "damage":
      playTone(120, 0.11, "sawtooth", 0.34);
      playNoise(0.08, 0.16);
      break;
    case "minigameStart":
      playTone(320, 0.07, "square", 0.28);
      playTone(520, 0.08, "triangle", 0.26, 0.06);
      break;
    case "pickup":
      playTone(580, 0.045, "triangle", 0.28);
      playTone(880, 0.055, "sine", 0.18, 0.035);
      break;
    case "success":
      playTone(520, 0.08, "triangle", 0.28);
      playTone(780, 0.09, "triangle", 0.28, 0.07);
      playTone(1040, 0.11, "sine", 0.22, 0.14);
      break;
    case "fail":
      playTone(190, 0.14, "sawtooth", 0.32);
      playTone(130, 0.16, "triangle", 0.22, 0.08);
      break;
    case "ending":
      playTone(420, 0.12, "triangle", 0.24);
      playTone(630, 0.14, "sine", 0.2, 0.1);
      break;
    case "pongHit":
      playTone(440, 0.035, "square", 0.28);
      break;
    case "shoot":
      playTone(820, 0.035, "triangle", 0.22);
      playTone(520, 0.04, "sine", 0.12, 0.025);
      break;
  }
}
