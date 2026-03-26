import { useState } from "react";
import Lobby from "./components/Lobby";
import ShipPlacer from "./components/ShipPlacer";
import Grid from "./components/Grid";
import StatusBar from "./components/StatusBar";
import { useGameLogic, emptyGrid } from "./hooks/useGameLogic";
import { useHistory } from "./hooks/useHistory";
import { useSocket } from "./hooks/useSocket";

// ─── Modo IA ────────────────────────────────────────────────────────────────
function BattleVsAI({ playerGrid, onReset }) {
  const { history, addResult, clearHistory, wins, losses } = useHistory();
  const {
    enemyGrid, playerShots, enemyShots,
    turn, status, message, playerHits, enemyHits, shoot,
  } = useGameLogic(playerGrid, addResult);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold tracking-widest text-cyan-400 uppercase mb-1">
        ⚓ Hundir la Flota
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        {turn === "player" ? "Tu turno — dispara en el tablero enemigo" : "La IA está apuntando..."}
      </p>

      <div className="flex flex-col xl:flex-row gap-10 items-start justify-center w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-10">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Tu flota</p>
            <Grid grid={playerGrid} shots={enemyShots} isEnemy={false} active={false} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Flota enemiga</p>
            <Grid
              grid={enemyGrid}
              shots={playerShots}
              isEnemy={true}
              onShoot={shoot}
              active={turn === "player" && status === "playing"}
            />
          </div>
        </div>

        <div className="w-full xl:w-64 shrink-0">
          <StatusBar
            message={message}
            status={status}
            playerHits={playerHits}
            enemyHits={enemyHits}
            onReset={onReset}
            history={history}
            wins={wins}
            losses={losses}
            onClearHistory={clearHistory}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Modo Multijugador ───────────────────────────────────────────────────────
function BattleVsPlayer({ playerGrid, socket }) {
  const { myShots, opponentShots, myTurn, phase, winner, opponentLeft, sendShot, roomId } = socket;

  const myHits       = myShots.flat().filter(c => c === "hit").length;
  const opponentHits = opponentShots.flat().filter(c => c === "hit").length;

  const message =
    opponentLeft          ? "💀 Tu rival abandonó la partida." :
    winner === "me"       ? "🎉 ¡Ganaste! Flota enemiga hundida." :
    winner === "opponent" ? "💀 El rival hundió tu flota. ¡Perdiste!" :
    myTurn                ? "⚔️ Tu turno — dispara en el tablero enemigo." :
                            "⏳ Esperando disparo del rival...";

  const status =
    winner === "me"       ? "won"  :
    winner === "opponent" ? "lost" :
    opponentLeft          ? "lost" : "playing";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold tracking-widest text-cyan-400 uppercase mb-1">
        ⚓ Hundir la Flota
      </h1>

      {/* Código de sala */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 uppercase tracking-widest">Sala</span>
        <span className="font-mono text-cyan-400 font-bold tracking-widest">{roomId}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-10 items-start justify-center w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row gap-10">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Tu flota</p>
            <Grid grid={playerGrid} shots={opponentShots} isEnemy={false} active={false} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Flota rival</p>
          <Grid
            grid={winner || opponentLeft ? socket.enemyGrid : emptyGrid()}
            shots={myShots}
            isEnemy={true}
            onShoot={(r, c) => sendShot(r, c)}
            active={myTurn && status === "playing"}
          />

          </div>
        </div>

        <div className="w-full xl:w-64 shrink-0">
          <StatusBar
            message={message}
            status={status}
            playerHits={myHits}
            enemyHits={opponentHits}
            onReset={() => window.location.reload()}
            history={[]}
            wins={0}
            losses={0}
            onClearHistory={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla de espera ──────────────────────────────────────────────────────
function WaitingRoom({ roomId, role }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold tracking-widest text-cyan-400 uppercase mb-8">
        ⚓ Hundir la Flota
      </h1>
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center max-w-sm w-full">
        {role === "host" ? (
          <>
            <p className="text-slate-400 text-sm mb-4">Sala creada. Comparte este código con tu rival:</p>
            <p className="text-4xl font-mono font-bold text-cyan-400 tracking-widest mb-4">{roomId}</p>
            <p className="text-slate-600 text-xs">Esperando que el rival se una...</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-2">Te uniste a la sala</p>
            <p className="text-2xl font-mono font-bold text-cyan-400 tracking-widest mb-4">{roomId}</p>
            <p className="text-slate-600 text-xs">Preparando la partida...</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App principal con FOOTER ────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]           = useState(null);
  const [phase, setPhase]         = useState("menu");
  const [playerGrid, setPlayerGrid] = useState(null);

  const socket = useSocket();

  const handleReset = () => {
    setMode(null);
    setPhase("menu");
    setPlayerGrid(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-grow">
        {phase === "menu" && (
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold tracking-widest text-cyan-400 uppercase mb-2">
              ⚓ Hundir la Flota
            </h1>
            <p className="text-slate-500 text-sm mb-12">Elige modo de juego</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button
                onClick={() => { setMode("ai"); setPhase("placing"); }}
                className="flex-1 py-6 rounded-lg bg-slate-900 border border-slate-700
                           hover:border-cyan-500 text-slate-300 hover:text-cyan-400
                           transition-colors text-center"
              >
                <div className="text-3xl mb-2">🤖</div>
                <div className="font-bold tracking-widest uppercase text-sm">Vs IA</div>
                <div className="text-xs text-slate-600 mt-1">Juega contra el ordenador</div>
              </button>

              <button
                onClick={() => { setMode("multiplayer"); setPhase("lobby"); }}
                className="flex-1 py-6 rounded-lg bg-slate-900 border border-slate-700
                           hover:border-cyan-500 text-slate-300 hover:text-cyan-400
                           transition-colors text-center"
              >
                <div className="text-3xl mb-2">👥</div>
                <div className="font-bold tracking-widest uppercase text-sm">Multijugador</div>
                <div className="text-xs text-slate-600 mt-1">Juega con un amigo online</div>
              </button>
            </div>
          </div>
        )}

        {mode === "multiplayer" && phase === "lobby" && (
          socket.role && socket.phase === "lobby"
            ? <WaitingRoom roomId={socket.roomId} role={socket.role} />
            : socket.phase === "placing"
              ? (
                <ShipPlacer onReady={(grid) => {
                  setPlayerGrid(grid);
                  socket.sendGrid(grid);
                  setPhase("playing");
                }} />
              )
              : (
                <Lobby
                  onJoin={socket.joinRoom}
                  error={socket.error}
                  connected={socket.connected}
                />
              )
        )}

        {mode === "ai" && phase === "placing" && (
          <ShipPlacer onReady={(grid) => {
            setPlayerGrid(grid);
            setPhase("playing");
          }} />
        )}

        {phase === "playing" && playerGrid && (
          mode === "ai"
            ? <BattleVsAI playerGrid={playerGrid} onReset={handleReset} />
            : <BattleVsPlayer playerGrid={playerGrid} socket={socket} />
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full text-center py-4 text-slate-500 text-xs tracking-widest border-t border-slate-800">
        Hundir la Flota · Creado por ꋊatalia ꋊistor &copy;
      </footer>
    </div>
  );
}
