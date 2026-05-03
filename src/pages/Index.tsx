import { Link } from 'react-router-dom';
import playersData from '../data/players_150.json';
import { useWikipedia } from '../hooks/useWikipedia';
import { PlayerAvatar } from '../components/PlayerAvatar';
import type { Player } from '../types';

const players = playersData.players as Player[];

const HIGHLIGHT_NAMES = ['Pelé', 'Diego Maradona', 'Lionel Messi', 'Cristiano Ronaldo', 'Zinédine Zidane', 'Johan Cruyff'];

function MiniCard({ player, delay }: { player: Player; delay: number }) {
  const { data } = useWikipedia(player.wikipedia_slug);
  return (
    <div
      className="player-card aspect-[3/4] animate-slide-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="w-full h-2/3 overflow-hidden bg-secondary">
        <PlayerAvatar name={player.name} src={data?.photo ?? null} className="w-full h-full" />
      </div>
      <div className="p-3">
        <div className="font-display text-lg leading-none truncate">{player.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{player.decade}</div>
      </div>
    </div>
  );
}

export default function Index() {
  const previews = HIGHLIGHT_NAMES
    .map(n => players.find(p => p.name === n))
    .filter((p): p is Player => !!p)
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <span className="font-display text-2xl tracking-wider text-primary">⚽ ALL-TIME SORTER</span>
        <Link to="/ranking" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Classement
        </Link>
      </header>

      <main className="flex-1 px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center pt-10 md:pt-16">
        <span className="badge-decade mb-6">150 légendes · 1 trône</span>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none max-w-4xl">
          Qui est le meilleur footballeur de l'histoire ?
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mt-6 max-w-2xl">
          150 légendes. Un seul trône. À toi de décider.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10">
          <Link to="/sorter" className="vote-btn bg-primary text-primary-foreground border-primary hover:opacity-90">
            Commencer
          </Link>
          <Link to="/ranking" className="vote-btn">
            Voir le classement
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-16 w-full">
          {previews.map((p, i) => (
            <MiniCard key={p.id} player={p} delay={i * 80} />
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground font-mono">
        Algorithme ELO · Données Wikipédia · 100 % anonyme
      </footer>
    </div>
  );
}
