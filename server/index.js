const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // permite conexiones desde React en local
});

const rooms = {}; // guarda el estado de cada sala

// Cuando un jugador se conecta
io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  // --- Crear o unirse a una sala ---
  socket.on("join_room", (roomId) => {
    const room = rooms[roomId];

    // Si la sala no existe la creamos
    if (!room) {
      rooms[roomId] = {
        players: [socket.id],
        grids: {},    // grids[socketId] = tablero de ese jugador
        shots: {},    // shots[socketId] = disparos recibidos
        turn: null,   // quién dispara primero
        status: "waiting", // waiting | placing | playing | finished
      };
      socket.join(roomId);
      socket.emit("room_joined", { role: "host", roomId });
      console.log(`Sala ${roomId} creada por ${socket.id}`);
      return;
    }

    // Si ya hay 2 jugadores la sala está llena
    if (room.players.length >= 2) {
      socket.emit("room_full");
      return;
    }

    // Segundo jugador se une
    room.players.push(socket.id);
    socket.join(roomId);
    room.status = "placing";

    // Avisamos a ambos jugadores que ya pueden colocar barcos
    io.to(roomId).emit("room_joined", { role: "guest", roomId });
    io.to(roomId).emit("start_placing");
    console.log(`Jugador ${socket.id} se unió a la sala ${roomId}`);
  });

  // --- Jugador listo con su tablero colocado ---
  socket.on("grid_ready", ({ roomId, grid }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.grids[socket.id] = grid;
    room.shots[socket.id] = Array(10).fill(null).map(() => Array(10).fill(null));

    const readyCount = Object.keys(room.grids).length;
    console.log(`Sala ${roomId}: ${readyCount}/2 jugadores listos`);

    // Si los dos están listos, empieza la batalla
    if (readyCount === 2) {
      room.status = "playing";
      room.turn = room.players[0]; // el host empieza
      io.to(roomId).emit("battle_start", { turn: room.turn });
    }
  });

  // --- Un jugador dispara ---
  socket.on("shoot", ({ roomId, row, col }) => {
    const room = rooms[roomId];
    if (!room || room.status !== "playing") return;
    if (room.turn !== socket.id) return; // no es su turno

    // El enemigo es el otro jugador
    const enemyId = room.players.find(id => id !== socket.id);
    const enemyGrid = room.grids[enemyId];
    const hit = !!enemyGrid[row][col];

    // Guardamos el disparo en el tablero del enemigo
    room.shots[enemyId][row][col] = hit ? "hit" : "miss";

    // Comprobamos si ganó
    const totalCells = 4 + 3*2 + 2*3 + 1*4; // 20
    const hits = room.shots[enemyId]
      .flat()
      .filter(c => c === "hit").length;

    const won = hits === totalCells;

    if (won) {
      room.status = "finished";
      io.to(roomId).emit("game_over", { winner: socket.id });
      return;
    }

    // Si impactó repite turno, si no cambia turno
    if (!hit) room.turn = enemyId;

    io.to(roomId).emit("shot_result", {
      shooter: socket.id,
      row, col, hit,
      nextTurn: room.turn,
    });
  });

  // --- Jugador se desconecta ---
  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.players.includes(socket.id)) {
        io.to(roomId).emit("player_left");
        delete rooms[roomId];
        console.log(`Sala ${roomId} eliminada`);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});