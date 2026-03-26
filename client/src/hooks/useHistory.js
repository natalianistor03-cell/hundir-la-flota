import { useState, useEffect } from "react";

const KEY = "hundir-historial";

function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(KEY, JSON.stringify(history));
}

export function useHistory() {
  const [history, setHistory] = useState(() => loadHistory());

  // Cada vez que history cambia, lo guardamos en localStorage
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addResult = (result) => {
    // result = "won" | "lost"
    const entry = {
      result,
      date: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setHistory(prev => [entry, ...prev].slice(0, 10)); // máximo 10 entradas
  };

  const clearHistory = () => setHistory([]);

  const wins  = history.filter(e => e.result === "won").length;
  const losses = history.filter(e => e.result === "lost").length;

  return { history, addResult, clearHistory, wins, losses };
}