import { useEffect, useMemo, useRef, useState } from 'react';
import { useElo } from '../hooks/useElo';
import { PlayerCard } from './PlayerCard';
import { PlayerModal } from './PlayerModal';
import type { Player } from '../types';

export function SorterArena() {
  const { vote, getNextDuel, comparisons } = useElo();
  const [duel, setDuel] = useState<readonly [Player, Player]>(() => getNextDuel());
  const [animKey, setAnimKey] = useState(0);
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const lockRef = useRef(false);

  const next = (winnerId: number | null, loserId: number | null) => {
    if (lockRef.current) return;
    lockRef.current = true;
    vote(winnerId, loserId);
    setTimeout(() => {
      setDuel(getNextDuel());
      setAnimKey(k => k + 1);
      lockRef.current = false;
    }, 200);
  };

  // Need fresh closure for getNextDuel after vote updates state
  // Re-fetch duel whenever comparisons changes via effect for safety
  useEffect(() => {
    setDuel(getNextDuel());
    setAnimKey(k => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisons]);

  const [a, b] = duel;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalPlayer) return;
      if (e.key === 'ArrowLeft') next(a.id, b.id);
      else if (e.key === 'ArrowRight') next(b.id, a.id);
      else if (e.key === 'ArrowDown') next(null, null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [a, b, modalPlayer]);

  const versus = useMemo(() => (
    <div key={animKey} className="grid md:grid-cols-2 gap-5 animate-slide-in">
      <PlayerCard player={a} side="A" onSelect={() => next(a.id, b.id)} onOpenDetails={() => setModalPlayer(a)} />
      <PlayerCard player={b} side="B" onSelect={() => next(b.id, a.id)} onOpenDetails={() => setModalPlayer(b)} />
    </div>
  ), [a, b, animKey]);

  return (
    <div className="flex flex-col gap-6">
      {versus}
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        <button className="vote-btn" onClick={() => next(a.id, b.id)}>← Lui</button>
        <button className="vote-btn" onClick={() => next(null, null)}>Nul</button>
        <button className="vote-btn" onClick={() => next(b.id, a.id)}>Lui →</button>
      </div>
      <p className="text-xs text-muted-foreground text-center font-mono">
        Raccourcis : ← gauche · ↓ nul · → droite
      </p>
      <PlayerModal player={modalPlayer} open={!!modalPlayer} onClose={() => setModalPlayer(null)} />
    </div>
  );
}
