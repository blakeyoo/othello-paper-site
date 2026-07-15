"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GameState, GameConfig, Player,
  createGame, validMoves, isValidMove, step,
  getWinner, getScores, randomMove,
} from "@/lib/othello";
import { mctsMove } from "@/lib/mcts";

// ── Random environment generation ─────────────────────────────────────────────

type Difficulty = "easy" | "medium" | "hard";

const BOARD_SIZES_SQUARE: [number, number][] = [[6, 6], [8, 8], [10, 10]];
const BOARD_SIZES_ALL: [number, number][]    = [[6, 6], [8, 8], [10, 10], [6, 8], [8, 6]];

const K_BY_DIFFICULTY: Record<Difficulty, number[]> = {
  easy:   [-0.01, 1.01],
  medium: [-0.01, 0.2, 0.8, 1.01],
  hard:   [-0.01, 0.2, 0.4, 0.6, 0.8, 1.01],
};

function generateObstacles(h: number, w: number): [number, number][] {
  const cx = Math.floor(h / 2) - 1;
  const cy = Math.floor(w / 2) - 1;
  const centerSet = new Set([
    `${cx},${cy}`, `${cx},${cy + 1}`,
    `${cx + 1},${cy}`, `${cx + 1},${cy + 1}`,
  ]);

  const seeds: [number, number][] = [];
  for (let x = 0; x < Math.floor(h / 2); x++) {
    for (let y = 0; y < Math.floor(w / 2); y++) {
      const group: [number, number][] = [
        [x, y], [x, w - 1 - y], [h - 1 - x, y], [h - 1 - x, w - 1 - y],
      ];
      const unique = [
        ...new Map(group.map((p) => [`${p[0]},${p[1]}`, p])).values(),
      ];
      if (unique.every(([px, py]) => !centerSet.has(`${px},${py}`))) {
        seeds.push([x, y]);
      }
    }
  }

  const numGroups = 1 + Math.floor(Math.random() * Math.min(seeds.length, 3));
  const chosen = [...seeds].sort(() => Math.random() - 0.5).slice(0, numGroups);

  const result = new Set<string>();
  for (const [x, y] of chosen) {
    for (const [px, py] of [
      [x, y], [x, w - 1 - y], [h - 1 - x, y], [h - 1 - x, w - 1 - y],
    ] as [number, number][]) {
      result.add(`${px},${py}`);
    }
  }
  return [...result].map((s) => s.split(",").map(Number) as [number, number]);
}

function randomEnv(difficulty: Difficulty): { config: GameConfig; k: number } {
  const pool = difficulty === "easy" ? [[8, 8]] : difficulty === "medium" ? BOARD_SIZES_SQUARE : BOARD_SIZES_ALL;
  const boardSize = pool[Math.floor(Math.random() * pool.length)] as [number, number];
  const kPool = K_BY_DIFFICULTY[difficulty];
  const k = kPool[Math.floor(Math.random() * kPool.length)];

  if (difficulty === "easy") {
    return { config: { boardSize, obstacles: [], winCond: k }, k };
  }

  // Retry until the initial position has at least one valid move
  for (let attempt = 0; attempt < 20; attempt++) {
    const obstacles = generateObstacles(boardSize[0], boardSize[1]);
    const config: GameConfig = { boardSize, obstacles, winCond: k };
    const testGame = createGame(config);
    if (validMoves(testGame, 1).length > 0 || validMoves(testGame, -1).length > 0) {
      return { config, k };
    }
  }
  // Fallback: no obstacles
  return { config: { boardSize, obstacles: [], winCond: k }, k };
}

type Zone = { lo: number; hi: number; type: "win" | "lose" | "draw" };

function getZones(k: number): Zone[] {
  if (k <= 0) return [
    { lo: 0,  hi: 50,  type: "win"  },
    { lo: 50, hi: 100, type: "lose" },
  ];
  if (k >= 1) return [
    { lo: 0,  hi: 50,  type: "lose" },
    { lo: 50, hi: 100, type: "win"  },
  ];
  const pct = Math.round(k * 100);
  if (k > 0.5) return [
    { lo: 0,         hi: 100 - pct, type: "draw" },
    { lo: 100 - pct, hi: 50,        type: "lose" },
    { lo: 50,        hi: pct,       type: "win"  },
    { lo: pct,       hi: 100,       type: "draw" },
  ];
  return [
    { lo: 0,         hi: pct,       type: "draw" },
    { lo: pct,       hi: 50,        type: "win"  },
    { lo: 50,        hi: 100 - pct, type: "lose" },
    { lo: 100 - pct, hi: 100,       type: "draw" },
  ];
}

const ZONE_COLOR: Record<Zone["type"], string> = {
  win:  "bg-emerald-500",
  lose: "bg-red-400",
  draw: "bg-gray-300",
};

function describeK(k: number): { label: string; detail: string } {
  if (k < 0)
    return {
      label: "Pure Minority Win",
      detail: "The player with fewer discs wins. No restrictions.",
    };
  if (k === 0)
    return {
      label: "Minority Win (no wipeout)",
      detail: "The player with fewer discs wins, but having zero discs = draw.",
    };
  if (k === 1.01)
    return {
      label: "Standard Majority Win",
      detail: "The player with more discs wins. No restrictions.",
    };
  if (k === 1.0)
    return {
      label: "Majority Win (no sweep)",
      detail: "The player with more discs wins, but having all discs = draw.",
    };
  if (k > 0.5)
    return {
      label: `Majority Win (50–${Math.round(k * 100)}%)`,
      detail: `Majority wins, but having ${Math.round(k * 100)}% or more = draw.`,
    };
  return {
    label: `Minority Win (${Math.round(k * 100)}–50%)`,
    detail: `Minority wins, but having ${Math.round(k * 100)}% or less = draw.`,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

type OpponentDifficulty = "easy" | "hard";

const DEFAULT_CONFIG: GameConfig = { boardSize: [8, 8], obstacles: [], winCond: 1.01 };

const GUESS_K_MAP = [-0.01, 0.2, 0.4, 0.6, 0.8, 1.01];
// Handle positions on the bar (%) for each K index — symmetric around 50%
const GUESS_HANDLE_PCT = [0, 20, 40, 60, 80, 100];

function GuessBar({
  guessIndex, onGuess, blackRatio, disabled,
}: {
  guessIndex: number | null;
  onGuess: (i: number) => void;
  blackRatio?: number;
  disabled?: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const draggingHandle = useRef<"green" | "red">("green");

  const zones = guessIndex !== null ? getZones(GUESS_K_MAP[guessIndex]) : [];
  const handlePct = guessIndex !== null ? GUESS_HANDLE_PCT[guessIndex] : null;

  function getPctFromClientX(clientX: number): number {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }

  function snapIndex(pct: number): number {
    return GUESS_HANDLE_PCT.reduce((best, pos, i) =>
      Math.abs(pos - pct) < Math.abs(GUESS_HANDLE_PCT[best] - pct) ? i : best, 0);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    const pct = getPctFromClientX(e.clientX);
    const greenPct = guessIndex !== null ? GUESS_HANDLE_PCT[guessIndex] : 50;
    const redPct   = guessIndex !== null ? 100 - GUESS_HANDLE_PCT[guessIndex] : 50;
    draggingHandle.current = Math.abs(pct - greenPct) <= Math.abs(pct - redPct) ? "green" : "red";
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !dragging.current) return;
    const pct = getPctFromClientX(e.clientX);
    // For the red handle, mirror the position so the index tracks the red side
    onGuess(draggingHandle.current === "green" ? snapIndex(pct) : snapIndex(100 - pct));
  }

  function handlePointerUp() {
    dragging.current = false;
  }

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Guess The Winning Condition
      </p>

      <div
        ref={barRef}
        className={`relative h-4 select-none ${disabled ? "" : "cursor-ew-resize"}`}
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Colored zones */}
        <div className="absolute inset-0 rounded-full bg-gray-200 overflow-hidden pointer-events-none">
          {zones.map((z, i) => (
            <div
              key={i}
              className={`absolute h-full ${ZONE_COLOR[z.type]}`}
              style={{ left: `${z.lo}%`, width: `${z.hi - z.lo}%` }}
            />
          ))}
        </div>

        {/* Green zone end handle */}
        {handlePct !== null && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-md z-10 pointer-events-none flex items-center justify-center ${!disabled ? "ring-4 ring-emerald-300 animate-[pulse_0.8s_ease-in-out_infinite]" : ""}`}
            style={{ left: `${handlePct}%` }}
          >
            {!disabled && <span className="text-white text-sm font-bold leading-none select-none">↔</span>}
          </div>
        )}
        {/* Red zone end handle (symmetric) */}
        {handlePct !== null && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-red-400 border-2 border-white shadow-md z-10 pointer-events-none flex items-center justify-center ${!disabled ? "ring-4 ring-red-300 animate-[pulse_0.8s_ease-in-out_infinite]" : ""}`}
            style={{ left: `${100 - handlePct}%` }}
          >
            {!disabled && <span className="text-white text-sm font-bold leading-none select-none">↔</span>}
          </div>
        )}
        {/* Current disc ratio dot */}
        {blackRatio !== undefined && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow z-20 pointer-events-none"
            style={{ left: `${blackRatio}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Win zone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Lose zone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Draw zone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />Your Disc Ratio</span>
      </div>
    </div>
  );
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default function OthelloDemo() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [difficulty, setDifficulty]         = useState<Difficulty>("easy");
  const [opponentDiff, setOpponentDiff]     = useState<OpponentDifficulty>("easy");
  const [game, setGame]                 = useState<GameState>(() => createGame(DEFAULT_CONFIG));
  const [currentConfig, setCurrentConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [currentK, setCurrentK]         = useState<number>(1.01);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [solved, setSolved]             = useState(false);
  const [retryCount, setRetryCount]     = useState(0);
  const [aiThinking, setAiThinking]     = useState(false);
  const [hovered, setHovered]           = useState<[number, number] | null>(null);
  const [guessIndex, setGuessIndex]     = useState<number | null>(5);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { config, k } = randomEnv(diff);
    setCurrentConfig(config);
    setCurrentK(k);
    setGuessSubmitted(false);
    setSolved(false);
    setRetryCount(0);
    setAiThinking(false);
    setGuessIndex(5);
    setGame(createGame(config));
  }, []);

  const retry = useCallback(() => {
    setRetryCount((n) => n + 1);
    setAiThinking(false);
    setGuessSubmitted(false);
    setGame(createGame(currentConfig));
  }, [currentConfig]);

  const submitGuess = useCallback(() => {
    setGuessSubmitted(true);
    if (guessIndex !== null && GUESS_K_MAP[guessIndex] === currentK) {
      setSolved(true);
    }
  }, [guessIndex, currentK]);

  // Randomise on first client render (avoids SSR hydration mismatch)
  useEffect(() => { startNewGame("easy"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-pass when current player has no valid moves
  useEffect(() => {
    if (game.done) return;
    if (validMoves(game).length > 0) return;
    const opp: Player = game.currentPlayer === 1 ? -1 : 1;
    if (validMoves(game, opp).length === 0) {
      setGame((prev) => ({ ...prev, done: true }));
    } else {
      const t = setTimeout(
        () => setGame((prev) => ({ ...prev, currentPlayer: opp })),
        400,
      );
      return () => clearTimeout(t);
    }
  }, [game]);

  // AI move (white = -1)
  useEffect(() => {
    if (game.done || game.currentPlayer !== -1) return;
    if (validMoves(game).length === 0) return;
    setAiThinking(true);
    const t = setTimeout(() => {
      const move = opponentDiff === "hard"
        ? mctsMove(game, -1)
        : randomMove(game);
      if (move) setGame((prev) => step(prev, move[0], move[1]));
      setAiThinking(false);
    }, 650);
    return () => clearTimeout(t);
  }, [game]);

  function handleClick(x: number, y: number) {
    if (game.done || game.currentPlayer !== 1 || aiThinking) return;
    if (!isValidMove(game, x, y)) return;
    setGame((prev) => step(prev, x, y));
  }

  const validSet   = new Set(validMoves(game).map(([x, y]) => `${x},${y}`));
  const scores     = getScores(game);
  const winner     = game.done ? getWinner(game) : null;
  const isHumanTurn = !game.done && game.currentPlayer === 1 && !aiThinking;
  const total      = scores.black + scores.white;
  const blackPct   = total > 0 ? ((scores.black / total) * 100).toFixed(1) : "—";
  const whitePct   = total > 0 ? ((scores.white / total) * 100).toFixed(1) : "—";
  const blackRatio = total > 0 ? (scores.black / total) * 100 : 50;
  const cellPx     = Math.min(52, Math.floor(400 / Math.max(game.h, game.w)));

  return (
    <section id="demo" className="bg-white py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {showOnboarding ? (
          <div className="flex flex-col items-center justify-center min-h-80 py-16 text-center space-y-6">
            <div className="text-6xl font-black tracking-tight text-slate-300 select-none">???</div>
            <div className="space-y-4 max-w-xl">
              <p className="text-2xl font-bold text-gray-900 leading-snug">
                You don&apos;t know how to win.
              </p>
              <p className="text-xl font-bold text-gray-900 whitespace-nowrap">
                How many games will you need to figure out how to win?
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                The winning condition is hidden — this isn&apos;t standard Othello.
                No hints. Just play and figure it out.
              </p>
            </div>
            <button
              onClick={() => setShowOnboarding(false)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Accept the Challenge →
            </button>
          </div>
        ) : (
        <>
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">
          Interactive Demo
        </h2>
        <p className="text-gray-500 text-center text-sm mb-12 max-w-xl mx-auto">
          How many trials do you need to figure out the winning strategy?
        </p>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Board — fixed-size wrapper prevents layout shift between board sizes */}
          <div className="relative flex items-center justify-center shrink-0" style={{ width: 416, height: 416 }}>
          {game.done && (() => {
            const resultText  = winner === 1 ? "You Win!" : winner === -1 ? "You Lose!" : "Draw!";
            const resultColor = winner === 1 ? "text-emerald-500" : winner === -1 ? "text-red-500" : "text-gray-500";
            const isMinority = currentK < 0.5;
            const isFirstTrial = retryCount === 0;
            const isEqualDraw = winner === 0 && scores.black === scores.white;
            const subText =
              solved
                ? "Can you win again? Did you find the optimal strategy?"
                : winner === -1 && isFirstTrial && isMinority
                ? "Not a Bug — This is NOT the typical Othello you know."
                : winner === -1 && isFirstTrial && !isMinority
                ? "Can you beat the AI in the next round?"
                : winner === 1 && isFirstTrial && !isMinority
                ? "Can you win again? This game may have SPECIAL rules."
                : winner === 1 && isFirstTrial && isMinority
                ? "Not a Bug — This is NOT the typical Othello you know."
                : isFirstTrial && isEqualDraw
                ? "Hmph. Same number of discs..."
                : isFirstTrial
                ? "You are in the SPECIAL draw zone. Can you figure that out by yourself?"
                : winner === 1 || winner === -1
                ? `You tried ${retryCount + 1} times — Can you guess the winning condition?`
                : isEqualDraw
                ? `You tried ${retryCount + 1} times — Same number of discs.`
                : `You tried ${retryCount + 1} times — You are on the special draw zone.`;
            const isGuessCorrect = guessIndex !== null && GUESS_K_MAP[guessIndex] === currentK;
            return (
              <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded gap-3 px-8 text-center ${guessSubmitted ? "bg-white/80" : "bg-white/95"}`}>
                <p className={`text-4xl font-black ${resultColor}`}>{resultText}</p>
                <p className="text-sm text-gray-500">
                  {subText.split(/(SPECIAL)/g).map((part, i) =>
                    part === "SPECIAL"
                      ? <span key={i} className="font-bold text-indigo-600">{part}</span>
                      : part
                  )}
                </p>
                <div className="w-full mt-1">
                  <GuessBar
                    guessIndex={guessIndex}
                    onGuess={setGuessIndex}
                    disabled={guessSubmitted || solved}
                    blackRatio={blackRatio}
                  />
                </div>
                {solved && (
                  <p className="relative z-40 text-sm font-semibold text-indigo-600">
                    {describeK(currentK).label}
                  </p>
                )}
                {!guessSubmitted && !solved ? (
                  <button
                    onClick={submitGuess}
                    className="relative z-40 mt-2 px-10 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
                  >
                    Submit Guess
                  </button>
                ) : (
                  <>
                    <button
                      onClick={retry}
                      className="relative z-40 mt-2 px-10 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors text-sm"
                    >
                      Try Again →
                    </button>
                    <button
                      onClick={() => startNewGame(difficulty)}
                      className={
                        solved
                          ? "relative z-40 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors text-sm"
                          : "relative z-40 text-gray-400 hover:text-gray-600 text-sm transition-colors"
                      }
                    >
                      New Game
                    </button>
                  </>
                )}
                {guessSubmitted && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 rounded">
                    <p className={`text-2xl font-black ${isGuessCorrect ? "text-emerald-500" : "text-red-500"}`}>
                      {isGuessCorrect ? "✓ Correct!" : "✗ Wrong! Try Again?"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
          <div
            className="border-2 border-gray-700 shadow-lg"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${game.w}, ${cellPx}px)`,
              gridTemplateRows: `repeat(${game.h}, ${cellPx}px)`,
              width: cellPx * game.w,
              height: cellPx * game.h,
            }}
          >
            {Array.from({ length: game.h }, (_, x) =>
              Array.from({ length: game.w }, (_, y) => {
                const isBlack    = game.board[0][x][y] === 1;
                const isWhite    = game.board[1][x][y] === 1;
                const isObstacle = game.board[2][x][y] === 1;
                const isValid    = validSet.has(`${x},${y}`);
                const isHov      = hovered?.[0] === x && hovered?.[1] === y;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={[
                      "flex items-center justify-center border border-black/20 transition-colors",
                      isObstacle
                        ? "bg-gray-500"
                        : isHov && isValid && isHumanTurn
                        ? "bg-green-500"
                        : "bg-green-700",
                      isValid && isHumanTurn ? "cursor-pointer" : "",
                    ].join(" ")}
                    style={{ width: cellPx, height: cellPx }}
                    onClick={() => handleClick(x, y)}
                    onMouseEnter={() => setHovered([x, y])}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {isObstacle ? (
                      <div className="rounded bg-gray-600" style={{ width: cellPx * 0.7, height: cellPx * 0.7 }} />
                    ) : isBlack ? (
                      <div className="rounded-full bg-gray-950 shadow-inner" style={{ width: cellPx * 0.78, height: cellPx * 0.78 }} />
                    ) : isWhite ? (
                      <div className="rounded-full bg-white shadow" style={{ width: cellPx * 0.78, height: cellPx * 0.78 }} />
                    ) : isValid && isHumanTurn ? (
                      <div className="rounded-full bg-white/40" style={{ width: cellPx * 0.32, height: cellPx * 0.32 }} />
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-5 w-80">
            {/* Trial counter — always visible */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Trial</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white bg-indigo-600/80 px-3 py-1 rounded-md">
                  {retryCount + 1}
                </span>
              </div>
            </div>

            {/* Winning Condition — always visible */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Win Condition</span>
              {solved ? (
                <span className="text-sm font-semibold text-indigo-600">{describeK(currentK).label}</span>
              ) : (
                <span className="text-sm font-bold text-white bg-red-500/80 px-3 py-1 rounded-md">???</span>
              )}
            </div>

            {/* Disc label */}
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Disc Count / Ratio</span>

            {/* Scores */}
            <div className="space-y-2 text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-950 inline-block shadow shrink-0" />
                <span>You (Black)</span>
                <span className="ml-auto font-semibold">{scores.black}</span>
                <span className="text-gray-400 text-xs">({blackPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-white border border-gray-300 inline-block shadow-sm shrink-0" />
                <span>AI (White)</span>
                <span className="ml-auto font-semibold">{scores.white}</span>
                <span className="text-gray-400 text-xs">({whitePct}%)</span>
              </div>
            </div>

            {/* Disc ratio bar — also shows guessed zones */}
            <div>
              <div className="relative h-2 w-full rounded-full bg-gray-200">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  {solved
                    ? getZones(currentK).map((z, i) => (
                        <div key={i} className={`absolute h-full ${ZONE_COLOR[z.type]}`}
                          style={{ left: `${z.lo}%`, width: `${z.hi - z.lo}%` }} />
                      ))
                    : (game.done || retryCount > 0) && guessIndex !== null
                    ? getZones(GUESS_K_MAP[guessIndex]).map((z, i) => (
                        <div key={i} className={`absolute h-full ${ZONE_COLOR[z.type]} opacity-50`}
                          style={{ left: `${z.lo}%`, width: `${z.hi - z.lo}%` }} />
                      ))
                    : null}
                </div>
                {/* Current disc ratio dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow z-10 transition-all duration-300"
                  style={{ left: `${blackRatio}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Turn status */}
            <div className="text-sm min-h-5">
              {!game.done && (
                aiThinking ? (
                  <span className="text-gray-400 animate-pulse">AI is thinking…</span>
                ) : game.currentPlayer === 1 ? (
                  <span className="text-gray-600">Your turn</span>
                ) : (
                  <span className="text-gray-400">AI&apos;s turn</span>
                )
              )}
            </div>

            {/* Environment Difficulty toggle */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Environment Difficulty
              </p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      startNewGame(d);
                    }}
                    className={`flex-1 py-2 transition-colors ${
                      difficulty === d
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Opponent Difficulty toggle */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Opponent Difficulty
              </p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                {(["easy", "hard"] as OpponentDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setOpponentDiff(d)}
                    className={`flex-1 py-2 transition-colors capitalize ${
                      opponentDiff === d
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
        </>
        )}
      </div>
    </section>
  );
}
