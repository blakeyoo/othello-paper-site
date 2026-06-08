"use client";

import { useState, useEffect, useCallback } from "react";
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
  medium: [-0.01, 0.0, 1.0, 1.01],
  hard:   [-0.01, 0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.01],
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

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default function OthelloDemo() {
  const [difficulty, setDifficulty]         = useState<Difficulty>("easy");
  const [opponentDiff, setOpponentDiff]     = useState<OpponentDifficulty>("easy");
  const [game, setGame]                 = useState<GameState>(() => createGame(DEFAULT_CONFIG));
  const [currentConfig, setCurrentConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [currentK, setCurrentK]         = useState<number>(1.01);
  const [conditionRevealed, setConditionRevealed] = useState(false);
  const [retryCount, setRetryCount]     = useState(0);
  const [aiThinking, setAiThinking]     = useState(false);
  const [hovered, setHovered]           = useState<[number, number] | null>(null);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { config, k } = randomEnv(diff);
    setCurrentConfig(config);
    setCurrentK(k);
    setConditionRevealed(false);
    setRetryCount(0);
    setAiThinking(false);
    setGame(createGame(config));
  }, []);

  const retry = useCallback(() => {
    setConditionRevealed(false);
    setRetryCount((n) => n + 1);
    setAiThinking(false);
    setGame(createGame(currentConfig));
  }, [currentConfig]);

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
  const cellPx     = Math.min(52, Math.floor(400 / Math.max(game.h, game.w)));

  return (
    <section id="demo" className="bg-slate-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900">
          Interactive Demo
        </h2>
        <p className="text-gray-500 text-center text-sm mb-12 max-w-xl mx-auto">
          How many trials do you need to figure out the winning strategy?
        </p>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Board — fixed-size wrapper prevents layout shift between board sizes */}
          <div className="flex items-center justify-center shrink-0" style={{ width: 416, height: 416 }}>
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
          <div className="flex flex-col gap-5 w-56">
            {/* Trial counter — always visible */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trial</span>
              <span className="text-lg font-bold text-indigo-600">{retryCount + 1}</span>
            </div>

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

            {/* End-of-game card */}
            {game.done && (() => {
              const resultText =
                winner === 1 ? "You win!" : winner === -1 ? "AI wins." : "Draw.";
              const resultColor =
                winner === 1 ? "text-emerald-600" : winner === -1 ? "text-red-500" : "text-gray-500";
              const { label, detail } = describeK(currentK);
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm space-y-3">
                  <p className={`text-xl font-bold ${resultColor}`}>{resultText}</p>

                  {conditionRevealed ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                        Winning condition
                      </p>
                      <p className="text-sm font-semibold text-indigo-600 mb-0.5">{label}</p>
                      <p className="text-xs text-gray-500">{detail}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConditionRevealed(true)}
                      className="w-full border border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      Reveal Winning Condition?
                    </button>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={retry}
                      disabled={conditionRevealed}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => startNewGame(difficulty)}
                      className="flex-1 bg-red-500 hover:bg-red-400 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      New Game
                    </button>
                  </div>
                </div>
              );
            })()}

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

            {/* Retry / New Game buttons during active game */}
            {!game.done && (
              <div className="flex gap-2">
                <button
                  onClick={retry}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => startNewGame(difficulty)}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  New Game
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
