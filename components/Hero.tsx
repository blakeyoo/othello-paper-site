"use client";

import { useState, useEffect, useRef } from "react";
import {
  createGame, validMoves, step, getWinner, randomMove,
  GameState, GameConfig, Player,
} from "@/lib/othello";

const WIN_CONDITIONS = [-0.01, 0.2, 0.4, 0.6, 0.8, 1.01];
const DEFAULT_CONFIG: GameConfig = { boardSize: [8, 8], obstacles: [], winCond: 1.01 };
const CELL_PX = 22;
const BOARD_PX = CELL_PX * 8;

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
      const unique = [...new Map(group.map((p) => [`${p[0]},${p[1]}`, p])).values()];
      if (unique.every(([px, py]) => !centerSet.has(`${px},${py}`))) {
        seeds.push([x, y]);
      }
    }
  }

  const numGroups = 1 + Math.floor(Math.random() * Math.min(seeds.length, 3));
  const chosen = [...seeds].sort(() => Math.random() - 0.5).slice(0, numGroups);

  const result = new Set<string>();
  for (const [x, y] of chosen) {
    for (const [px, py] of [[x, y], [x, w - 1 - y], [h - 1 - x, y], [h - 1 - x, w - 1 - y]] as [number, number][]) {
      result.add(`${px},${py}`);
    }
  }
  return [...result].map((s) => s.split(",").map(Number) as [number, number]);
}

function randomConfig(): GameConfig {
  const k = WIN_CONDITIONS[Math.floor(Math.random() * WIN_CONDITIONS.length)];
  for (let attempt = 0; attempt < 20; attempt++) {
    const obstacles = generateObstacles(8, 8);
    const config: GameConfig = { boardSize: [8, 8], obstacles, winCond: k };
    const testGame = createGame(config);
    if (validMoves(testGame, 1).length > 0 || validMoves(testGame, -1).length > 0) {
      return config;
    }
  }
  return { boardSize: [8, 8], obstacles: [], winCond: k };
}

function BackgroundBoard() {
  const config = useRef<GameConfig>(DEFAULT_CONFIG);
  const [game, setGame] = useState<GameState>(() => createGame(DEFAULT_CONFIG));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    config.current = randomConfig();
    setGame(createGame(config.current));
    const t = setTimeout(() => setReady(true), Math.random() * 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (game.done) {
      const t = setTimeout(() => setGame(createGame(config.current)), 2200);
      return () => clearTimeout(t);
    }

    const moves = validMoves(game);
    if (moves.length === 0) {
      const opp: Player = game.currentPlayer === 1 ? -1 : 1;
      if (validMoves(game, opp).length === 0) {
        setGame((prev) => ({ ...prev, done: true }));
      } else {
        const t = setTimeout(
          () => setGame((prev) => ({ ...prev, currentPlayer: opp })),
          300,
        );
        return () => clearTimeout(t);
      }
      return;
    }

    const t = setTimeout(() => {
      const move = randomMove(game);
      if (move) setGame((prev) => step(prev, move[0], move[1]));
    }, 20 + Math.random() * 10);
    return () => clearTimeout(t);
  }, [game, ready]);

  const winner = game.done ? getWinner(game) : null;

  return (
    <div
      className="relative border border-white/5 shrink-0"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(8, ${CELL_PX}px)`,
        gridTemplateRows: `repeat(8, ${CELL_PX}px)`,
        width: BOARD_PX,
        height: BOARD_PX,
      }}
    >
      {Array.from({ length: 8 }, (_, x) =>
        Array.from({ length: 8 }, (_, y) => {
          const isBlack    = game.board[0][x][y] === 1;
          const isWhite    = game.board[1][x][y] === 1;
          const isObstacle = game.board[2][x][y] === 1;
          return (
            <div
              key={`${x}-${y}`}
              className={`flex items-center justify-center border border-black/10 ${isObstacle ? "bg-[#d8d8d8]" : "bg-green-800"}`}
              style={{ width: CELL_PX, height: CELL_PX }}
            >
              {isObstacle ? (
                <div className="bg-[#e8e8e8]" style={{ width: CELL_PX * 0.7, height: CELL_PX * 0.7 }} />
              ) : isBlack ? (
                <div className="rounded-full bg-gray-950" style={{ width: CELL_PX * 0.76, height: CELL_PX * 0.76 }} />
              ) : isWhite ? (
                <div className="rounded-full bg-white" style={{ width: CELL_PX * 0.76, height: CELL_PX * 0.76 }} />
              ) : null}
            </div>
          );
        }),
      )}
      {game.done && winner !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-400/80 backdrop-blur-[1px]">
          {winner === 0 ? (
            <div style={{ width: 65, height: 65, borderRadius: "50%", overflow: "hidden" }}>
              <svg width="65" height="65" viewBox="0 0 100 100" style={{ display: "block" }}>
                <polygon points="0,0 100,0 0,100" fill="#0a0a0a" />
                <polygon points="100,0 100,100 0,100" fill="white" />
              </svg>
            </div>
          ) : (
            <div
              className="rounded-full"
              style={{ width: 65, height: 65, backgroundColor: winner === 1 ? "#0a0a0a" : "white" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-green-950 to-green-900 text-white py-24 px-6 overflow-hidden">

      {/* Background boards */}
      <div className="absolute inset-0 overflow-hidden opacity-70">
        <div className="flex flex-wrap">
          {Array.from({ length: 50 }, (_, i) => (
            <BackgroundBoard key={i} />
          ))}
        </div>
      </div>

      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/40 to-green-900/40" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6 text-white [text-shadow:0_0_60px_rgba(0,0,0,1),0_0_30px_rgba(0,0,0,1),0_2px_4px_rgba(0,0,0,1)]">
          The Expanded Othello AI Arena
        </h1>
        <p className="text-lg sm:text-xl text-white mb-4 leading-relaxed [text-shadow:0_0_40px_rgba(0,0,0,1),0_0_16px_rgba(0,0,0,1),0_1px_3px_rgba(0,0,0,1)]">
          Evaluating Intelligent Systems Through Constrained Adaptation to Unseen Conditions
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white text-base mt-8 mb-4 [text-shadow:0_0_24px_rgba(0,0,0,1),0_1px_3px_rgba(0,0,0,1)]">
          {[
            { name: "Byunghwa Yoo",    href: "https://scholar.google.com/citations?user=XIIINK4AAAAJ&hl=en" },
            { name: "Sundong Kim",     href: "https://sundong.kim/" },
            { name: "Kyung-Joong Kim", href: "https://scholar.google.com/citations?user=YBYE93sAAAAJ&hl=en" },
          ].map(({ name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white underline underline-offset-2 decoration-slate-500 hover:decoration-white transition-colors"
            >
              {name}
            </a>
          ))}
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-4 py-1.5 text-amber-300 text-sm font-medium [text-shadow:0_0_16px_rgba(0,0,0,1)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Transactions on Machine Learning Research (TMLR) · June 2026
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://openreview.net/forum?id=WXKQtqPC2d"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-green-950 font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Read Paper
          </a>
          <a
            href="https://github.com/blakeyoo/ExpandedOthello-AEC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Environment
          </a>
        </div>
      </div>

    </section>
  );
}
