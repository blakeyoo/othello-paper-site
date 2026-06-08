import { GameState, Player, validMoves, step, getWinner } from "./othello";

function boardKey(state: GameState, move: [number, number]): string {
  return (
    state.board[0].flat().join("") +
    state.board[1].flat().join("") +
    state.currentPlayer +
    move[0] +
    "," +
    move[1]
  );
}

function ucb(
  parentTotal: number,
  wins: number,
  visits: number,
  c: number,
): number {
  if (visits === 0) return Infinity;
  return wins / visits + c * Math.sqrt(Math.log(parentTotal) / visits);
}

function rollout(state: GameState, maxDepth: number): 0 | 1 | -1 {
  let s = state;
  let depth = 0;
  while (!s.done && depth < maxDepth) {
    const moves = validMoves(s);
    if (moves.length === 0) {
      const opp: Player = s.currentPlayer === 1 ? -1 : 1;
      if (validMoves(s, opp).length === 0) break;
      s = { ...s, currentPlayer: opp };
      continue;
    }
    const move = moves[Math.floor(Math.random() * moves.length)];
    s = step(s, move[0], move[1]);
    depth++;
  }
  return getWinner(s);
}

export function mctsMove(
  state: GameState,
  player: Player,
  numSimulations = 100,
  explorationWeight = 1.4,
  rolloutDepth = 30,
): [number, number] | null {
  const moves = validMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const visits = new Map<string, number>();
  const wins   = new Map<string, number>();

  for (let sim = 0; sim < numSimulations; sim++) {
    let s = state;
    const path: string[] = [];

    // Selection + Expansion
    outer: while (true) {
      let currentMoves = validMoves(s);

      if (currentMoves.length === 0) {
        const opp: Player = s.currentPlayer === 1 ? -1 : 1;
        if (validMoves(s, opp).length === 0) break;
        s = { ...s, currentPlayer: opp };
        continue;
      }

      const parentTotal =
        1 + currentMoves.reduce((sum, m) => sum + (visits.get(boardKey(s, m)) ?? 0), 0);

      let bestMove = currentMoves[0];
      let bestScore = -Infinity;
      for (const move of currentMoves) {
        const score = ucb(
          parentTotal,
          wins.get(boardKey(s, move)) ?? 0,
          visits.get(boardKey(s, move)) ?? 0,
          explorationWeight,
        );
        if (score > bestScore) {
          bestScore = score;
          bestMove  = move;
        }
      }

      const key = boardKey(s, bestMove);
      path.push(key);
      s = step(s, bestMove[0], bestMove[1]);

      if ((visits.get(key) ?? 0) === 0) break outer;
    }

    // Rollout
    const result = rollout(s, rolloutDepth);

    // Backpropagation
    for (const key of path) {
      visits.set(key, (visits.get(key) ?? 0) + 1);
      if (result === player) {
        wins.set(key, (wins.get(key) ?? 0) + 1);
      } else if (result === 0) {
        wins.set(key, (wins.get(key) ?? 0) + 0.5);
      }
    }
  }

  // Pick move with most visits
  let bestMove = moves[0];
  let bestVisits = -1;
  for (const move of moves) {
    const v = visits.get(boardKey(state, move)) ?? 0;
    if (v > bestVisits) {
      bestVisits = v;
      bestMove   = move;
    }
  }
  return bestMove;
}
