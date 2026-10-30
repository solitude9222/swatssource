import express from 'express';
import axios from 'axios';

const router = express.Router();

// ---------------------------------------------------------------------------
// Search APIs — proxy third-party search endpoints for section content
//
// These are public-facing search proxies with result caching. They let the
// frontend search for games, music, and anime without exposing API keys.
// Each endpoint returns a normalized array of { id, name, cover, subtitle,
// genre, rating, url } objects.
// ---------------------------------------------------------------------------

const cache = new Map();
const CACHE_TTL = 10 * 60_000; // 10 minutes

function cached(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { at: Date.now(), data });
  // Evict oldest entries when cache grows too large
  if (cache.size > 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at);
    for (let i = 0; i < 100; i++) cache.delete(oldest[i][0]);
  }
}

// ── Anime Search (Jikan v4 — free, no auth) ───────────────────────────────
router.get('/anime', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const key = `anime:${q.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return res.json(hit);

  try {
    const { data } = await axios.get('https://api.jikan.moe/v4/anime', {
      params: { q, limit: 20, sfw: true, order_by: 'popularity', sort: 'asc' },
      timeout: 8000,
    });

    const results = (data?.data || []).map((a) => ({
      id: String(a.mal_id),
      name: a.title || a.title_english || '',
      cover: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
      subtitle: [a.type, a.episodes ? `${a.episodes} eps` : '', a.status].filter(Boolean).join(' · '),
      genre: (a.genres || []).map((g) => g.name).join(', '),
      rating: a.score ? Number(a.score) : null,
      url: a.url || '',
      year: a.year || (a.aired?.from ? new Date(a.aired.from).getFullYear() : null),
    }));

    setCache(key, results);
    res.json(results);
  } catch (err) {
    console.error('[search/anime]', err.message);
    res.status(502).json({ detail: 'Anime search unavailable' });
  }
});

// ── Games Search (RAWG API — free tier, 20k/month) ────────────────────────
router.get('/games', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const key = `games:${q.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return res.json(hit);

  const rawgKey = process.env.RAWG_API_KEY || '';

  try {
    // RAWG is free (20k requests/month). If no key, fall back to IGDB-style Twitch covers
    if (rawgKey) {
      const { data } = await axios.get('https://api.rawg.io/api/games', {
        params: { key: rawgKey, search: q, page_size: 20 },
        timeout: 8000,
      });

      const results = (data?.results || []).map((g) => ({
        id: String(g.id),
        name: g.name || '',
        cover: g.background_image || '',
        subtitle: [g.released ? g.released.slice(0, 4) : '', g.metacritic ? `${g.metacritic}/100` : ''].filter(Boolean).join(' · '),
        genre: (g.genres || []).map((gen) => gen.name).join(', '),
        rating: g.rating ? Number((g.rating * 2).toFixed(1)) : null, // RAWG uses 0-5, normalize to 0-10
        url: g.website || '',
        platform: (g.platforms || []).map((p) => p.platform?.name).filter(Boolean).slice(0, 3).join(', '),
      }));

      setCache(key, results);
      return res.json(results);
    }

    // Fallback: no RAWG key — return empty with helpful message
    res.json([]);
  } catch (err) {
    console.error('[search/games]', err.message);
    res.status(502).json({ detail: 'Game search unavailable' });
  }
});

// ── Music Search (Spotify Web API or Deezer fallback) ─────────────────────
router.get('/music', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const key = `music:${q.toLowerCase()}`;
  const hit = cached(key);
  if (hit) return res.json(hit);

  try {
    // Use Deezer's free API (no auth needed)
    const { data } = await axios.get('https://api.deezer.com/search/artist', {
      params: { q, limit: 20 },
      timeout: 8000,
    });

    const results = (data?.data || []).map((a) => ({
      id: String(a.id),
      name: a.name || '',
      cover: a.picture_xl || a.picture_big || a.picture_medium || a.picture || '',
      subtitle: a.nb_album ? `${a.nb_album} albums · ${Number(a.nb_fan || 0).toLocaleString()} fans` : 'Artist',
      genre: '',
      rating: null,
      url: a.link || '',
    }));

    setCache(key, results);
    res.json(results);
  } catch (err) {
    console.error('[search/music]', err.message);
    // Fallback attempt with MusicBrainz
    try {
      const { data } = await axios.get('https://musicbrainz.org/ws/2/artist', {
        params: { query: q, fmt: 'json', limit: 15 },
        headers: { 'User-Agent': 'tourn.lol/1.0 (contact@tourn.lol)' },
        timeout: 8000,
      });

      const results = (data?.artists || []).map((a) => ({
        id: a.id,
        name: a.name || '',
        cover: '', // MusicBrainz doesn't have images
        subtitle: [a.type, a.country, a['life-span']?.begin?.slice(0, 4)].filter(Boolean).join(' · '),
        genre: (a.tags || []).slice(0, 3).map((t) => t.name).join(', '),
        rating: a.score ? Math.round(a.score / 10) : null,
        url: '',
      }));

      setCache(key, results);
      res.json(results);
    } catch {
      res.status(502).json({ detail: 'Music search unavailable' });
    }
  }
});

export default router;
