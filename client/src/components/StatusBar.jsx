import { TOTAL_CELLS } from "../hooks/useGameLogic";

function StatCard({ label, value, color }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function HistoryPanel({ history, wins, losses, onClear }) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Historial</p>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-600 hover:text-red-400 transition-colors"
          >
            borrar
          </button>
        )}
      </div>

      {/* Resumen victorias/derrotas */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-slate-800 rounded-md p-2 text-center">
          <p className="text-green-400 font-bold text-lg">{wins}</p>
          <p className="text-xs text-slate-500">victorias</p>
        </div>
        <div className="flex-1 bg-slate-800 rounded-md p-2 text-center">
          <p className="text-red-400 font-bold text-lg">{losses}</p>
          <p className="text-xs text-slate-500">derrotas</p>
        </div>
      </div>

      {/* Lista de partidas */}
      {history.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-2">Sin partidas aún</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {history.map((entry, i) => (
            <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-800 last:border-0">
              <span className={entry.result === "won" ? "text-green-400" : "text-red-400"}>
                {entry.result === "won" ? "🏆 Victoria" : "💀 Derrota"}
              </span>
              <span className="text-slate-600">{entry.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatusBar({ message, status, playerHits, enemyHits, onReset, history, wins, losses, onClearHistory }) {
  const playerAlive = TOTAL_CELLS - enemyHits;
  const enemyAlive  = TOTAL_CELLS - playerHits;

  const msgColor =
    status === "won"  ? "text-green-400" :
    status === "lost" ? "text-red-400"   :
                        "text-cyan-300";

  const borderColor =
    status === "won"  ? "border-green-700" :
    status === "lost" ? "border-red-800"   :
                        "border-slate-700";

  return (
    <div className="flex flex-col gap-4 w-full">

      <div className={`bg-slate-900 border ${borderColor} rounded-lg px-5 py-3 text-center text-sm ${msgColor}`}>
        {message}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tu flota — vivos"      value={playerAlive} color="text-cyan-400" />
        <StatCard label="Flota enemiga — vivos" value={enemyAlive}  color="text-red-400" />
        <StatCard label="Tus impactos"          value={playerHits}  color="text-green-400" />
        <StatCard label="Impactos recibidos"    value={enemyHits}   color="text-orange-400" />
      </div>

      <div className="flex gap-4 justify-center text-xs text-slate-600 font-mono">
        <span>▪ barco</span>
        <span>· agua</span>
        <span>✕ impacto</span>
      </div>

      <HistoryPanel
        history={history}
        wins={wins}
        losses={losses}
        onClear={onClearHistory}
      />

      <button
        onClick={onReset}
        className="w-full py-2 rounded-lg border border-slate-600 text-slate-400 text-sm
                   hover:border-cyan-500 hover:text-cyan-400 transition-colors tracking-widest uppercase"
      >
        ↺ Nueva partida
      </button>

      {status !== "playing" && (
        <div className={`rounded-lg py-4 text-center font-bold text-lg tracking-widest uppercase
          ${status === "won"
            ? "bg-green-950 border border-green-600 text-green-400"
            : "bg-red-950 border border-red-700 text-red-400"
          }`}
        >
          {status === "won" ? "🏆 ¡Victoria!" : "💀 Derrota"}
        </div>
      )}

    </div>
  );
}