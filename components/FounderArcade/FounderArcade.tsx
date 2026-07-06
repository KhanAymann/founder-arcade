"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSoundMuted, initSound, playSound, setSoundMuted, subscribeSoundMuted, type SoundName } from "@/lib/sound";

type StatKey = "money" | "energy" | "hype";
type BackgroundTheme = "title" | "idea" | "cofounder" | "landing" | "build" | "pitch" | "bug" | "demo" | "ending";
type CharacterId = "founder" | "cofounder" | "investor" | "mentor" | "scope" | "mrbeast";
type FounderEmotion = "neutral" | "explaining" | "panicked" | "celebrating" | "skeptical";
type FounderPreset = {
  id: string;
  name: string;
  title: string;
  palette: string;
  initials: string;
};

type Scene = {
  id: number;
  title: string;
  beats: string[];
  speaker: string;
  emotion: FounderEmotion;
  theme: BackgroundTheme;
  cast: CharacterId[];
  choices: { label: string; effects: Partial<Record<StatKey, number>>; reaction: string; emotion?: FounderEmotion; achievement?: string }[];
};

type Stats = Record<StatKey, number>;
type MinigameKind = "investorPong" | "scopeMaze" | "bugBlaster";
type MinigameResult = {
  kind: MinigameKind;
  score: number;
  misses: number;
  effects: Partial<Record<StatKey, number>>;
};
type StatPop = { id: number; key: StatKey; value: number };

const initialStats: Stats = {
  money: 0,
  energy: 100,
  hype: 10,
};

const founderPresets: FounderPreset[] = [
  { id: "founder", name: "Founder", title: "Solo Builder", palette: "avatar-nova", initials: "FA" },
  { id: "byte", name: "Byte", title: "Night Build Sprinter", palette: "avatar-byte", initials: "BY" },
  { id: "mira", name: "Mira", title: "User Whisperer", palette: "avatar-mira", initials: "MR" },
  { id: "jax", name: "Jax", title: "Launch Button Menace", palette: "avatar-jax", initials: "JX" },
];

const scenes: Scene[] = [
  {
    id: 1,
    title: "The Pitch Deck is a Cry for Help",
    speaker: "Founder",
    emotion: "explaining",
    theme: "idea",
    cast: ["founder", "scope"],
    beats: [
      "You open a Google Doc titled 'Vision' and immediately feel the urge to add a logo.",
      "The room is lit by one lamp, three half-dead energy drinks, and the dangerous belief that vibes are traction.",
    ],
    choices: [
      { label: "I should redesign the button for 3 hours.", effects: { money: -20, energy: -10, hype: 8 }, reaction: "You changed the radius from 12px to 14px. Nobody noticed, but your deck looks expensive.", emotion: "skeptical", achievement: "First Pivot" },
      { label: "Ship the MVP before anyone can ask questions.", effects: { money: 15, energy: -8, hype: 3 }, reaction: "The MVP ships with one feature and several emotional support TODOs. Somehow, a user pays.", emotion: "celebrating", achievement: "Scope Demon" },
      { label: "I will post 'big things are moving fast'.", effects: { hype: 6, energy: 4 }, reaction: "The post says almost nothing and gets twelve likes. You briefly become powerful.", emotion: "explaining" },
    ],
  },
  {
    id: 2,
    title: "The Beta Is 'Almost There'",
    speaker: "Cofounder",
    emotion: "panicked",
    theme: "cofounder",
    cast: ["founder", "cofounder"],
    beats: [
      "A tiny bug has become a philosophical crisis.",
      "The app is live, but the loading state says 'Creating your experience' for 17 seconds. A user says, 'lol, this is so broken.'",
    ],
    choices: [
      { label: "I'll patch the bug and pray.", effects: { money: -15, energy: -15, hype: -5 }, reaction: "You fix it, then whisper 'please' at the deploy logs like a tired wizard.", emotion: "panicked" },
      { label: "Let's add AI agents and pray.", effects: { money: 20, energy: -9, hype: 6 }, reaction: "The game now contains an agent that summarizes its own confusion. Investors call it ambitious.", emotion: "explaining", achievement: "Built Different" },
      { label: "Maybe talk to an actual user?", effects: { hype: 10, energy: 6 }, reaction: "A user explains the obvious problem in seven words. Your roadmap quietly catches fire.", emotion: "skeptical", achievement: "Actually Talked To Users" },
    ],
  },
  {
    id: 3,
    title: "The Pitch",
    speaker: "Investor",
    emotion: "explaining",
    theme: "pitch",
    cast: ["founder", "investor"],
    beats: [
      "The investor leans forward. 'So what exactly do you do?'",
      "You now have 30 seconds to bounce back questions without saying 'platform' too many times.",
    ],
    choices: [
      { label: "I'll answer with a TAM slide and a brave smile.", effects: { energy: -2, hype: 2 }, reaction: "The slide has arrows, circles, and one suspiciously large market size. Nobody stops you.", emotion: "explaining" },
      { label: "Say 'great question' and buy four seconds.", effects: { hype: 3 }, reaction: "You buy four seconds of silence. In founder math, that is basically runway.", emotion: "skeptical" },
      { label: "This is basically YC-ready. Probably.", effects: { energy: -4, money: 5 }, reaction: "Confidence spikes. Evidence remains unavailable.", emotion: "celebrating" },
    ],
  },
  {
    id: 4,
    title: "The Pitch Night Panic",
    speaker: "Host",
    emotion: "panicked",
    theme: "demo",
    cast: ["founder", "scope"],
    beats: [
      "It is pitch night. The build was working 12 minutes ago.",
      "You are on a livestream with broken Wi-Fi, one sliding chair, and a spiritual test shaped like a projector.",
    ],
    choices: [
      { label: "This bug is AI-native now.", effects: { money: 12, hype: 10 }, reaction: "The bug becomes a feature. The feature becomes a slide. The slide becomes applause.", emotion: "celebrating", achievement: "First Pivot" },
      { label: "Open Figma. The error deserves taste.", effects: { energy: -20, money: -20 }, reaction: "The error page gets a nicer font. The error remains extremely committed.", emotion: "panicked" },
      { label: "Tell the truth and make a joke.", effects: { energy: 10, hype: 8 }, reaction: "The room laughs. Not enough to fund you, but enough to keep your soul installed.", emotion: "celebrating" },
    ],
  },
  {
    id: 5,
    title: "The Pivot",
    speaker: "Mentor",
    emotion: "skeptical",
    theme: "landing",
    cast: ["founder", "mentor", "scope"],
    beats: [
      "You entered the build phase. The users are somewhere in the maze.",
      "So are Bugs, Burnout, Notifications, and the horrible urge to add multiplayer.",
    ],
    choices: [
      { label: "We pivot into a Chrome extension.", effects: { money: 18, hype: 6 }, reaction: "Nobody knows why. Somehow, investors nod like this was always the plan.", emotion: "explaining", achievement: "Built Different" },
      { label: "I need a nap. For strategy.", effects: { energy: 12, money: -10 }, reaction: "You wake up with no new revenue and one excellent dream about product-market fit.", emotion: "neutral" },
      { label: "The waitlist is traction if the graph is nice.", effects: { hype: 14, energy: -6 }, reaction: "The waitlist has 83 people, two bots, and your cousin. You make a graph anyway.", emotion: "skeptical" },
    ],
  },
  {
    id: 6,
    title: "The Burnout Memo",
    speaker: "Future You",
    emotion: "panicked",
    theme: "bug",
    cast: ["founder", "scope"],
    beats: [
      "Your calendar has become a hostile place.",
      "A notification from your future self says, 'Please stop adding one more feature.' The server bill arrives like an omen.",
    ],
    choices: [
      { label: "I'll watch 47 tutorials and build one navbar.", effects: { energy: -18, money: -20, hype: -6 }, reaction: "The navbar is responsive. Your life is not.", emotion: "panicked", achievement: "Burnout Speedrun" },
      { label: "Cut the scope. Ship the small thing.", effects: { money: 6, energy: 10, hype: 6 }, reaction: "The product gets smaller and everyone understands it better. Suspicious.", emotion: "celebrating" },
      { label: "Day 19: lessons. That counts, right?", effects: { money: 25, energy: -6, hype: 12 }, reaction: "You made $0 today, but 'Day 19: lessons' did numbers. This is not nothing. It is also not rent.", emotion: "explaining" },
    ],
  },
  {
    id: 7,
    title: "The Launch Party",
    speaker: "Cofounder",
    emotion: "celebrating",
    theme: "build",
    cast: ["founder", "cofounder", "scope"],
    beats: [
      "You throw a launch party for a product that only barely works.",
      "The room is full of friends, strangers, and one cofounder who is mostly an idea person.",
    ],
    choices: [
      { label: "Hire a DJ. This is growth.", effects: { money: -12, energy: -4, hype: 6 }, reaction: "The bass drops. Conversion does not.", emotion: "celebrating" },
      { label: "Free access is community, technically.", effects: { money: 8, hype: 10, energy: 2 }, reaction: "Three people log in. One of them is real. You take the win.", emotion: "celebrating" },
      { label: "Stay home and fix onboarding.", effects: { energy: 6, hype: 4 }, reaction: "Nobody claps, but the app finally explains itself. Quietly heroic.", emotion: "neutral" },
    ],
  },
  {
    id: 8,
    title: "The Final Countdown",
    speaker: "Narrator",
    emotion: "skeptical",
    theme: "demo",
    cast: ["founder", "scope"],
    beats: [
      "The app is unstable. The team is tired. The runway is shorter than your attention span.",
      "You can keep going, or admit the dream has become a very specific kind of weather.",
    ],
    choices: [
      { label: "Double down and raise another round.", effects: { money: 40, energy: -10, hype: 4 }, reaction: "The deck works. Your sleep schedule files for separation.", emotion: "celebrating" },
      { label: "Ship a useful thing and stop pretending.", effects: { money: 8, energy: 12, hype: 14 }, reaction: "Against every incentive, you ship something people can explain to their roommate.", emotion: "celebrating" },
      { label: "The meme is the product now.", effects: { money: 22, hype: 10 }, reaction: "The meme is funnier than the product. This creates a difficult board conversation.", emotion: "skeptical" },
    ],
  },
];

function clampMeterStat(value: number) {
  return Math.max(0, Math.min(100, value));
}

function applyStatDelta(stats: Stats, effects: Partial<Record<StatKey, number>>) {
  const nextStats = { ...stats } as Stats;
  (Object.entries(effects) as [StatKey, number][]).forEach(([key, value]) => {
    nextStats[key] = key === "money" ? nextStats[key] + value : clampMeterStat(nextStats[key] + value);
  });
  return nextStats;
}

function getFailureEnding(stats: Stats) {
  if (stats.energy <= 0 && stats.money <= -50) return "Cooked Founder Any%";
  if (stats.energy <= 0) return "Burned Out Before Launch";
  if (stats.money <= -50) return "Bankrupt in Public";
  return null;
}

function resolveEnding(stats: Stats) {
  const failureEnding = getFailureEnding(stats);
  if (failureEnding) return failureEnding;
  if (stats.money >= 80 && stats.energy <= 40) return "Billionaire, But Empty Inside";
  if (stats.hype >= 45 && stats.energy >= 55) return "Actually Built Something Useful";
  if (stats.energy <= 20) return "Died in Tutorial Hell";
  if (stats.hype >= 55 && stats.money >= 45) return "LinkedIn Thought Leader";
  return "Pivoted Into a Chrome Extension";
}

function playSoundCue(cue: "button" | "hover" | "dialogue" | "choice" | "achievement" | "money" | "hype" | "energyLoss" | "pickup" | "damage" | "shoot" | "buzz" | "minigameStart" | "minigameHit" | "gameOver" | "ending") {
  const cueMap: Record<typeof cue, SoundName> = {
    button: "uiClick",
    hover: "hover",
    dialogue: "dialogue",
    choice: "choice",
    achievement: "success",
    money: "money",
    hype: "hype",
    energyLoss: "energyLoss",
    pickup: "pickup",
    damage: "damage",
    shoot: "shoot",
    buzz: "fail",
    minigameStart: "minigameStart",
    minigameHit: "pongHit",
    gameOver: "fail",
    ending: "ending",
  };
  playSound(cueMap[cue]);
}

function getSpeakerCharacter(speaker: string): CharacterId | null {
  const normalized = speaker.toLowerCase();
  if (normalized.includes("founder") || normalized.includes("future")) return "founder";
  if (normalized.includes("cofounder")) return "cofounder";
  if (normalized.includes("investor")) return "investor";
  if (normalized.includes("mentor") || normalized.includes("host") || normalized.includes("narrator")) return "mentor";
  return null;
}

function getEndingDetails(ending: string) {
  const endings: Record<string, { description: string; mood: string; diagnosis: string }> = {
    "Burned Out Before Launch": {
      description: "You kept shipping until your brain started buffering.",
      mood: "Failure ending",
      diagnosis: "Energy reached zero. Founder has left the chat.",
    },
    "Bankrupt in Public": {
      description: "You spent money you did not have on a product users did not ask for.",
      mood: "Failure ending",
      diagnosis: "Negative runway. Positive delusion.",
    },
    "Cooked Founder Any%": {
      description: "You chased every idea at once and became a cautionary tale.",
      mood: "Failure ending",
      diagnosis: "Scope creep speedrun.",
    },
    "Billionaire, But Empty Inside": {
      description: "You made the money. Unfortunately, you now refer to sleep as 'legacy infrastructure.'",
      mood: "Luxury loneliness with a very expensive invoice.",
      diagnosis: "Diagnosis: rich, cooked, still checking Slack.",
    },
    "Actually Built Something Useful": {
      description: "Against every incentive, you shipped a thing people understand. It is suspiciously wholesome.",
      mood: "Warm monitor light after a clean deploy.",
      diagnosis: "Diagnosis: rare case of building the obvious helpful thing.",
    },
    "Died in Tutorial Hell": {
      description: "You watched 47 videos and built one navbar. The stack kept changing. The docs kept smiling.",
      mood: "Glitched red screens and abandoned tabs.",
      diagnosis: "Diagnosis: over-optimized for preparation.",
    },
    "LinkedIn Thought Leader": {
      description: "You made $0, but your post about resilience did numbers. You now own several opinions about culture.",
      mood: "Spotlight, fog machine, bullet points.",
      diagnosis: "Diagnosis: traction-adjacent.",
    },
    "Pivoted Into a Chrome Extension": {
      description: "Nobody knows why. Somehow, investors nodded. The extension icon winks from the toolbar.",
      mood: "Tiny product, late-night charm.",
      diagnosis: "Diagnosis: narrowed the scope until it fit in a toolbar.",
    },
  };
  return endings[ending] ?? endings["Pivoted Into a Chrome Extension"];
}

function formatDelta(key: StatKey, value: number) {
  if (key === "money") return `Money ${value >= 0 ? "+" : "-"}$${Math.abs(value * 1000).toLocaleString()}`;

  const labels: Record<StatKey, string> = {
    money: "Money",
    energy: "Energy",
    hype: "Hype",
  };
  return `${labels[key]} ${value > 0 ? "+" : ""}${value}`;
}

function formatMoney(value: number) {
  return value < 0 ? `-$${Math.abs(value)}k` : `$${value}k`;
}

function getInvestorPongEffects(score: number): Partial<Record<StatKey, number>> {
  if (score >= 10) return { money: 50, hype: 15, energy: -5 };
  if (score >= 5) return { money: 15, hype: 5, energy: -8 };
  return { hype: -10, energy: -15 };
}

function getScopeMazeEffects(score: number): Partial<Record<StatKey, number>> {
  if (score >= 12) return { money: 30, hype: 10, energy: -5 };
  if (score >= 6) return { money: 10, hype: 3, energy: -8 };
  return { hype: -5, energy: -15 };
}

function getBugBlasterEffects(score: number): Partial<Record<StatKey, number>> {
  if (score >= 18) return { money: 25, hype: 8, energy: -5 };
  if (score >= 9) return { money: 8, hype: 3, energy: -8 };
  return { hype: -5, energy: -15 };
}

function getMinigameMeta(kind: MinigameKind) {
  const meta: Record<MinigameKind, { title: string; eyebrow: string; setup: string; complete: string; high: string; medium: string; low: string }> = {
    investorPong: {
      title: "Investor Pong",
      eyebrow: "Pitch Rally Complete",
      setup: "The investor leans forward. Bounce back questions without saying 'platform' too many times.",
      complete: "Term Sheet Fever",
      high: "You survived. Nobody knows how, but the room is clapping.",
      medium: "Technically alive. Emotionally questionable.",
      low: "The investor said 'interesting' in a way that deleted oxygen from the room.",
    },
    scopeMaze: {
      title: "Scope Creep Maze",
      eyebrow: "Scope Sprint Complete",
      setup: "Find users, feedback, money, and focus before the roadmap eats the calendar.",
      complete: "Focus Mode Found",
      high: "You found users and escaped the roadmap. Rare.",
      medium: "You survived, but the calendar looks haunted.",
      low: "Scope Creep ate the project and asked for multiplayer.",
    },
    bugBlaster: {
      title: "Bug Blaster",
      eyebrow: "Build Saved",
      setup: "The build was working 12 minutes ago. Shoot the bugs before pitch night becomes performance art.",
      complete: "Production-ish",
      high: "The build survived. Nobody ask how.",
      medium: "Technically playable. Spiritually broken.",
      low: "The bug won. The bug always wins.",
    },
  };
  return meta[kind];
}

function getMinigameJoke(result: MinigameResult) {
  const meta = getMinigameMeta(result.kind);
  const highScore = result.kind === "bugBlaster" ? 18 : result.kind === "scopeMaze" ? 12 : 10;
  const mediumScore = result.kind === "bugBlaster" ? 9 : result.kind === "scopeMaze" ? 6 : 5;
  if (result.score >= highScore) return meta.high;
  if (result.score >= mediumScore) return meta.medium;
  return meta.low;
}

function isMinigameSuccess(result: MinigameResult) {
  const mediumScore = result.kind === "bugBlaster" ? 9 : result.kind === "scopeMaze" ? 6 : 5;
  return result.score >= mediumScore;
}

function getFounderSpriteSrc(emotion: FounderEmotion) {
  const sprites: Record<FounderEmotion, string> = {
    neutral: "founder-neutral",
    explaining: "founder-neutral",
    panicked: "founder-stressed",
    celebrating: "founder-celebrating",
    skeptical: "founder-deadpan",
  };
  return `/founder-arcade/characters/${sprites[emotion]}.png`;
}

function getCharacterSpriteSrc(character: CharacterId, emotion: FounderEmotion) {
  if (character === "founder") return getFounderSpriteSrc(emotion);
  if (character === "investor") return "/founder-arcade/characters/garry.png";
  if (character === "mrbeast") return "/founder-arcade/characters/mrbeast.png";
  return null;
}

function getFounderSelectEmotion(founderId: string): FounderEmotion {
  const emotions: Record<string, FounderEmotion> = {
    nova: "explaining",
    byte: "panicked",
    mira: "neutral",
    jax: "celebrating",
  };
  return emotions[founderId] ?? "neutral";
}

function getCharacterLabel(character: CharacterId) {
  const labels: Record<CharacterId, string> = {
    founder: "Founder",
    cofounder: "Cofounder",
    investor: "Investor",
    mentor: "Mentor",
    scope: "Scope Creep",
    mrbeast: "Challenge Host",
  };
  return labels[character];
}

function InvestorPong({ onComplete }: { onComplete: (result: MinigameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const doneRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const taunts = useMemo(() => [
    "HOW BIG IS THE MARKET?",
    "WHY NOW?",
    "WHO WANTS THIS?",
    "HOW DO YOU MAKE MONEY?",
  ], []);
  const pongStateRef = useRef({
    playerScore: 0,
    investorScore: 0,
    endAt: 0,
    lastUiTick: 0,
    resetHoldUntil: 0,
    feedbackUntil: 0,
    feedbackText: "READY?",
    tauntIndex: 0,
    nextTauntAt: 0,
    playerPaddle: { x: 232, y: 326, width: 136, height: 14, speed: 460, squashUntil: 0 },
    investorPaddle: { x: 232, y: 24, width: 128, height: 14, speed: 280, squashUntil: 0, aimOffset: 0, nextAimAt: 0 },
    ball: { x: 300, y: 180, vx: 210, vy: 205, size: 10 },
    running: false,
  });
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [taunt, setTaunt] = useState(taunts[0]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    doneRef.current = false;
    lastTimestampRef.current = null;
    keysRef.current = { left: false, right: false };
    const startAt = performance.now();
    pongStateRef.current = {
      playerScore: 0,
      investorScore: 0,
      endAt: startAt + 30000,
      lastUiTick: startAt,
      resetHoldUntil: startAt + 650,
      feedbackUntil: startAt + 900,
      feedbackText: "READY?",
      tauntIndex: 0,
      nextTauntAt: startAt + 2600,
      playerPaddle: { x: 232, y: 326, width: 136, height: 14, speed: 460, squashUntil: 0 },
      investorPaddle: { x: 232, y: 24, width: 128, height: 14, speed: 280, squashUntil: 0, aimOffset: 0, nextAimAt: startAt + 700 },
      ball: { x: 300, y: 180, vx: 210, vy: 205, size: 10 },
      running: true,
    };
    setScore(0);
    setMisses(0);
    setTimeLeft(30);
    setTaunt(taunts[0]);

    const finish = () => {
      if (doneRef.current) return;
      const state = pongStateRef.current;
      doneRef.current = true;
      state.running = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      onCompleteRef.current({ kind: "investorPong", score: state.playerScore, misses: state.investorScore, effects: getInvestorPongEffects(state.playerScore) });
    };

    const resetBall = (now: number, serveToPlayer: boolean) => {
      const state = pongStateRef.current;
      const horizontal = Math.random() > 0.5 ? 1 : -1;
      state.ball.x = canvas.width / 2;
      state.ball.y = canvas.height / 2;
      state.ball.vx = horizontal * (170 + Math.random() * 80);
      state.ball.vy = serveToPlayer ? 220 : -220;
      state.resetHoldUntil = now + 680;
    };

    const hitPaddle = (paddle: typeof pongStateRef.current.playerPaddle, isPlayer: boolean, now: number) => {
      const state = pongStateRef.current;
      const { ball } = state;
      const paddleCenter = paddle.x + paddle.width / 2;
      const impact = (ball.x - paddleCenter) / (paddle.width / 2);
      paddle.squashUntil = now + 140;
      ball.vx = Math.max(-360, Math.min(360, impact * 320 + ball.vx * 0.18));
      ball.vy = (isPlayer ? -1 : 1) * Math.min(430, Math.abs(ball.vy) + 22);
      ball.y = isPlayer ? paddle.y - ball.size - 1 : paddle.y + paddle.height + ball.size + 1;
      playSoundCue("minigameHit");
    };

    const drawPaddle = (paddle: typeof pongStateRef.current.playerPaddle, label: string, isPlayer: boolean, now: number) => {
      const squashing = now < paddle.squashUntil;
      const height = squashing ? paddle.height + 5 : paddle.height;
      const y = squashing ? paddle.y - (isPlayer ? 3 : 0) : paddle.y;
      context.fillStyle = isPlayer ? "#ffffff" : "#111111";
      context.strokeStyle = "#111111";
      context.lineWidth = 3;
      context.beginPath();
      context.roundRect(paddle.x, y, paddle.width, height, 7);
      context.fill();
      context.stroke();
      context.fillStyle = isPlayer ? "#111111" : "#ffffff";
      context.font = "700 18px Gaegu, cursive";
      context.textAlign = "center";
      context.fillText(label, paddle.x + paddle.width / 2, isPlayer ? paddle.y - 8 : paddle.y + paddle.height + 22);
      context.textAlign = "left";
    };

    const draw = (now: number) => {
      const state = pongStateRef.current;
      if (!state.running || doneRef.current) return;

      const previous = lastTimestampRef.current ?? now;
      lastTimestampRef.current = now;
      const dt = Math.min((now - previous) / 1000, 0.033);
      const remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000));

      if (now - state.lastUiTick > 160) {
        setTimeLeft(remaining);
        state.lastUiTick = now;
      }

      if (now >= state.nextTauntAt) {
        state.tauntIndex = (state.tauntIndex + 1) % taunts.length;
        state.nextTauntAt = now + 3600;
        setTaunt(taunts[state.tauntIndex]);
      }

      const { playerPaddle, investorPaddle, ball } = state;
      if (keysRef.current.left) playerPaddle.x -= playerPaddle.speed * dt;
      if (keysRef.current.right) playerPaddle.x += playerPaddle.speed * dt;
      playerPaddle.x = Math.max(18, Math.min(canvas.width - playerPaddle.width - 18, playerPaddle.x));

      if (now >= investorPaddle.nextAimAt) {
        investorPaddle.aimOffset = (Math.random() * 2 - 1) * 54;
        investorPaddle.nextAimAt = now + 520 + Math.random() * 540;
      }
      const investorTarget = ball.x + investorPaddle.aimOffset - investorPaddle.width / 2;
      const investorDelta = investorTarget - investorPaddle.x;
      const investorStep = Math.sign(investorDelta) * Math.min(Math.abs(investorDelta), investorPaddle.speed * dt);
      investorPaddle.x += investorStep;
      investorPaddle.x = Math.max(18, Math.min(canvas.width - investorPaddle.width - 18, investorPaddle.x));

      if (now >= state.resetHoldUntil) {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
      }

      if (ball.x <= ball.size + 4) {
        ball.x = ball.size + 4;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x >= canvas.width - ball.size - 4) {
        ball.x = canvas.width - ball.size - 4;
        ball.vx = -Math.abs(ball.vx);
      }

      const hitInvestor =
        ball.vy < 0 &&
        ball.y - ball.size <= investorPaddle.y + investorPaddle.height &&
        ball.y + ball.size >= investorPaddle.y &&
        ball.x >= investorPaddle.x - 4 &&
        ball.x <= investorPaddle.x + investorPaddle.width + 4;

      const hitPlayer =
        ball.vy > 0 &&
        ball.y + ball.size >= playerPaddle.y &&
        ball.y - ball.size <= playerPaddle.y + playerPaddle.height &&
        ball.x >= playerPaddle.x - 4 &&
        ball.x <= playerPaddle.x + playerPaddle.width + 4;

      if (hitInvestor) hitPaddle(investorPaddle, false, now);
      if (hitPlayer) hitPaddle(playerPaddle, true, now);

      if (ball.y < -ball.size) {
        state.playerScore += 1;
        setScore(state.playerScore);
        state.feedbackText = "SCORE!";
        state.feedbackUntil = now + 950;
        playSoundCue("achievement");
        resetBall(now, true);
      }

      if (ball.y > canvas.height + ball.size) {
        state.investorScore += 1;
        setMisses(state.investorScore);
        state.feedbackText = "MISS!";
        state.feedbackUntil = now + 950;
        playSoundCue("gameOver");
        if (state.investorScore >= 5) {
          finish();
          return;
        }
        resetBall(now, false);
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f8f6ef";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#111111";
      context.lineWidth = 5;
      context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      context.strokeStyle = "rgba(17, 17, 17, 0.28)";
      context.lineWidth = 3;
      context.setLineDash([14, 13]);
      context.beginPath();
      context.moveTo(20, canvas.height / 2);
      context.lineTo(canvas.width - 20, canvas.height / 2);
      context.stroke();
      context.setLineDash([]);

      context.fillStyle = "rgba(17, 17, 17, 0.06)";
      context.fillRect(14, 14, canvas.width - 28, 56);
      context.fillRect(14, canvas.height - 70, canvas.width - 28, 56);

      context.fillStyle = "#111111";
      context.font = "700 20px Gaegu, cursive";
      context.textAlign = "left";
      context.fillText("INVESTOR", 24, 38);
      context.fillText("FOUNDER", 24, canvas.height - 28);
      context.textAlign = "right";
      context.fillText(taunt, canvas.width - 24, 38);
      context.textAlign = "left";

      drawPaddle(investorPaddle, "INVESTOR", false, now);
      drawPaddle(playerPaddle, "YOU", true, now);

      context.fillStyle = "#d9a441";
      context.strokeStyle = "#111111";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#111111";
      context.font = "700 12px Gaegu, cursive";
      context.textAlign = "center";
      context.fillText("?", ball.x, ball.y + 4);

      if (now < state.feedbackUntil || now < state.resetHoldUntil) {
        context.fillStyle = "#111111";
        context.font = "700 46px Gaegu, cursive";
        context.textAlign = "center";
        context.fillText(now < state.resetHoldUntil ? state.feedbackText : state.feedbackText, canvas.width / 2, canvas.height / 2 - 18);
      }
      context.textAlign = "left";

      if (remaining <= 0) {
        finish();
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        keysRef.current.left = true;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        keysRef.current.right = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        keysRef.current.left = false;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        keysRef.current.right = false;
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const { playerPaddle } = pongStateRef.current;
      playerPaddle.x = (event.clientX - rect.left) * scale - playerPaddle.width / 2;
      playerPaddle.x = Math.max(18, Math.min(canvas.width - playerPaddle.width - 18, playerPaddle.x));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    animationFrameRef.current = window.requestAnimationFrame(draw);

    return () => {
      pongStateRef.current.running = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [taunts]);

  return (
    <section className="pong-overlay" aria-label="Investor Pong">
      <div className="pong-card">
        <div className="pong-header">
          <div>
            <p className="eyebrow">Arcade Interlude</p>
            <h2>Investor Pong</h2>
            <p className="minigame-subtitle">Rally the pitch-question ball past the investor before they pick your deck apart.</p>
          </div>
          <div className="pong-hud">
            <span>Founder {score}</span>
            <span>Investor {misses}</span>
            <span>{timeLeft}s</span>
          </div>
        </div>
        <div className="investor-taunt" aria-live="polite">{taunt}</div>
        <canvas ref={canvasRef} className="pong-canvas investor-pong-canvas" width={600} height={360} />
        <p className="pong-help">Move with A/D, arrow keys, or pointer. Send the pitch past the investor paddle to score.</p>
      </div>
    </section>
  );
}

function ScopeCreepMaze({ onComplete }: { onComplete: (result: MinigameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentDirectionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const queuedDirectionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const doneRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [focusTime, setFocusTime] = useState(0);
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const directionFromMoveKey = (key: string) => {
    const normalized = key.toLowerCase();
    if (key === "ArrowLeft" || normalized === "a") return { x: -1, y: 0 };
    if (key === "ArrowRight" || normalized === "d") return { x: 1, y: 0 };
    if (key === "ArrowUp" || normalized === "w") return { x: 0, y: -1 };
    if (key === "ArrowDown" || normalized === "s") return { x: 0, y: 1 };
    return null;
  };

  const queueMazeDirection = (x: number, y: number) => {
    const isCardinal = Math.abs(x) + Math.abs(y) === 1;
    if (isCardinal) queuedDirectionRef.current = { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    doneRef.current = false;
    currentDirectionRef.current = { x: 0, y: 0 };
    queuedDirectionRef.current = { x: 0, y: 0 };
    setScore(0);
    setHits(0);
    setTimeLeft(30);
    setFocusTime(0);
    setIsReady(true);

    type Direction = { x: number; y: number };
    type TilePosition = { row: number; col: number };
    type Mover = {
      row: number;
      col: number;
      targetRow: number;
      targetCol: number;
      x: number;
      y: number;
      speed: number;
    };
    type Pickup = {
      row: number;
      col: number;
      kind: "users" | "feedback" | "money" | "focus";
      label: string;
      color: string;
      value: number;
      taken: boolean;
    };
    type Enemy = Mover & {
      color: string;
      label: string;
      icon: string;
      behavior: "scope" | "bug" | "notification" | "burnout";
      lastDirection: Direction;
    };
    type ScorePop = { x: number; y: number; text: string; life: number; color: string };

    const tile = 32;
    const rawMap = [
      "###################",
      "#P..U....#....O..S#",
      "#.#.#.###.#.###.#.#",
      "#.....#..F..#.....#",
      "###.#.#.###.#.#.###",
      "#...#...$...#.....#",
      "#.#.###.#.###.###.#",
      "#.#.....#.....#...#",
      "#.#####...#####...#",
      "#U..#...N...#..$..#",
      "#.##.#####.##..#..#",
      "#B..F....O....R...#",
      "###################",
    ];
    const map = rawMap.map((row) => row.split(""));
    const pickups: Pickup[] = [];
    const enemies: Enemy[] = [];
    let playerSpawn: TilePosition = { row: 1, col: 1 };
    const directions: Direction[] = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    const tileToPixel = (row: number, col: number) => ({ x: col * tile, y: row * tile });
    const getTileCenter = (row: number, col: number) => ({ x: col * tile + tile / 2, y: row * tile + tile / 2 });
    const isWall = (row: number, col: number) => map[row]?.[col] === "#" || map[row]?.[col] === undefined;
    const isWalkable = (row: number, col: number) => !isWall(row, col);
    const isCardinalDirection = (direction: Direction) => Math.abs(direction.x) + Math.abs(direction.y) === 1;
    const nextTileForDirection = (from: TilePosition, direction: Direction) => ({ row: from.row + direction.y, col: from.col + direction.x });
    const canMove = (from: TilePosition, direction: Direction) => isCardinalDirection(direction) && isWalkable(from.row + direction.y, from.col + direction.x);
    const getNeighbors = (tilePosition: TilePosition) =>
      directions
        .map((direction) => ({ row: tilePosition.row + direction.y, col: tilePosition.col + direction.x, direction }))
        .filter((candidate) => isWalkable(candidate.row, candidate.col));
    const makeMover = (row: number, col: number, speed: number): Mover => {
      const center = getTileCenter(row, col);
      return { row, col, targetRow: row, targetCol: col, x: center.x, y: center.y, speed };
    };
    const makeEnemy = (row: number, col: number, behavior: Enemy["behavior"]): Enemy => {
      const base = makeMover(row, col, behavior === "burnout" ? 82 : behavior === "scope" ? 108 : 96);
      const meta = {
        scope: { color: "#9f3f2f", label: "Scope Creep", icon: "SC" },
        bug: { color: "#6f6f6f", label: "Bug", icon: "B" },
        notification: { color: "#537f9b", label: "Notification", icon: "N" },
        burnout: { color: "#888888", label: "Burnout", icon: "!" },
      }[behavior];
      return { ...base, ...meta, behavior, lastDirection: { x: 0, y: 0 } };
    };

    rawMap.forEach((row, rowIndex) => {
      row.split("").forEach((cell, colIndex) => {
        const pickupMeta = {
          U: { kind: "users" as const, label: "U", color: "#537f9b", value: 3 },
          F: { kind: "feedback" as const, label: "F", color: "#78a86b", value: 2 },
          "$": { kind: "money" as const, label: "$", color: "#d9a441", value: 5 },
          O: { kind: "focus" as const, label: "FO", color: "#ffffff", value: 2 },
        }[cell];
        if (cell === "P") playerSpawn = { row: rowIndex, col: colIndex };
        if (cell === "S") enemies.push(makeEnemy(rowIndex, colIndex, "scope"));
        if (cell === "B") enemies.push(makeEnemy(rowIndex, colIndex, "bug"));
        if (cell === "N") enemies.push(makeEnemy(rowIndex, colIndex, "notification"));
        if (cell === "R") enemies.push(makeEnemy(rowIndex, colIndex, "burnout"));
        if (pickupMeta) pickups.push({ row: rowIndex, col: colIndex, ...pickupMeta, taken: false });
        if (cell !== "#") map[rowIndex][colIndex] = ".";
      });
    });

    const player = { ...makeMover(playerSpawn.row, playerSpawn.col, 190), radius: 12 };
    let localScore = 0;
    let localHits = 0;
    let invulnerableUntil = 0;
    let focusUntil = 0;
    const startedAt = performance.now() + 900;
    let lastTick = performance.now();
    let lastFrame = performance.now();
    const endAt = startedAt + 30000;
    const scorePops: ScorePop[] = [];

    const tileKey = (position: TilePosition) => `${position.row},${position.col}`;
    const parseTileKey = (key: string) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col };
    };
    const findBfsNextStep = (start: TilePosition, target: TilePosition): TilePosition | null => {
      if (start.row === target.row && start.col === target.col) return null;
      const startKey = tileKey(start);
      const targetKey = tileKey(target);
      const queue = [start];
      const visited = new Set([startKey]);
      const parent = new Map<string, string>();

      while (queue.length) {
        const current = queue.shift()!;
        const currentKey = tileKey(current);
        if (currentKey === targetKey) break;
        getNeighbors(current).forEach((neighbor) => {
          const key = tileKey(neighbor);
          if (visited.has(key)) return;
          visited.add(key);
          parent.set(key, currentKey);
          queue.push(neighbor);
        });
      }

      if (!visited.has(targetKey)) return null;
      let stepKey = targetKey;
      while (parent.get(stepKey) && parent.get(stepKey) !== startKey) stepKey = parent.get(stepKey)!;
      return parseTileKey(stepKey);
    };
    const randomWalkableTile = () => {
      const openTiles: TilePosition[] = [];
      map.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell !== "#") openTiles.push({ row: rowIndex, col: colIndex });
        });
      });
      return openTiles[Math.floor(Math.random() * openTiles.length)] ?? playerSpawn;
    };
    const chooseFallbackNeighbor = (from: TilePosition, lastDirection: Direction) => {
      const neighbors = getNeighbors(from);
      const nonReverse = neighbors.filter((neighbor) => neighbor.direction.x !== -lastDirection.x || neighbor.direction.y !== -lastDirection.y);
      const pool = nonReverse.length ? nonReverse : neighbors;
      return pool[Math.floor(Math.random() * pool.length)] ?? null;
    };
    const chooseEnemyTarget = (enemy: Enemy): TilePosition => {
      const playerTile = { row: player.row, col: player.col };
      if (enemy.behavior === "scope" || enemy.behavior === "burnout") return playerTile;
      if (enemy.behavior === "bug") return Math.random() < 0.62 ? playerTile : randomWalkableTile();
      return Math.random() < 0.28 ? playerTile : randomWalkableTile();
    };
    const chooseEnemyNextTile = (enemy: Enemy) => {
      const start = { row: enemy.row, col: enemy.col };
      const target = chooseEnemyTarget(enemy);
      const next = findBfsNextStep(start, target) ?? chooseFallbackNeighbor(start, enemy.lastDirection);
      if (!next) return;
      enemy.lastDirection = { x: next.col - enemy.col, y: next.row - enemy.row };
      enemy.targetRow = next.row;
      enemy.targetCol = next.col;
    };
    const isMoverAtTarget = (mover: Mover) => Math.hypot(mover.x - getTileCenter(mover.targetRow, mover.targetCol).x, mover.y - getTileCenter(mover.targetRow, mover.targetCol).y) < 0.6;
    const moveTowardTarget = (mover: Mover, dt: number, speedMultiplier = 1) => {
      const target = getTileCenter(mover.targetRow, mover.targetCol);
      const dx = target.x - mover.x;
      const dy = target.y - mover.y;
      const distance = Math.hypot(dx, dy);
      const step = mover.speed * speedMultiplier * dt;
      if (distance <= step || distance < 0.6) {
        mover.x = target.x;
        mover.y = target.y;
        mover.row = mover.targetRow;
        mover.col = mover.targetCol;
        return true;
      }
      mover.x += (dx / distance) * step;
      mover.y += (dy / distance) * step;
      return false;
    };
    const setPlayerTarget = (direction: Direction) => {
      const next = nextTileForDirection(player, direction);
      currentDirectionRef.current = direction;
      player.targetRow = next.row;
      player.targetCol = next.col;
    };
    const applyQueuedDirectionIfPossible = () => {
      const queued = queuedDirectionRef.current;
      if (!canMove(player, queued)) return false;
      setPlayerTarget(queued);
      return true;
    };
    const continueCurrentDirectionIfPossible = () => {
      const current = currentDirectionRef.current;
      if (!canMove(player, current)) {
        currentDirectionRef.current = { x: 0, y: 0 };
        return false;
      }
      setPlayerTarget(current);
      return true;
    };

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      onCompleteRef.current({ kind: "scopeMaze", score: localScore, misses: localHits, effects: getScopeMazeEffects(localScore) });
    };

    const draw = (now: number) => {
      if (doneRef.current) return;
      const dt = Math.min((now - lastFrame) / 1000, 0.033);
      lastFrame = now;
      const isPlaying = now >= startedAt;
      const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
      const focusRemaining = Math.max(0, Math.ceil((focusUntil - now) / 1000));
      if (now - lastTick > 200) {
        setTimeLeft(remaining);
        setFocusTime(focusRemaining);
        setIsReady(!isPlaying);
        lastTick = now;
      }

      if (isPlaying) {
        if (isMoverAtTarget(player)) {
          if (!applyQueuedDirectionIfPossible()) continueCurrentDirectionIfPossible();
        }
        moveTowardTarget(player, dt);

        pickups.forEach((item) => {
          if (item.taken) return;
          if (player.row === item.row && player.col === item.col) {
            const { x: cx, y: cy } = getTileCenter(item.row, item.col);
            item.taken = true;
            localScore += item.value;
            setScore(localScore);
            playSoundCue(item.kind === "money" ? "money" : "pickup");
            scorePops.push({ x: cx, y: cy, text: `+${item.value}`, life: 42, color: item.color });
            if (item.kind === "focus") {
              playSoundCue("achievement");
              focusUntil = now + 5500;
              scorePops.push({ x: cx, y: cy - 14, text: "FOCUS", life: 52, color: "#111111" });
            }
          }
        });

        enemies.forEach((enemy) => {
          if (isMoverAtTarget(enemy)) chooseEnemyNextTile(enemy);
          moveTowardTarget(enemy, dt, focusUntil > now ? 0.48 : 1);
          if (now > invulnerableUntil && (player.row === enemy.row && player.col === enemy.col || Math.hypot(player.x - enemy.x, player.y - enemy.y) < 22)) {
            localHits += 1;
            setHits(localHits);
            playSoundCue("damage");
            invulnerableUntil = now + 1550;
            scorePops.push({ x: player.x, y: player.y - 8, text: "ENERGY -", life: 48, color: "#9f3f2f" });
            if (localHits >= 4) finish();
          }
        });
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#f8f6ef";
      context.fillRect(0, 0, canvas.width, canvas.height);

      map.forEach((row, y) => {
        row.forEach((cell, x) => {
          const { x: px, y: py } = tileToPixel(y, x);
          if (cell === "#") {
            context.fillStyle = "#2b2b2b";
            context.fillRect(px + 2, py + 2, tile - 4, tile - 4);
            context.strokeStyle = "#111111";
            context.lineWidth = 2;
            context.strokeRect(px + 4, py + 4, tile - 8, tile - 8);
          } else {
            context.strokeStyle = "rgba(17, 17, 17, 0.08)";
            context.lineWidth = 1;
            context.strokeRect(px + 0.5, py + 0.5, tile - 1, tile - 1);
          }
        });
      });

      pickups.forEach((item) => {
        if (item.taken) return;
        const { x: cx, y: cy } = getTileCenter(item.row, item.col);
        context.fillStyle = item.color;
        if (item.kind === "feedback") {
          context.strokeStyle = "#111111";
          context.lineWidth = 2;
          context.roundRect(cx - 10, cy - 8, 20, 16, 5);
          context.fill();
          context.stroke();
          context.fillRect(cx - 3, cy + 5, 6, 5);
        } else if (item.kind === "focus") {
          context.fillStyle = "#ffffff";
          context.strokeStyle = "#111111";
          context.lineWidth = 3;
          context.beginPath();
          context.arc(cx, cy, 13, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          context.fillStyle = "#111111";
          context.font = "bold 10px Gaegu, cursive";
          context.textAlign = "center";
          context.fillText("FO", cx, cy + 4);
          context.textAlign = "left";
        } else {
          context.beginPath();
          context.arc(cx, cy, item.kind === "money" ? 12 : 10, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = "#111111";
          context.lineWidth = 2;
          context.stroke();
          context.fillStyle = "#111111";
          context.font = "bold 12px Gaegu, cursive";
          context.textAlign = "center";
          context.fillText(item.label, cx, cy + 4);
          context.textAlign = "left";
        }
      });

      enemies.forEach((enemy) => {
        context.globalAlpha = focusUntil > now ? 0.48 : 1;
        context.fillStyle = enemy.color;
        context.strokeStyle = focusUntil > now ? "#7a7a7a" : "#111111";
        context.lineWidth = 3;
        context.beginPath();
        if (enemy.icon === "!") {
          context.moveTo(enemy.x, enemy.y - 13);
          context.quadraticCurveTo(enemy.x + 16, enemy.y + 2, enemy.x, enemy.y + 15);
          context.quadraticCurveTo(enemy.x - 16, enemy.y + 2, enemy.x, enemy.y - 13);
        } else {
          context.arc(enemy.x, enemy.y, 13, 0, Math.PI * 2);
        }
        context.fill();
        context.stroke();
        context.fillStyle = "#ffffff";
        context.font = "bold 10px Gaegu, cursive";
        context.textAlign = "center";
        context.fillText(enemy.icon, enemy.x, enemy.y + 4);
        context.globalAlpha = 1;
      });

      context.globalAlpha = now < invulnerableUntil && Math.floor(now / 90) % 2 === 0 ? 0.38 : 1;
      context.fillStyle = "#ffffff";
      context.strokeStyle = "#111111";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#111111";
      context.beginPath();
      context.arc(player.x - 4, player.y - 2, 2, 0, Math.PI * 2);
      context.arc(player.x + 4, player.y - 2, 2, 0, Math.PI * 2);
      context.fill();
      const active = currentDirectionRef.current;
      context.strokeStyle = "#111111";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(player.x, player.y + 5);
      context.lineTo(player.x + active.x * 8, player.y + 5 + active.y * 8);
      context.stroke();
      context.globalAlpha = 1;

      for (let i = scorePops.length - 1; i >= 0; i -= 1) {
        const pop = scorePops[i];
        context.fillStyle = pop.color;
        context.font = "bold 13px Gaegu, cursive";
        context.textAlign = "center";
        context.strokeStyle = "rgba(255, 255, 255, 0.9)";
        context.lineWidth = 3;
        context.strokeText(pop.text, pop.x, pop.y - (42 - pop.life) * 0.55);
        context.fillText(pop.text, pop.x, pop.y - (42 - pop.life) * 0.55);
        pop.life -= 1;
        if (pop.life <= 0) scorePops.splice(i, 1);
      }
      context.textAlign = "left";

      context.fillStyle = "#111111";
      context.font = "bold 13px Gaegu, cursive";
      context.fillText(focusUntil > now ? "FOCUS MODE: enemies slowed" : "Collect U / F / $ / FO", 14, canvas.height - 12);

      if (!isPlaying) {
        context.fillStyle = "rgba(248, 246, 239, 0.88)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#111111";
        context.font = "bold 42px Gaegu, cursive";
        context.textAlign = "center";
        context.fillText("READY?", canvas.width / 2, canvas.height / 2 + 12);
        context.textAlign = "left";
      }

      if (remaining <= 0 || pickups.every((item) => item.taken)) {
        finish();
        return;
      }
      frameRef.current = window.requestAnimationFrame(draw);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = directionFromMoveKey(event.key);
      if (!direction) return;
      event.preventDefault();
      queueMazeDirection(direction.x, direction.y);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!directionFromMoveKey(event.key)) return;
      event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    frameRef.current = window.requestAnimationFrame(draw);

    return () => {
      doneRef.current = true;
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <section className="pong-overlay" aria-label="Scope Creep Maze">
      <div className="pong-card">
        <div className="pong-header">
          <div>
            <p className="eyebrow">Arcade Interlude</p>
            <h2>Scope Creep Maze</h2>
            <p className="minigame-subtitle">{getMinigameMeta("scopeMaze").setup}</p>
          </div>
          <div className="pong-hud">
            <span>Score {score}</span>
            <span>Energy {Math.max(0, 4 - hits)}/4</span>
            <span>{timeLeft}s</span>
            {isReady ? <span>Ready</span> : null}
            {focusTime > 0 ? <span>Focus {focusTime}s</span> : null}
          </div>
        </div>
        <canvas ref={canvasRef} className="maze-canvas pong-canvas" width={608} height={416} />
        <div className="maze-legend" aria-label="Scope Creep Maze legend">
          <span><b className="legend-users">U</b> Users</span>
          <span><b className="legend-feedback">F</b> Feedback</span>
          <span><b className="legend-money">$</b> Money</span>
          <span><b className="legend-focus">FO</b> Focus Mode</span>
          <span><b className="legend-danger">SC</b> Scope Creep</span>
        </div>
        <div className="maze-touch-controls" aria-label="Maze touch controls">
          <button onPointerDown={() => queueMazeDirection(0, -1)}>W</button>
          <button onPointerDown={() => queueMazeDirection(-1, 0)}>A</button>
          <button onPointerDown={() => queueMazeDirection(0, 1)}>S</button>
          <button onPointerDown={() => queueMazeDirection(1, 0)}>D</button>
        </div>
        <p className="pong-help">Move with WASD or arrow keys. Focus Mode slows enemies for a few seconds. Controls: coin pickup, player damage, game start, game over.</p>
      </div>
    </section>
  );
}

function BugBlaster({ onComplete }: { onComplete: (result: MinigameResult) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef({ left: false, right: false, shoot: false });
  const doneRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const blasterStateRef = useRef<{
    score: number;
    misses: number;
    endAt: number;
    lastUiTick: number;
    spawnAt: number;
    shootCooldown: number;
    shakeUntil: number;
    player: { x: number; y: number; width: number; height: number; speed: number };
    shots: { x: number; y: number; speed: number }[];
    issues: { x: number; y: number; speed: number; size: number; hp: number; label: string; color: string; hitFlash: number }[];
    hitPops: { x: number; y: number; text: string; life: number; color: string }[];
    running: boolean;
  }>({
    score: 0,
    misses: 0,
    endAt: 0,
    lastUiTick: 0,
    spawnAt: 0,
    shootCooldown: 0,
    shakeUntil: 0,
    player: { x: 276, y: 326, width: 48, height: 18, speed: 280 },
    shots: [],
    issues: [],
    hitPops: [],
    running: false,
  });
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const labels = ["BUG", "TODO", "BUILD", "REQ"];
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const startAt = performance.now();
    doneRef.current = false;
    lastTimestampRef.current = null;
    keysRef.current = { left: false, right: false, shoot: false };
    blasterStateRef.current = {
      score: 0,
      misses: 0,
      endAt: startAt + 30000,
      lastUiTick: startAt,
      spawnAt: startAt + 900,
      shootCooldown: 0,
      shakeUntil: 0,
      player: { x: canvas.width / 2 - 24, y: 326, width: 48, height: 18, speed: 280 },
      shots: [],
      issues: [],
      hitPops: [],
      running: true,
    };
    setScore(0);
    setMisses(0);
    setTimeLeft(30);

    const finish = () => {
      if (doneRef.current) return;
      const state = blasterStateRef.current;
      doneRef.current = true;
      state.running = false;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      onCompleteRef.current({ kind: "bugBlaster", score: state.score, misses: state.misses, effects: getBugBlasterEffects(state.score) });
    };

    const spawnIssue = (now: number) => {
      const state = blasterStateRef.current;
      const boss = Math.random() > 0.88;
      const label = boss ? "ONE MORE FEATURE" : labels[Math.floor(Math.random() * labels.length)];
      const size = boss ? 38 : 26;
      state.issues.push({
        x: 24 + Math.random() * (canvas.width - 48 - size),
        y: -size - 8,
        speed: boss ? 54 : 72 + Math.random() * 34,
        size: boss ? 34 : 24,
        hp: boss ? 3 : 1,
        label,
        color: boss ? "#9f3f2f" : ["#6f6f6f", "#d9a441", "#537f9b", "#78a86b"][Math.floor(Math.random() * 4)],
        hitFlash: 0,
      });
      state.spawnAt = now + Math.max(420, 950 - state.score * 16);
    };

    const draw = (now: number) => {
      const state = blasterStateRef.current;
      if (!state.running || doneRef.current) return;

      const previous = lastTimestampRef.current ?? now;
      lastTimestampRef.current = now;
      const dt = Math.min((now - previous) / 1000, 0.033);
      const remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000));

      if (now - state.lastUiTick > 180) {
        setTimeLeft(remaining);
        state.lastUiTick = now;
      }

      const { player, shots, issues, hitPops } = state;
      if (keysRef.current.left) player.x -= player.speed * dt;
      if (keysRef.current.right) player.x += player.speed * dt;
      player.x = Math.max(18, Math.min(canvas.width - player.width - 18, player.x));

      state.shootCooldown = Math.max(0, state.shootCooldown - dt);
      if (keysRef.current.shoot && state.shootCooldown <= 0) {
        shots.push({ x: player.x + player.width / 2, y: player.y, speed: 7.5 });
        playSoundCue("shoot");
        state.shootCooldown = 0.16;
      }

      if (now >= state.spawnAt) {
        spawnIssue(now);
      }

      shots.forEach((shot) => {
        shot.y -= 420 * dt;
      });
      issues.forEach((issue) => {
        issue.y += issue.speed * dt;
        issue.hitFlash = Math.max(0, issue.hitFlash - dt);
      });

      for (let i = issues.length - 1; i >= 0; i -= 1) {
        const issue = issues[i];
        for (let j = shots.length - 1; j >= 0; j -= 1) {
          const shot = shots[j];
          const hit =
            shot.x >= issue.x &&
            shot.x <= issue.x + issue.size &&
            shot.y >= issue.y &&
            shot.y <= issue.y + issue.size;
          if (!hit) continue;
          shots.splice(j, 1);
          issue.hp -= 1;
          playSoundCue("minigameHit");
          issue.hitFlash = 0.08;
          hitPops.push({ x: issue.x + issue.size / 2, y: issue.y, text: "HIT", life: 34, color: "#111111" });
          if (issue.hp <= 0) {
            state.score += issue.size > 30 ? 4 : 1;
            setScore(state.score);
            if (issue.size > 30) playSoundCue("achievement");
            issues.splice(i, 1);
          }
          break;
        }
      }

      for (let i = issues.length - 1; i >= 0; i -= 1) {
        if (issues[i].y > canvas.height - 22) {
          hitPops.push({ x: issues[i].x + issues[i].size / 2, y: canvas.height - 36, text: "MISS", life: 44, color: "#9f3f2f" });
          issues.splice(i, 1);
          state.misses += 1;
          state.shakeUntil = now + 160;
          playSoundCue("damage");
          setMisses(state.misses);
          if (state.misses >= 8) {
            finish();
            return;
          }
        }
      }
      for (let i = shots.length - 1; i >= 0; i -= 1) {
        if (shots[i].y < -10) shots.splice(i, 1);
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      const shake = now < state.shakeUntil ? Math.sin(now / 18) * 3 : 0;
      context.save();
      context.translate(shake, 0);
      context.fillStyle = "#f8f6ef";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "rgba(17, 17, 17, 0.16)";
      context.lineWidth = 1;
      for (let y = 24; y < canvas.height; y += 36) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
      context.fillStyle = "#e2dfd5";
      context.fillRect(0, canvas.height - 28, canvas.width, 28);
      context.strokeStyle = "#111111";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(0, canvas.height - 28);
      context.lineTo(canvas.width, canvas.height - 28);
      context.stroke();

      shots.forEach((shot) => {
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#111111";
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(shot.x - 3, shot.y - 14, 6, 16, 3);
        context.fill();
        context.stroke();
      });

      issues.forEach((issue) => {
        context.fillStyle = issue.hitFlash > 0 ? "#ffffff" : issue.color;
        context.strokeStyle = "#111111";
        context.lineWidth = 3;
        context.beginPath();
        context.roundRect(issue.x, issue.y, issue.size, issue.size, 5);
        context.fill();
        context.stroke();
        context.fillStyle = issue.color === "#9f3f2f" ? "#ffffff" : "#111111";
        context.font = issue.size > 30 ? "8px Gaegu, cursive" : "9px Gaegu, cursive";
        context.fillText(issue.label, issue.x + 3, issue.y + issue.size / 2 + 3, issue.size - 5);
      });

      context.fillStyle = "#ffffff";
      context.strokeStyle = "#111111";
      context.lineWidth = 3;
      context.beginPath();
      context.roundRect(player.x, player.y, player.width, player.height, 5);
      context.fill();
      context.stroke();
      context.fillStyle = "#d9a441";
      context.strokeStyle = "#111111";
      context.beginPath();
      context.roundRect(player.x + 10, player.y - 8, player.width - 20, 9, 4);
      context.fill();
      context.stroke();

      for (let i = hitPops.length - 1; i >= 0; i -= 1) {
        const pop = hitPops[i];
        context.fillStyle = pop.color;
        context.font = "bold 12px Gaegu, cursive";
        context.textAlign = "center";
        context.fillText(pop.text, pop.x, pop.y - (44 - pop.life) * 0.55);
        pop.life -= 1;
        if (pop.life <= 0) hitPops.splice(i, 1);
      }
      context.textAlign = "left";

      context.fillStyle = "#111111";
      context.font = "13px Gaegu, cursive";
      context.fillText("Spacebar ships fixes", 14, 24);
      context.restore();

      if (remaining <= 0) {
        finish();
        return;
      }
      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        keysRef.current.left = true;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        keysRef.current.right = true;
      }
      if (event.code === "Space") {
        event.preventDefault();
        keysRef.current.shoot = true;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        keysRef.current.left = false;
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        keysRef.current.right = false;
      }
      if (event.code === "Space") {
        event.preventDefault();
        keysRef.current.shoot = false;
      }
    };
    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const { player } = blasterStateRef.current;
      player.x = (event.clientX - rect.left) * scale - player.width / 2;
    };
    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      keysRef.current.shoot = true;
    };
    const handlePointerUp = () => {
      keysRef.current.shoot = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    animationFrameRef.current = window.requestAnimationFrame(draw);

    return () => {
      blasterStateRef.current.running = false;
      doneRef.current = true;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <section className="pong-overlay" aria-label="Bug Blaster">
      <div className="pong-card">
        <div className="pong-header">
          <div>
            <p className="eyebrow">Arcade Interlude</p>
            <h2>Bug Blaster</h2>
            <p className="minigame-subtitle">{getMinigameMeta("bugBlaster").setup}</p>
          </div>
          <div className="pong-hud">
            <span>Score {score}</span>
            <span>Miss {misses}/8</span>
            <span>{timeLeft}s</span>
          </div>
        </div>
        <canvas ref={canvasRef} className="pong-canvas" width={600} height={360} />
        <p className="pong-help">Move with A/D or arrows. Shoot with spacebar or hold/tap the canvas. Controls: enemy hit, player damage, achievement ding.</p>
      </div>
    </section>
  );
}

export default function FounderArcade() {
  const [hasStarted, setHasStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [toast, setToast] = useState<string | null>(null);
  const [statPops, setStatPops] = useState<StatPop[]>([]);
  const [activeMinigame, setActiveMinigame] = useState<MinigameKind | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [minigameResult, setMinigameResult] = useState<MinigameResult | null>(null);
  const [selectedFounder, setSelectedFounder] = useState<FounderPreset>(founderPresets[0]);
  const [choiceReaction, setChoiceReaction] = useState<{ text: string; effects: Partial<Record<StatKey, number>>; emotion: FounderEmotion; nextMinigame: MinigameKind | null } | null>(null);
  const [debtChallengeActive, setDebtChallengeActive] = useState(false);
  const [visibleText, setVisibleText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [missingFounderSprites, setMissingFounderSprites] = useState<Partial<Record<FounderEmotion, boolean>>>({});
  const [isMuted, setIsMuted] = useState(false);

  const currentScene = scenes[sceneIndex];
  const ending = useMemo(() => resolveEnding(stats), [stats]);
  const endingDetails = useMemo(() => getEndingDetails(ending), [ending]);
  const resultMeta = minigameResult ? getMinigameMeta(minigameResult.kind) : null;
  const stageTheme: BackgroundTheme = !hasStarted ? "title" : gameOver ? "ending" : currentScene.theme;
  const activeSpeaker = getSpeakerCharacter(currentScene?.speaker ?? "");
  const activeEmotion = choiceReaction?.emotion ?? currentScene?.emotion ?? "neutral";
  const dialogueText = debtChallengeActive ? "You are more than $10k in debt. Survive this maze and I might pretend this was content." : choiceReaction?.text ?? currentScene?.beats[beatIndex] ?? "";
  const canShowChoices = !debtChallengeActive && !choiceReaction && beatIndex >= currentScene.beats.length - 1 && !activeMinigame && !minigameResult;
  const visibleCharacter: CharacterId = debtChallengeActive ? "mrbeast" : !hasStarted || gameOver || choiceReaction ? "founder" : activeSpeaker ?? "founder";
  const visibleSpeakerName = debtChallengeActive ? "Challenge Host" : !hasStarted || gameOver || choiceReaction ? selectedFounder.name : currentScene.speaker;
  const visibleSpeakerRole = debtChallengeActive ? "Debt Challenge" : gameOver ? "Final founder status" : !hasStarted ? selectedFounder.title : currentScene.title;
  const visibleCharacterSpriteSrc = getCharacterSpriteSrc(visibleCharacter, activeEmotion);

  useEffect(() => {
    initSound();
    setIsMuted(getSoundMuted());
    return subscribeSoundMuted(setIsMuted);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!dialogueText) {
      setVisibleText("");
      setIsTyping(false);
      return;
    }

    setVisibleText("");
    setIsTyping(true);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(dialogueText.slice(0, index));
      if (index >= dialogueText.length) {
        window.clearInterval(timer);
        setIsTyping(false);
      }
    }, 18);
    return () => window.clearInterval(timer);
  }, [dialogueText]);

  const queueStatPops = (effects: Partial<Record<StatKey, number>>) => {
    const pops = (Object.entries(effects) as [StatKey, number][])
      .filter(([, value]) => value !== 0)
      .map(([key, value], index) => ({ id: Date.now() + index, key, value }));
    if (!pops.length) return;
    setStatPops(pops);
    window.setTimeout(() => setStatPops([]), 1300);
  };

  const applyEffects = (effects: Partial<Record<StatKey, number>>) => {
    setStats((previousStats) => {
      return applyStatDelta(previousStats, effects);
    });
    queueStatPops(effects);
    const entries = Object.entries(effects) as [StatKey, number][];
    if (entries.some(([key, value]) => key === "money" && value > 0)) playSoundCue("money");
    if (entries.some(([key, value]) => key === "hype" && value > 0)) playSoundCue("hype");
    if (entries.some(([key, value]) => key === "energy" && value < 0)) playSoundCue("energyLoss");
  };

  const handleChoice = (choice: Scene["choices"][number]) => {
    playSoundCue("choice");
    const nextStats = applyStatDelta(stats, choice.effects);
    const failureEnding = getFailureEnding(nextStats);
    applyEffects(choice.effects);

    if (choice.achievement) {
      playSoundCue("achievement");
      setToast(choice.achievement);
    }

    const interludeByScene: Partial<Record<number, MinigameKind>> = {
      3: "investorPong",
      4: "bugBlaster",
      5: "scopeMaze",
    };
    const nextMinigame = interludeByScene[currentScene.id];
    setChoiceReaction({
      text: choice.reaction,
      effects: choice.effects,
      emotion: choice.emotion ?? currentScene.emotion,
      nextMinigame: failureEnding ? null : nextMinigame ?? null,
    });
  };

  const advanceAfterReaction = () => {
    if (!choiceReaction) return;
    if (getFailureEnding(stats)) {
      setChoiceReaction(null);
      setGameOver(true);
      playSoundCue("gameOver");
      return;
    }
    if (choiceReaction.nextMinigame) {
      if (choiceReaction.nextMinigame === "scopeMaze" && stats.money <= -10) {
        setChoiceReaction(null);
        setDebtChallengeActive(true);
        return;
      }
      playSoundCue("minigameStart");
      setActiveMinigame(choiceReaction.nextMinigame);
      setChoiceReaction(null);
      return;
    }

    const nextSceneIndex = sceneIndex + 1;
    if (nextSceneIndex >= scenes.length) {
      setChoiceReaction(null);
      setGameOver(true);
      return;
    }
    setChoiceReaction(null);
    setSceneIndex(nextSceneIndex);
    setBeatIndex(0);
  };

  const advanceDialogue = () => {
    if (!hasStarted || gameOver || activeMinigame || minigameResult) return;
    playSoundCue("dialogue");
    if (isTyping) {
      setVisibleText(dialogueText);
      setIsTyping(false);
      return;
    }
    if (debtChallengeActive) {
      setDebtChallengeActive(false);
      playSoundCue("minigameStart");
      setActiveMinigame("scopeMaze");
      return;
    }
    if (choiceReaction) {
      advanceAfterReaction();
      return;
    }
    if (beatIndex < currentScene.beats.length - 1) {
      setBeatIndex((currentBeat) => currentBeat + 1);
    }
  };

  const handleInterludeComplete = (result: MinigameResult) => {
    applyEffects(result.effects);
    setMinigameResult(result);
    setActiveMinigame(null);
    setToast(getMinigameMeta(result.kind).complete);
    playSoundCue(isMinigameSuccess(result) ? "achievement" : "gameOver");
  };

  const handleInterludeContinue = () => {
    playSoundCue("button");
    setMinigameResult(null);
    setActiveMinigame(null);
    if (getFailureEnding(stats)) {
      setGameOver(true);
      return;
    }
    const nextSceneIndex = sceneIndex + 1;
    if (nextSceneIndex >= scenes.length) {
      setGameOver(true);
      return;
    }
    setSceneIndex(nextSceneIndex);
    setBeatIndex(0);
  };

  const resetGame = () => {
    setHasStarted(false);
    setSceneIndex(0);
    setBeatIndex(0);
    setStats(initialStats);
    setToast(null);
    setStatPops([]);
    setActiveMinigame(null);
    setGameOver(false);
    setMinigameResult(null);
    setChoiceReaction(null);
    setDebtChallengeActive(false);
    setVisibleText("");
    setIsTyping(false);
    setSelectedFounder(founderPresets[0]);
  };

  const playHoverSound = () => {
    playSoundCue("hover");
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setSoundMuted(nextMuted);
    if (!nextMuted) playSoundCue("button");
  };

  return (
    <main className="arcade-shell">
      <section className={`vn-stage scene-${stageTheme} ${gameOver ? `ending-${ending.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}`}>
        <div className="scene-backdrop" aria-hidden="true">
          <div className="scene-layer skyline-layer" />
          <div className="scene-layer monitor-layer" />
          <div className="scene-layer spotlight-layer" />
          <div className="scene-layer glitch-layer" />
          <div className="scene-layer prop-layer" />
        </div>
        <div className="vn-topbar">
          <div className="player-profile-card">
            <div className={`player-avatar ${visibleCharacter} ${visibleCharacter === "founder" ? selectedFounder.palette : ""}`}>
              {visibleCharacterSpriteSrc ? (
                <img className="avatar-founder-sprite" src={visibleCharacterSpriteSrc} alt="" />
              ) : (
                <>
                  <div className="avatar-doodle-head" />
                  <div className="avatar-doodle-body" />
                </>
              )}
            </div>
            <div className="player-profile-main">
              <div className="player-name-row">
                <span className="player-name">{visibleSpeakerName}</span>
                <span className="player-title">{visibleSpeakerRole}</span>
              </div>
              <div className="profile-bar-row">
                <span>Energy</span>
                <div className="profile-bar energy-bar"><span style={{ width: `${clampMeterStat(stats.energy)}%` }} /></div>
                <strong>{stats.energy}</strong>
              </div>
              <div className="profile-bar-row">
                <span>Hype</span>
                <div className="profile-bar hype-bar"><span style={{ width: `${clampMeterStat(stats.hype)}%` }} /></div>
                <strong>{stats.hype}</strong>
              </div>
            </div>
          </div>
          <div className="money-badge" aria-label="Money">
            <span>Money</span>
            <strong>{formatMoney(stats.money)}</strong>
          </div>
          <div className="topbar-actions">
            <button className="menu-button" onPointerEnter={playHoverSound} onClick={() => { playSoundCue("button"); resetGame(); }}>Restart</button>
          </div>
        </div>

        <div className={`character-row character-focus-${visibleCharacter}`} aria-hidden="true">
          <div className={`character-card ${visibleCharacter} is-active is-speaking`}>
            <div className={`portrait-frame ${visibleCharacter === "founder" ? `founder-emotion-${activeEmotion}` : ""}`}>
              {visibleCharacterSpriteSrc && !(visibleCharacter === "founder" && missingFounderSprites[activeEmotion]) ? (
                <img
                  className={`character-sprite ${visibleCharacter === "founder" ? "founder-sprite" : "guest-sprite"}`}
                  src={visibleCharacterSpriteSrc}
                  alt=""
                  onError={visibleCharacter === "founder" ? () => setMissingFounderSprites((missing) => ({ ...missing, [activeEmotion]: true })) : undefined}
                />
              ) : (
                <>
                  <div className="character-head" />
                  <div className="character-body" />
                </>
              )}
            </div>
            <span>{getCharacterLabel(visibleCharacter)}</span>
          </div>
        </div>

        {!hasStarted ? (
          <section className="founder-select-panel">
            <div className="founder-select-copy">
              <h2 className="title-logo">Founder Arcade</h2>
              <p className="title-subtitle">Make money. Lose energy. Survive pitch night.</p>
            </div>
            <button className="primary-button" onPointerEnter={playHoverSound} onClick={() => { playSoundCue("button"); setHasStarted(true); setBeatIndex(0); }}>Start Run</button>
          </section>
        ) : !gameOver ? (
          <>
            {canShowChoices ? (
              <div className="choice-grid">
                {currentScene.choices.map((choice) => (
                  <button key={choice.label} className="choice-button" onPointerEnter={playHoverSound} onClick={() => handleChoice(choice)}>
                    <span className="choice-main"><span className="choice-caret">›</span>{choice.label}</span>
                    <span className="choice-deltas">
                      {(Object.entries(choice.effects) as [StatKey, number][]).map(([key, value]) => (
                        <span key={key} className={value >= 0 ? "is-positive" : "is-negative"}>{formatDelta(key, value)}</span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            <section className={`dialogue-box ${choiceReaction ? "is-reaction" : ""}`} onClick={advanceDialogue}>
              <div className="speaker-tag">{debtChallengeActive ? "Challenge Host" : choiceReaction ? selectedFounder.name : currentScene.speaker}</div>
              <p className="scene-title">{debtChallengeActive ? "MrBeast Debt Challenge" : currentScene.title}</p>
              <p key={`${currentScene.id}-${beatIndex}-${choiceReaction?.text ?? ""}`} className="dialogue-text">
                {visibleText}
                {isTyping ? <span className="type-cursor" aria-hidden="true">|</span> : null}
              </p>
              <div className="dialogue-footer">
                <span>{debtChallengeActive ? "I consent to financially motivated Pac-Man." : choiceReaction ? "Continue" : beatIndex < currentScene.beats.length - 1 ? "Click to continue" : canShowChoices ? "Choose your damage" : "Continue"}</span>
                {!isTyping ? <span className="continue-caret">›</span> : null}
              </div>
              {choiceReaction ? (
                <div className="reaction-deltas">
                  {(Object.entries(choiceReaction.effects) as [StatKey, number][]).map(([key, value]) => (
                    <span key={key} className={value >= 0 ? "is-positive" : "is-negative"}>{formatDelta(key, value)}</span>
                  ))}
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <section className="dialogue-box end-card">
            <div className="speaker-tag">Ending</div>
            <h2 className="end-title">{ending}</h2>
            <p className="ending-mood">{endingDetails.mood}</p>
            <p>{endingDetails.description}</p>
            <p className="ending-diagnosis">{endingDetails.diagnosis}</p>
            <div className="ending-stats">
              <span>Money {formatMoney(stats.money)}</span>
              <span>Energy {stats.energy}</span>
              <span>Hype {stats.hype}</span>
            </div>
            <button className="primary-button" onPointerEnter={playHoverSound} onClick={() => { playSoundCue("ending"); resetGame(); }}>Play again</button>
          </section>
        )}

        {activeMinigame === "investorPong" ? <InvestorPong onComplete={handleInterludeComplete} /> : null}
        {activeMinigame === "scopeMaze" ? <ScopeCreepMaze onComplete={handleInterludeComplete} /> : null}
        {activeMinigame === "bugBlaster" ? <BugBlaster onComplete={handleInterludeComplete} /> : null}

        {minigameResult && resultMeta ? (
          <section className="result-overlay">
            <div className="result-card">
              <p className="eyebrow">{resultMeta.eyebrow}</p>
              <h2>{resultMeta.title} Results</h2>
              <div className="result-score">Score {minigameResult.score}</div>
              <div className="result-deltas">
                {(Object.entries(minigameResult.effects) as [StatKey, number][]).map(([key, value]) => (
                  <span key={key} className={value >= 0 ? "is-positive" : "is-negative"}>{formatDelta(key, value)}</span>
                ))}
              </div>
              <p>{getMinigameJoke(minigameResult)}</p>
              <button className="primary-button" onPointerEnter={playHoverSound} onClick={handleInterludeContinue}>Continue</button>
            </div>
          </section>
        ) : null}
      </section>

      <button className="sound-toggle" aria-pressed={isMuted} onPointerEnter={playHoverSound} onClick={toggleMute}>
        {isMuted ? "Sound Off" : "Sound On"}
      </button>
      {toast ? <div className="achievement-toast"><span>Achievement</span>{toast}</div> : null}
      {statPops.length ? (
        <div className="stat-pop-stack" aria-live="polite">
          {statPops.map((pop) => (
            <span key={pop.id} className={`stat-pop ${pop.value >= 0 ? "is-positive" : "is-negative"} stat-${pop.key}`}>
              {formatDelta(pop.key, pop.value)}
            </span>
          ))}
        </div>
      ) : null}
    </main>
  );
}
