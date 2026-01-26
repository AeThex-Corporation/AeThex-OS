import { useState, useEffect } from 'react';
import { Flag, RotateCcw, Trophy } from 'lucide-react';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export function Minesweeper() {
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [mineCount, setMineCount] = useState(10);
  const [flagCount, setFlagCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const ROWS = 9;
  const COLS = 9;
  const MINES = 10;

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !gameOver && !won) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver, won]);

  const initGame = () => {
    const newBoard: Cell[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );

    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newBoard[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          newBoard[r][c].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
    setGameOver(false);
    setWon(false);
    setFlagCount(0);
    setMineCount(MINES);
    setTimer(0);
    setIsRunning(false);
  };

  const revealCell = (row: number, col: number) => {
    if (gameOver || won || board[row][col].isRevealed || board[row][col].isFlagged) return;

    if (!isRunning) setIsRunning(true);

    const newBoard = [...board.map(r => [...r])];
    
    if (newBoard[row][col].isMine) {
      // Game over
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (newBoard[r][c].isMine) newBoard[r][c].isRevealed = true;
        }
      }
      setBoard(newBoard);
      setGameOver(true);
      setIsRunning(false);
      return;
    }

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
      if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return;
      
      newBoard[r][c].isRevealed = true;
      
      if (newBoard[r][c].neighborMines === 0 && !newBoard[r][c].isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(r + dr, c + dc);
          }
        }
      }
    };

    reveal(row, col);
    setBoard(newBoard);

    // Check win
    let revealedCount = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (newBoard[r][c].isRevealed) revealedCount++;
      }
    }
    if (revealedCount === ROWS * COLS - MINES) {
      setWon(true);
      setIsRunning(false);
    }
  };

  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameOver || won || board[row][col].isRevealed) return;

    if (!isRunning) setIsRunning(true);

    const newBoard = [...board.map(r => [...r])];
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setFlagCount(prev => newBoard[row][col].isFlagged ? prev + 1 : prev - 1);
  };

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed) return 'bg-slate-700 hover:bg-slate-600';
    if (cell.isMine) return 'bg-red-600';
    if (cell.neighborMines === 0) return 'bg-slate-800';
    return 'bg-slate-900';
  };

  const getNumberColor = (num: number) => {
    const colors = ['', 'text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-cyan-400', 'text-white'];
    return colors[num] || 'text-white';
  };

  return (
    <div className="h-full bg-slate-950 p-4 flex flex-col items-center justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded text-cyan-400 font-mono text-sm">
          <Flag className="w-4 h-4" />
          {mineCount - flagCount}
        </div>
        <div className="text-cyan-400 font-mono text-lg">{String(timer).padStart(3, '0')}</div>
        <button
          onClick={initGame}
          className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-cyan-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {won && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded text-green-400 font-mono text-sm">
          <Trophy className="w-4 h-4" />
          You Won! Time: {timer}s
        </div>
      )}

      {gameOver && (
        <div className="mb-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 font-mono text-sm">
          Game Over! Try Again
        </div>
      )}

      <div className="inline-grid gap-px bg-cyan-900/20 border border-cyan-500/30 rounded p-1" style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}>
        {board.map((row, r) => 
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => revealCell(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
              className={`w-7 h-7 ${getCellColor(cell)} border border-slate-600 flex items-center justify-center text-xs font-bold transition-colors active:scale-95`}
            >
              {cell.isFlagged && !cell.isRevealed && <Flag className="w-3 h-3 text-yellow-400" />}
              {cell.isRevealed && cell.isMine && '💣'}
              {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
                <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
              )}
            </button>
          ))
        )}
      </div>

      <div className="mt-3 text-white/40 text-xs text-center">
        Left click to reveal • Right click to flag
      </div>
    </div>
  );
}
