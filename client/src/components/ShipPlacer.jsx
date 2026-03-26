import { useState, useRef, useCallback } from "react";
import Grid from "./Grid";
import { SHIPS, emptyGrid, canPlace, placeShipOnGrid, placeShipsRandomly } from "../hooks/useGameLogic";

export default function ShipPlacer({ onReady }) {
  const [grid, setGrid]             = useState(() => emptyGrid());
  const [shipQueue, setShipQueue]   = useState(() => buildQueue());
  const [horizontal, setHorizontal] = useState(true);
  const [hoverCell, setHoverCell]   = useState(null);
  const gridRef = useRef(null); // referencia al contenedor del tablero

  function buildQueue() {
    return SHIPS.flatMap(s => Array(s.count).fill(null).map(() => ({ ...s })));
  }

  const currentShip = shipQueue[0];

  function getPreviewCells(row, col) {
    if (!currentShip) return [];
    return Array(currentShip.size).fill(null).map((_, i) => [
      horizontal ? row : row + i,
      horizontal ? col + i : col,
    ]);
  }

  // Convierte coordenadas de pantalla (px) a celda del tablero [row, col]
  const getCellFromPoint = useCallback((clientX, clientY) => {
    if (!gridRef.current) return null;
    const cells = gridRef.current.querySelectorAll("[data-cell]");
    for (const cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (
        clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top  && clientY <= rect.bottom
      ) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        return [row, col];
      }
    }
    return null;
  }, []);

  // Eventos táctiles
  const handleTouchMove = useCallback((e) => {
    e.preventDefault(); // evita que la página haga scroll mientras arrastras
    const touch = e.touches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) setHoverCell(cell);
  }, [getCellFromPoint]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!cell || !currentShip) return;
    const [row, col] = cell;
    if (!canPlace(grid, row, col, currentShip.size, horizontal)) return;
    const newGrid = placeShipOnGrid(grid, row, col, currentShip.size, horizontal, currentShip.name);
    setGrid(newGrid);
    setShipQueue(q => q.slice(1));
    setHoverCell(null);
  }, [getCellFromPoint, currentShip, grid, horizontal]);

  const handlePlace = (row, col) => {
    if (!currentShip) return;
    if (!canPlace(grid, row, col, currentShip.size, horizontal)) return;
    const newGrid = placeShipOnGrid(grid, row, col, currentShip.size, horizontal, currentShip.name);
    setGrid(newGrid);
    setShipQueue(q => q.slice(1));
    setHoverCell(null);
  };

  const handleRandom = () => {
    setGrid(placeShipsRandomly());
    setShipQueue([]);
  };

  const handleReset = () => {
    setGrid(emptyGrid());
    setShipQueue(buildQueue());
    setHoverCell(null);
  };

  const previewCells = hoverCell ? getPreviewCells(hoverCell[0], hoverCell[1]) : [];
  const previewValid = hoverCell
    ? canPlace(grid, hoverCell[0], hoverCell[1], currentShip?.size, horizontal)
    : true;

  const allPlaced = shipQueue.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">

      <h1 className="text-3xl font-bold tracking-widest text-cyan-400 uppercase mb-1">
        ⚓ Hundir la Flota
      </h1>
      <p className="text-slate-500 text-sm mb-8">Coloca tu flota antes de la batalla</p>

      <div className="flex flex-col lg:flex-row gap-10 items-start">

        {/* Tablero con soporte táctil */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Tu tablero</p>

          {/* gridRef aquí para localizar celdas por coordenadas táctiles */}
          <div
            ref={gridRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "none" }}
          >
             <Grid
                grid={grid}
                shots={emptyGrid()}
                isEnemy={false}
                active={false}
                preview={currentShip ? {
                cells: previewCells,
                valid: previewValid,
                onPlace: handlePlace,
                onHover: (r, c) => setHoverCell([r, c]),
                onHoverLeave: () => setHoverCell(null),
                } : null}
            />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="flex flex-col gap-5 min-w-56">

          {currentShip ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Colocando</p>
              <p className="text-cyan-300 font-bold text-lg">{currentShip.name}</p>
              <div className="flex gap-1 mt-2 mb-4">
                {Array(currentShip.size).fill(null).map((_, i) => (
                  <div key={i} className="w-7 h-7 bg-blue-700 rounded-sm border border-blue-500" />
                ))}
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Orientación</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHorizontal(true)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors
                    ${horizontal
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "bg-transparent border-slate-600 text-slate-400 hover:border-slate-400"
                    }`}
                >
                  ↔ Horizontal
                </button>
                <button
                  onClick={() => setHorizontal(false)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors
                    ${!horizontal
                      ? "bg-cyan-600 border-cyan-500 text-white"
                      : "bg-transparent border-slate-600 text-slate-400 hover:border-slate-400"
                    }`}
                >
                  ↕ Vertical
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-950 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400 font-bold text-lg">✓ Flota lista</p>
              <p className="text-green-600 text-sm mt-1">Todos los barcos colocados</p>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Flota</p>
            <div className="flex flex-col gap-2">
              {SHIPS.flatMap(s =>
                Array(s.count).fill(null).map((_, i) => {
                  const index = SHIPS.slice(0, SHIPS.indexOf(s)).reduce((a, x) => a + x.count, 0) + i;
                  const placed = index >= (SHIPS.reduce((a, x) => a + x.count, 0) - shipQueue.length);
                  return (
                    <div key={`${s.name}-${i}`} className={`flex items-center gap-2 text-sm transition-opacity ${placed ? "opacity-30" : "opacity-100"}`}>
                      <div className="flex gap-0.5">
                        {Array(s.size).fill(null).map((_, j) => (
                          <div key={j} className={`w-4 h-4 rounded-sm border ${placed ? "bg-slate-700 border-slate-600" : "bg-blue-700 border-blue-500"}`} />
                        ))}
                      </div>
                      <span className={placed ? "text-slate-600 line-through" : "text-slate-300"}>{s.name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleRandom}
              className="w-full py-2 rounded-md border border-slate-600 text-slate-400 text-sm hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              🎲 Colocación aleatoria
            </button>
            <button
              onClick={handleReset}
              className="w-full py-2 rounded-md border border-slate-700 text-slate-500 text-sm hover:border-slate-500 hover:text-slate-300 transition-colors"
            >
              ↺ Reiniciar
            </button>
          </div>

          {allPlaced && (
            <button
              onClick={() => onReady(grid)}
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest uppercase text-sm transition-colors"
            >
              ⚔️ ¡Empezar batalla!
            </button>
          )}
        </div>
      </div>

      {currentShip && (
        <p className="mt-8 text-xs text-slate-600 text-center">
          Toca y arrastra para previsualizar · Suelta para colocar · Toca para colocar directo
        </p>
      )}
    </div>
  );
}