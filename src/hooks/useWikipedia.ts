import { useState, useEffect } from 'react';

interface WikiSummary {
  photo: string | null;
  extract: string;
  url: string;
}

const cache = new Map<string, WikiSummary>();

export function useWikipedia(slug: string) {
  const [data, setData] = useState<WikiSummary | null>(() => cache.get(slug) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    if (cache.has(slug)) {
      setData(cache.get(slug)!);
      return;
    }
    setLoading(true);
    setError(false);
    setData(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, {
      signal: ctrl.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then(d => {
        const summary: WikiSummary = {
          photo: d.thumbnail?.source ?? d.originalimage?.source ?? null,
          extract: d.extract ?? '',
          url: d.content_urls?.desktop?.page ?? `https://fr.wikipedia.org/wiki/${slug}`,
        };
        cache.set(slug, summary);
        setData(summary);
      })
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        clearTimeout(timer);
      });

    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [slug]);

  return { data, loading, error };
}
