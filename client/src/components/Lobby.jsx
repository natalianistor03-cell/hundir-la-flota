import { useState } from "react";

export default function Lobby({ onJoin, error, connected }) {
  const [input, setInput] = useState("");

  const handleJoin = () => onJoin(input);

  // Genera un código aleatorio de 4 letras para crear sala
  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setInput(code);
    onJoin(code);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">

      {/* Título */}
      <h1 className="text-4xl font-bold tracking-widest text-cyan-400 uppercase mb-2">
        ⚓ Hundir la Flota
      </h1>
      <p className="text-slate-500 text-sm mb-12">Multijugador en tiempo real</p>

      {/* Estado de conexión */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
        <span className="text-xs text-slate-500">
          {connected ? "Conectado al servidor" : "Conectando..."}
        </span>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Crear sala */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Nueva partida</p>
          <p className="text-slate-400 text-sm mb-4">
            Crea una sala y comparte el código con tu rival.
          </p>
          <button
            onClick={handleCreate}
            disabled={!connected}
            className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40
                       disabled:cursor-not-allowed text-white font-bold tracking-widest uppercase
                       text-sm transition-colors"
          >
            🎲 Crear sala
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">o</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Unirse a sala existente */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Unirse a partida</p>
          <p className="text-slate-400 text-sm mb-4">
            Introduce el código que te pasó tu rival.
          </p>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            maxLength={6}
            placeholder="Código de sala"
            className="w-full bg-slate-800 border border-slate-600 rounded-md px-4 py-2
                       text-slate-100 placeholder-slate-600 text-center tracking-widest
                       uppercase font-mono text-lg mb-3 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleJoin}
            disabled={!connected || !input.trim()}
            className="w-full py-3 rounded-lg border border-slate-600 hover:border-cyan-500
                       disabled:opacity-40 disabled:cursor-not-allowed text-slate-300
                       hover:text-cyan-400 font-bold tracking-widest uppercase text-sm transition-colors"
          >
            🚀 Unirse
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

      </div>

      <p className="mt-12 text-xs text-slate-700 text-center">
        También puedes jugar contra la IA — reinicia sin código de sala
      </p>
    </div>
  );
}