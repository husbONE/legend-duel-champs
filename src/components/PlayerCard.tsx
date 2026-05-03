import type { Player } from '../types';
import { useWikipedia } from '../hooks/useWikipedia';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  player: Player;
  onSelect: () => void;
  onOpenDetails: () => void;
  side: 'A' | 'B';
}

export function PlayerCard({ player, onSelect, onOpenDetails, side }: Props) {
  const { data } = useWikipedia(player.wikipedia_slug);

  return (
    <div className="player-card flex flex-col h-full" onClick={onSelect}>
      <div className="aspect-[4/5] w-full overflow-hidden bg-secondary relative">
        <PlayerAvatar name={player.name} src={data?.photo ?? null} className="w-full h-full" />
        <div className="absolute top-3 left-3">
          <span className="badge-decade">{player.decade}</span>
        </div>
        <div className="absolute top-3 right-3 font-mono text-xs px-2 py-1 rounded bg-background/70 backdrop-blur text-muted-foreground">
          {side}
        </div>
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h2 className="font-display text-3xl leading-none">{player.name}</h2>
        <p className="text-sm text-muted-foreground">{player.nationality} · {player.position}</p>
        <p className="text-sm text-foreground/80">{player.main_clubs.join(' · ')}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenDetails(); }}
          className="mt-auto self-start text-xs uppercase tracking-widest text-primary hover:underline"
        >
          Fiche →
        </button>
      </div>
    </div>
  );
}
