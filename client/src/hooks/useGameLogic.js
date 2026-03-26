import { useState, useEffect } from "react";

const GRID_SIZE = 10;
export const SHIPS = [
  { name: "Portaaviones", size: 4, count: 1 },
  { name: "Acorazado",    size: 3, count: 2 },
  { name: "Destructor",   size: 2, count: 3 },
  { name: "Submarino",    size: 1, count: 4 },
];

export function emptyGrid() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

export function canPlace(grid, row, col, size, horizontal) {
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r >= GRID_SIZE || c >= GRID_SIZE) return false;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc])
          return false;
      }
  }
  return true;
}

export function placeShipOnGrid(grid, row, col, size, horizontal, name) {
  const newGrid = grid.map(r => [...r]);
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    newGrid[r][c] = name;
  }
  return newGrid;
}

export function placeShipsRandomly() {
  let grid = emptyGrid();
  for (const ship of SHIPS) {
    for (let c = 0; c < ship.count; c++) {
      let placed = false;
      while (!placed) {
        const h = Math.random() > 0.5;
        const r = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        if (canPlace(grid, r, col, ship.size, h)) {
          grid = placeShipOnGrid(grid, r, col, ship.size, h, ship.name);
          placed = true;
        }
      }
    }
  }
  return grid;
}

export const TOTAL_CELLS = SHIPS.reduce((a, s) => a + s.size * s.count, 0);

function countHits(grid, shots) {
  let h = 0;
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] && shots[r][c] === "hit") h++;
  return h;
}

function aiMove(shots, queue) {
  let cands = [];
  if (queue.length > 0) {
    const [hr, hc] = queue[0];
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = hr+dr, nc = hc+dc;
      if (nr>=0 && nr<GRID_SIZE && nc>=0 && nc<GRID_SIZE && !shots[nr][nc])
        cands.push([nr, nc]);
    }
  }
  if (!cands.length)
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (!shots[r][c]) cands.push([r, c]);
  return cands[Math.floor(Math.random() * cands.length)];
}

// Añadimos addResult como parámetro
export function useGameLogic(playerGrid, addResult) {
  const [enemyGrid]   = useState(() => placeShipsRandomly());
  const [playerShots, setPlayerShots] = useState(() => emptyGrid());
  const [enemyShots,  setEnemyShots]  = useState(() => emptyGrid());
  const [turn,   setTurn]   = useState("player");
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState("¡Tu turno! Dispara en el tablero enemigo.");
  const [queue,  setQueue]  = useState([]);

  const playerHits = countHits(enemyGrid, playerShots);
  const enemyHits  = countHits(playerGrid, enemyShots);

  const shoot = (row, col) => {
    if (turn !== "player" || status !== "playing" || playerShots[row][col]) return;
    const ns = playerShots.map(r => [...r]);
    const hit = !!enemyGrid[row][col];
    ns[row][col] = hit ? "hit" : "miss";
    setPlayerShots(ns);
    if (countHits(enemyGrid, ns) === TOTAL_CELLS) {
      setStatus("won");
      setMessage("🎉 ¡Ganaste! Flota enemiga hundida.");
      addResult("won");
      return;
    }
    if (hit) setMessage("💥 ¡Impacto! Vuelves a disparar.");
    else { setMessage("💦 Agua. Turno del enemigo..."); setTurn("enemy"); }
  };

  useEffect(() => {
    if (turn !== "enemy" || status !== "playing") return;
    const t = setTimeout(() => {
      const [r, c] = aiMove(enemyShots, queue);
      const ns = enemyShots.map(row => [...row]);
      const hit = !!playerGrid[r][c];
      ns[r][c] = hit ? "hit" : "miss";
      setEnemyShots(ns);
      const newQ = hit ? [...queue, [r, c]] : queue.slice(1);
      setQueue(newQ);
      if (countHits(playerGrid, ns) === TOTAL_CELLS) {
        setStatus("lost");
        setMessage("💀 El enemigo hundió tu flota. ¡Perdiste!");
        addResult("lost");
        return;
      }
      if (hit) setMessage(`💥 Impacto enemigo en (${String.fromCharCode(65+c)}${r+1})! Sigue...`);
      else { setMessage("💦 El enemigo falló. ¡Tu turno!"); setTurn("player"); }
    }, 900);
    return () => clearTimeout(t);
  }, [turn, status, enemyShots, playerGrid, queue]);

  return { enemyGrid, playerShots, enemyShots, turn, status, message, playerHits, enemyHits, shoot };
}