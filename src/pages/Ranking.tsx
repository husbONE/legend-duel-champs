import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useElo } from '../hooks/useElo';
import { PlayerModal } from '../components/PlayerModal';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useWikipedia } from '../hooks/useWikipedia';
import type { Player } from '../types';

function RowAvatar({ player }: { player: Player }) {
  const { data } = useWikipedia(player.wikipedia_slug);
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
      <PlayerAvatar name={player.name} src={data?.photo ?? null} className="w-full h-full text-base" />
    </div>
  );
}

export default function Ranking() {
  const { ranking, scores, duelsPlayed, players } = useElo();
  const [decade, setDecade] = useState<string>('all');
  const [position, setPosition] = useState<string>('all');
  const [open, setOpen] = useState<Player | null>(null);

  const decades = useMemo(() => Array.from(new Set(players.map(p => p.decade))).sort(), [players]);
  const positions = useMemo(() => Array.from(new Set(players.map(p => p.position))).sort(), [players]);

  const filtered = ranking.filter(p =>
    (decade === 'all' || p.decade === decade) &&
    (position === 'all' || p.position === position)
  );

  const rankColor = (i: number) =>
    i === 0 ? 'text-gold' : i === 1 ? 'text-silver' : i === 2 ? 'text-bronze' : 'text-muted-foreground';

  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link to="/" className="font-display text-2xl tracking-wider text-primary">
          ⚽ ALL-TIME SORTER
        </Link>
        <Link to="/sorter" className="text-sm hover:text-primary transition-colors">
          ← Continuer à voter
        </Link>
      </header>

      <h1 className="font-display text-5xl md:text-6xl mb-2">Classement</h1>
      <p className="text-muted-foreground mb-6">Trié par score ELO · {filtered.length} joueurs</p>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setDecade('all')}
          className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${decade === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
        >Toutes décennies</button>
        {decades.map(d => (
          <button
            key={d}
            onClick={() => setDecade(d)}
            className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${decade === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/40'}`}
          >{d}</button>
        ))}
      </div>

      <div className="mb-6">
        <select
          value={position}
          onChange={e => setPosition(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono"
        >
          <option value="all">Tous les postes</option>
          {positions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Joueur</th>
              <th className="px-4 py-3 hidden sm:table-cell">Nationalité</th>
              <th className="px-4 py-3 hidden md:table-cell">Décennie</th>
              <th className="px-4 py-3 text-right">ELO</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Duels</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const realRank = ranking.findIndex(r => r.id === p.id);
              return (
                <tr
                  key={p.id}
                  onClick={() => setOpen(p)}
                  className={`cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-card-hover'} hover:bg-secondary`}
                >
                  <td className={`px-4 py-3 font-display text-2xl ${rankColor(realRank)}`}>
                    {realRank + 1}
                  </td>
                  <td className="px-4 py-3"><RowAvatar player={p} /></td>
                  <td className="px-4 py-3">
                    <div className="font-display text-lg leading-none">{p.name}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{p.nationality}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{p.nationality}</td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="badge-decade">{p.decade}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{scores[p.id]}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell font-mono text-muted-foreground">{duelsPlayed(p.id)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PlayerModal player={open} open={!!open} onClose={() => setOpen(null)} />
    </div>
  );
}
