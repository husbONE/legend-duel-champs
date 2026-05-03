import { useCallback, useSyncExternalStore } from 'react';
import playersData from '../data/players_150.json';
import type { Player } from '../types';

type Scores = Record<number, number>;
type Hist = [number, number][];

const STORAGE_KEY = 'sorter_elo_v1';
const HISTORY_KEY = 'sorter_history_v1';

const players = playersData.players as Player[];

function loadScores(): Scores {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Scores;
      players.forEach(p => { if (!(p.id in parsed)) parsed[p.id] = 1500; });
      return parsed;
    } catch {}
  }
  return Object.fromEntries(players.map(p => [p.id, 1500]));
}
function loadHistory(): Hist {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
}

let scores: Scores = loadScores();
let history: Hist = loadHistory();
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return history.length; } // simple version key

function persistScores() { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); }
function persistHistory() { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

function voteFn(winnerId: number | null, loserId: number | null) {
  if (winnerId === null || loserId === null) {
    history = [...history, [-1, -1]];
    persistHistory();
    emit();
    return;
  }
  const rW = scores[winnerId], rL = scores[loserId];
  const e = 1 / (1 + Math.pow(10, (rL - rW) / 400));
  scores = {
    ...scores,
    [winnerId]: Math.round(rW + 32 * (1 - e)),
    [loserId]:  Math.round(rL + 32 * (0 - (1 - e))),
  };
  history = [...history, [winnerId, loserId]];
  persistScores();
  persistHistory();
  emit();
}

function getNextDuelFn(): readonly [Player, Player] {
  const recent = new Set(history.slice(-15).flat());
  const sorted = [...players].sort((a, b) => scores[b.id] - scores[a.id]);
  const candidates: { a: Player; b: Player; score: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < Math.min(i + 15, sorted.length); j++) {
      const a = sorted[i], b = sorted[j];
      if (recent.has(a.id) || recent.has(b.id)) continue;
      const alreadyPlayed = history.some(([w, l]) => (w === a.id && l === b.id) || (w === b.id && l === a.id));
      if (alreadyPlayed) continue;
      const diff = Math.abs(scores[a.id] - scores[b.id]);
      if (diff > 150) continue;
      const sameDecade = a.decade === b.decade ? 50 : 0;
      candidates.push({ a, b, score: diff + sameDecade });
    }
  }
  if (candidates.length) {
    candidates.sort((x, y) => x.score - y.score);
    const top = candidates.slice(0, Math.min(10, candidates.length));
    const pick = top[Math.floor(Math.random() * top.length)];
    return [pick.a, pick.b] as const;
  }
  const pool = players.filter(p => !recent.has(p.id));
  const a = pool[Math.floor(Math.random() * pool.length)] ?? sorted[0];
  let b = pool[Math.floor(Math.random() * pool.length)] ?? sorted[1];
  if (b.id === a.id) b = sorted.find(p => p.id !== a.id)!;
  return [a, b] as const;
}

function resetFn() {
  scores = Object.fromEntries(players.map(p => [p.id, 1500]));
  history = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(HISTORY_KEY);
  emit();
}

export function useElo() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ranking = [...players].sort((a, b) => scores[b.id] - scores[a.id]);
  const duelsPlayed = useCallback((id: number) => {
    return history.reduce((n, [w, l]) => n + (w === id || l === id ? 1 : 0), 0);
  }, []);
  return {
    scores,
    vote: voteFn,
    getNextDuel: getNextDuelFn,
    ranking,
    comparisons: history.filter(([w]) => w !== -1).length + history.filter(([w]) => w === -1).length,
    reset: resetFn,
    duelsPlayed,
    players,
  };
}
