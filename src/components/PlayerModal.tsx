import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Player } from '../types';
import { useWikipedia } from '../hooks/useWikipedia';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  player: Player | null;
  open: boolean;
  onClose: () => void;
}

export function PlayerModal({ player, open, onClose }: Props) {
  const { data, loading, error } = useWikipedia(player?.wikipedia_slug ?? '');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border">
        {player && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-4xl">{player.name}</DialogTitle>
            </DialogHeader>
            <div className="grid sm:grid-cols-[180px_1fr] gap-5">
              <div className="aspect-[4/5] rounded-lg overflow-hidden bg-secondary">
                <PlayerAvatar name={player.name} src={data?.photo ?? null} className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="badge-decade">{player.decade}</span>
                  <span className="badge-decade">{player.position}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Nationalité :</strong> {player.nationality}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Clubs principaux :</strong> {player.main_clubs.join(', ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Né en :</strong> {player.birth_year}
                </p>
                {loading && <p className="text-sm text-muted-foreground">Chargement de la fiche…</p>}
                {error && (
                  <p className="text-sm text-muted-foreground">Données indisponibles.</p>
                )}
                {data?.extract && (
                  <p className="text-sm text-foreground/90 leading-relaxed">{data.extract}</p>
                )}
                <a
                  href={data?.url ?? `https://fr.wikipedia.org/wiki/${player.wikipedia_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-2"
                >
                  Voir l'article complet sur Wikipédia →
                </a>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
