import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// const SERVER_URL = "http://localhost:3001";
const socket = io("https://hundir-la-flotaa.onrender.com/");

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected]     = useState(false);
  const [roomId, setRoomId]           = useState("");
  const [role, setRole]               = useState(null);     // "host" | "guest"
  const [phase, setPhase]             = useState("lobby");  // "lobby" | "placing" | "playing" | "finished"
  const [myTurn, setMyTurn]           = useState(false);
  const [opponentShots, setOpponentShots] = useState(() => Array(10).fill(null).map(() => Array(10).fill(null)));
  const [myShots, setMyShots]         = useState(() => Array(10).fill(null).map(() => Array(10).fill(null)));
  const [winner, setWinner]           = useState(null);     // "me" | "opponent"
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    // Creamos la conexión al montar el hook
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("Conectado al servidor:", socket.id);
    });

    socket.on("disconnect", () => setConnected(false));

    // El servidor nos confirma que entramos a la sala
    socket.on("room_joined", ({ role }) => {
      setRole(role);
      setError("");
    });

    // La sala estaba llena
    socket.on("room_full", () => {
      setError("La sala está llena. Prueba con otro código.");
    });

    // Los dos jugadores están listos — fase de colocación
    socket.on("start_placing", () => {
      setPhase("placing");
    });

    // Los dos han colocado — empieza la batalla
    socket.on("battle_start", ({ turn }) => {
      setPhase("playing");
      setMyTurn(turn === socket.id);
    });

    // Resultado de un disparo
    socket.on("shot_result", ({ shooter, row, col, hit, nextTurn }) => {
      if (shooter === socket.id) {
        // Yo disparé — actualizo mis disparos
        setMyShots(prev => {
          const ns = prev.map(r => [...r]);
          ns[row][col] = hit ? "hit" : "miss";
          return ns;
        });
      } else {
        // El enemigo disparó — actualizo los disparos que recibí
        setOpponentShots(prev => {
          const ns = prev.map(r => [...r]);
          ns[row][col] = hit ? "hit" : "miss";
          return ns;
        });
      }
      setMyTurn(nextTurn === socket.id);
    });

    // Alguien ganó
    socket.on("game_over", ({ winner: winnerId }) => {
      setPhase("finished");
      setWinner(winnerId === socket.id ? "me" : "opponent");
    });

    // El otro jugador se fue
    socket.on("player_left", () => {
      setOpponentLeft(true);
      setPhase("finished");
    });

    return () => socket.disconnect();
  }, []);

  // --- Acciones que puede hacer el componente ---

  const joinRoom = (id) => {
    if (!id.trim()) { setError("Escribe un código de sala."); return; }
    setRoomId(id.trim().toUpperCase());
    socketRef.current?.emit("join_room", id.trim().toUpperCase());
  };

  const sendGrid = (grid) => {
    socketRef.current?.emit("grid_ready", { roomId, grid });
  };

  const sendShot = (row, col) => {
    if (!myTurn || phase !== "playing") return;
    socketRef.current?.emit("shoot", { roomId, row, col });
  };

  return {
    connected, roomId, role, phase,
    myTurn, myShots, opponentShots,
    winner, opponentLeft, error,
    joinRoom, sendGrid, sendShot,
  };
}