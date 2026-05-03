import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SorterArena } from '../components/SorterArena';
import { useElo } from '../hooks/useElo';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function Sorter() {
  const { comparisons, reset } = useElo();
  const [, force] = useState(0);

  return (
    <div className="min-h-screen px-4 py-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-3 flex-wrap">
        <Link to="/" className="font-display text-2xl tracking-wider text-primary">
          ⚽ ALL-TIME SORTER
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-muted-foreground">{comparisons} duels</span>
          <Link to="/ranking" className="text-sm hover:text-primary transition-colors">
            Classement →
          </Link>
          <AlertDialog>
            <AlertDialogTrigger className="text-sm text-destructive/80 hover:text-destructive">
              Réinitialiser
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Tout réinitialiser ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tes scores ELO et l'historique des duels seront perdus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => { reset(); force(n => n + 1); }}>
                  Confirmer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <SorterArena />
    </div>
  );
}
