export type Player = 1 | -1;

export interface GameConfig {
  boardSize: [number, number];
  obstacles: [number, number][];
  winCond: number;
}

export interface GameState {
  board: number[][][]; // [3][row][col]: 0=black, 1=white, 2=obstacle
  h: number;
  w: number;
  currentPlayer: Player;
  turn: number;
  winCond: number;
  done: boolean;
}

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function inBounds(h: number, w: number, x: number, y: number): boolean {
  return x >= 0 && x < h && y >= 0 && y < w;
}

export function createGame(config: GameConfig): GameState {
  const [h, w] = config.boardSize;
  const board: number[][][] = [
    Array.from({ length: h }, () => new Array(w).fill(0)),
    Array.from({ length: h }, () => new Array(w).fill(0)),
    Array.from({ length: h }, () => new Array(w).fill(0)),
  ];

  for (const [x, y] of config.obstacles) {
    if (inBounds(h, w, x, y)) board[2][x][y] = 1;
  }

  const cx = Math.floor(h / 2) - 1;
  const cy = Math.floor(w / 2) - 1;
  const init: [[number, number], Player][] = [
    [[0, 0], 1], [[1, 1], 1], [[0, 1], -1], [[1, 0], -1],
  ];
  for (const [[dx, dy], color] of init) {
    const x = cx + dx, y = cy + dy;
    if (inBounds(h, w, x, y) && board[2][x][y] === 0) {
      board[color === 1 ? 0 : 1][x][y] = 1;
    }
  }

  return { board, h, w, currentPlayer: 1, turn: 0, winCond: config.winCond, done: false };
}

function getPlanes(state: GameState, player: Player): [number[][], number[][]] {
  return player === 1
    ? [state.board[0], state.board[1]]
    : [state.board[1], state.board[0]];
}

export function isValidMove(state: GameState, x: number, y: number, player?: Player): boolean {
  const p = player ?? state.currentPlayer;
  const { h, w, board } = state;
  if (!inBounds(h, w, x, y)) return false;
  if (board[0][x][y] || board[1][x][y] || board[2][x][y]) return false;

  const [my, opp] = getPlanes(state, p);
  for (const [dx, dy] of DIRS) {
    let nx = x + dx, ny = y + dy;
    let found = false;
    while (inBounds(h, w, nx, ny) && opp[nx][ny]) {
      nx += dx; ny += dy; found = true;
    }
    if (found && inBounds(h, w, nx, ny) && my[nx][ny]) return true;
  }
  return false;
}

export function validMoves(state: GameState, player?: Player): [number, number][] {
  const p = player ?? state.currentPlayer;
  const moves: [number, number][] = [];
  for (let x = 0; x < state.h; x++)
    for (let y = 0; y < state.w; y++)
      if (isValidMove(state, x, y, p)) moves.push([x, y]);
  return moves;
}

export function step(state: GameState, x: number, y: number): GameState {
  const newBoard = state.board.map(ch => ch.map(row => [...row]));
  const newState: GameState = { ...state, board: newBoard };

  const [my, opp] = getPlanes(newState, newState.currentPlayer);
  my[x][y] = 1;

  for (const [dx, dy] of DIRS) {
    let nx = x + dx, ny = y + dy;
    const flips: [number, number][] = [];
    while (inBounds(newState.h, newState.w, nx, ny) && opp[nx][ny]) {
      flips.push([nx, ny]);
      nx += dx; ny += dy;
    }
    if (flips.length && inBounds(newState.h, newState.w, nx, ny) && my[nx][ny]) {
      for (const [fx, fy] of flips) {
        opp[fx][fy] = 0;
        my[fx][fy] = 1;
      }
    }
  }

  const next: Player = newState.currentPlayer === 1 ? -1 : 1;
  newState.currentPlayer = next;
  newState.turn = state.turn + 1;
  newState.done =
    validMoves(newState, 1).length === 0 && validMoves(newState, -1).length === 0;

  return newState;
}

export function getWinner(state: GameState): 0 | 1 | -1 {
  const black = state.board[0].flat().reduce((a, b) => a + b, 0);
  const white = state.board[1].flat().reduce((a, b) => a + b, 0);
  const total = black + white;
  const k = state.winCond;

  if (total === 0 || k === 0.5) return 0;

  let winner: 0 | 1 | -1;
  if (k > 0.5) {
    winner = black > white ? 1 : white > black ? -1 : 0;
  } else {
    winner = black < white ? 1 : white < black ? -1 : 0;
  }

  if (winner === 0) return 0;

  const winCount = winner === 1 ? black : white;
  const ratio = winCount / total;

  if (ratio === 0.5 || (k > 0.5 && ratio >= k) || (k < 0.5 && ratio <= k)) return 0;
  return winner;
}

export function getScores(state: GameState): { black: number; white: number } {
  return {
    black: state.board[0].flat().reduce((a, b) => a + b, 0),
    white: state.board[1].flat().reduce((a, b) => a + b, 0),
  };
}

export function randomMove(state: GameState): [number, number] | null {
  const moves = validMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}
