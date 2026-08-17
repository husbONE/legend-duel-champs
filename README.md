# Football Pantheon

FOOTBALL ALL-TIME SORTER — PROMPT COMPLET

Tu vas créer un site web interactif permettant de classer les 150 meilleurs footballeurs de l'histoire via un algorithme de comparaison duelle. L'utilisateur choisit entre deux joueurs ; ses choix alimentent un classement ELO dynamique. Une fiche Wikipedia s'affiche pour aider le choix.

STACK

React + Vite + TypeScript

Tailwind CSS

React Router v6

localStorage pour la persistance

Wikipedia REST API (fetch côté client, pas de backend)

Déploiement : Vercel

FICHIER DE DONNÉES

Le fichier players_150.json est fourni. Ne jamais inventer de joueur. Format :

{
  "players": [
    {
      "id": 1,
      "name": "Alfredo Di Stéfano",
      "wikipedia_slug": "Alfredo_Di_Stéfano",
      "nationality": "Argentine/Espagne",
      "main_clubs": ["River Plate", "Real Madrid"],
      "decade": "1950-1959",
      "position": "Attaquant",
      "birth_year": 1926
    }
  ]
}


Règle absolue : un joueur = une seule décennie (sa prime). Jamais de doublon.

PAGES

/ — Home

Titre : "Qui est le meilleur footballeur de l'histoire ?"

Sous-titre : "150 légendes. Un seul trône. À toi de décider."

Bouton principal : "Commencer" → /sorter

Bouton secondaire : "Voir le classement" → /ranking

Aperçu de 6 cartes joueurs animées

/sorter — Page principale

Layout :

┌──────────────────────────────────────┐
│  Logo             X comparaisons     │
├─────────────┬────────────────────────┤
│  CARTE A    │  CARTE B               │
│  [Photo]    │  [Photo]               │
│  Nom        │  Nom                   │
│  Nationalité│  Nationalité           │
│  Décennie   │  Décennie              │
│  Clubs      │  Clubs                 │
│  [Fiche]    │  [Fiche]               │
├─────────────┴────────────────────────┤
│   [← Lui]      [Nul]      [Lui →]   │
└──────────────────────────────────────┘


Cliquer sur une carte = voter pour elle

Cliquer sur "Fiche" = ouvrir la modale Wikipedia

Raccourcis clavier : flèche gauche = A, flèche droite = B, flèche bas = nul

Transition animée entre chaque duel (slide out / slide in, 300ms)

Bouton "Voir le classement" en haut à droite

Bouton "Réinitialiser" avec confirmation dialog

/ranking — Classement

Tableau trié par score ELO décroissant

Colonnes : Rang · Photo · Nom · Nationalité · Décennie · ELO · Duels joués

Filtres : par décennie (boutons toggle), par poste (dropdown)

Cliquer sur un joueur ouvre sa fiche Wikipedia

Top 3 mis en avant visuellement (or, argent, bronze)

ALGORITHME ELO

const K = 32;

function expectedScore(rA: number, rB: number): number {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

function updateElo(
  scores: Record<number, number>,
  winnerId: number,
  loserId: number
): Record<number, number> {
  const next = { ...scores };
  const rW = scores[winnerId];
  const rL = scores[loserId];
  const e = expectedScore(rW, rL);
  next[winnerId] = Math.round(rW + K * (1 - e));
  next[loserId]  = Math.round(rL + K * (0 - (1 - e)));
  return next;
}
// Nul : scores inchangés


Sélection des duels :

Prioriser les joueurs de score ELO proche (±150 pts)

Éviter de reproposer un duel dans les 15 derniers matchs

Varier les décennies (ne pas aligner deux joueurs de la même époque systématiquement)

HOOK useElo

// hooks/useElo.ts
import { useState, useCallback } from 'react';
import playersData from '../data/players_150.json';

type Scores = Record<number, number>;

const STORAGE_KEY = 'sorter_elo_v1';
const HISTORY_KEY = 'sorter_history_v1';

function initScores(): Scores {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return Object.fromEntries(playersData.players.map(p => [p.id, 1500]));
}

export function useElo() {
  const [scores, setScores] = useState<Scores>(initScores);
  const [history, setHistory] = useState<[number, number][]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const vote = useCallback((winnerId: number | null, loserId: number | null) => {
    if (winnerId === null || loserId === null) return; // nul, rien ne change
    setScores(prev => {
      const rW = prev[winnerId], rL = prev[loserId];
      const e = 1 / (1 + Math.pow(10, (rL - rW) / 400));
      const next = {
        ...prev,
        [winnerId]: Math.round(rW + 32 * (1 - e)),
        [loserId]:  Math.round(rL + 32 * (0 - (1 - e)))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setHistory(prev => {
      const next = [...prev, [winnerId, loserId] as [number, number]];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getNextDuel = useCallback(() => {
    const all = playersData.players;
    const recent = new Set(history.slice(-15).flat());
    const sorted = [...all].sort((a, b) => scores[b.id] - scores[a.id]);
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 20, sorted.length); j++) {
        const a = sorted[i], b = sorted[j];
        const alreadyPlayed = history.some(
          ([w, l]) => (w === a.id && l === b.id) || (w === b.id && l === a.id)
        );
        if (!recent.has(a.id) && !recent.has(b.id) && !alreadyPlayed) {
          return [a, b] as const;
        }
      }
    }
    return [sorted[0], sorted[1]] as const;
  }, [scores, history]);

  const ranking = [...playersData.players].sort((a, b) => scores[b.id] - scores[a.id]);

  const reset = () => {
    const fresh = Object.fromEntries(playersData.players.map(p => [p.id, 1500]));
    setScores(fresh);
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
  };

  return { scores, vote, getNextDuel, ranking, comparisons: history.length, reset };
}


HOOK useWikipedia

// hooks/useWikipedia.ts
import { useState, useEffect } from 'react';

interface WikiSummary {
  photo: string | null;
  extract: string;
  url: string;
}

export function useWikipedia(slug: string) {
  const [data, setData]       = useState<WikiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
      signal: ctrl.signal
    })
      .then(r => r.json())
      .then(d => setData({
        photo:   d.thumbnail?.source ?? null,
        extract: d.extract ?? '',
        url:     d.content_urls?.desktop?.page ?? `https://fr.wikipedia.org/wiki/${slug}`
      }))
      .catch(() => setError(true))
      .finally(() => { setLoading(false); clearTimeout(timer); });

    return () => ctrl.abort();
  }, [slug]);

  return { data, loading, error };
}


MODALE FICHE JOUEUR

Ouverte au clic sur "Fiche" dans le sorter ou sur une ligne du classement.

Contenu :

Photo Wikipedia (ou placeholder initiales du joueur si absente)

Nom complet, nationalité, poste, décennie, clubs principaux

Résumé Wikipedia (extract, 3-4 phrases)

Lien "Voir l'article complet sur Wikipédia →" (nouvel onglet)

Fallback si l'API échoue :

if (error) return (
  <div>
    <p>Données indisponibles.</p>
    <a href={`https://fr.wikipedia.org/wiki/${slug}`} target="_blank">
      Voir sur Wikipédia →
    </a>
  </div>
);


DESIGN — "DARK STADIUM"

Palette CSS

:root {
  --bg:           #080c0a;
  --bg-card:      #0f1511;
  --bg-card-hover:#162019;
  --accent:       #4ade80;
  --accent-gold:  #f59e0b;
  --text:         #f0fdf4;
  --text-muted:   #6b7280;
  --border:       rgba(74, 222, 128, 0.12);
  --glow:         0 0 30px rgba(74, 222, 128, 0.10);
}


Typographie (Google Fonts)

Noms joueurs / titres : Bebas Neue

Corps de texte : DM Sans

Scores ELO : JetBrains Mono

Détails visuels

Cartes : fond --bg-card, bordure --border, hover → translateY(-4px) + glow vert

Boutons vote : bordure verte, hover → fond vert + texte noir

Badge décennie : pill arrondi vert transparent

Top 3 classement : couleurs or / argent / bronze sur le rang

Lignes tableau : alternance sombre

Animations

Duel : cartes actuelles glissent vers l'extérieur, nouvelles arrivent du centre (300ms, ease-out)

ELO dans le classement : animation chiffre qui monte/descend après un vote

Hover carte : transition: transform 200ms, box-shadow 200ms

Responsive

Desktop : deux cartes côte à côte (max-width 420px chacune)

Mobile : deux cartes empilées verticalement, boutons pleine largeur en bas

SEO

<!-- index.html -->
<title>Football All-Time Sorter — Classe les 150 meilleures légendes</title>
<meta name="description" content="Qui est le meilleur footballeur de l'histoire ? Compare 150 légendes en duel — de Pelé à Mbappé, de Maradona à Messi. Construis ton classement all-time.">
<meta name="keywords" content="meilleur footballeur histoire, classement foot all-time, sorter foot, top 150 joueurs football, Messi Ronaldo Maradona comparaison">
<meta property="og:title" content="Football All-Time Sorter — Qui est le GOAT ?">
<meta property="og:description" content="150 légendes. Un seul trône. À toi de décider.">
<meta property="og:type" content="website">
<link rel="canonical" href="https://ton-domaine.com/">


STRUCTURE DU PROJET

src/
  data/
    players_150.json        ← fourni, ne pas modifier
  hooks/
    useElo.ts
    useWikipedia.ts
  components/
    PlayerCard.tsx
    SorterArena.tsx
    PlayerModal.tsx
    RankingTable.tsx
    FilterBar.tsx
  pages/
    Home.tsx
    Sorter.tsx
    Ranking.tsx
  App.tsx
  main.tsx
index.html


ORDRE DE BUILD

Setup : Vite + React + TypeScript + Tailwind + React Router

Import players_150.json + types TypeScript

useElo.ts — logique ELO complète + localStorage

PlayerCard + SorterArena + boutons de vote + raccourcis clavier

useWikipedia.ts + PlayerModal

Page /ranking + filtres

Page Home

Design Dark Stadium + animations

SEO meta tags

vercel --prod

CONTRAINTES

Utiliser uniquement players_150.json — ne jamais inventer de joueur

Fallback image si Wikipedia ne retourne pas de photo (placeholder initiales)

Timeout API Wikipedia : 5 secondes max, puis fallback

100% client-side, aucun backend

Le sorter fonctionne hors-ligne (seule la fiche Wikipedia nécessite internet)

Fournir players_150.json en pièce jointe avec ce prompt.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://legend-duel-champs.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac7e6d1f-c680-4498-a208-b68e296678d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
