import { useState, useMemo } from 'react';
import type { Constellation } from '../types/constellation';

interface SidePanelProps {
  constellations: Constellation[];
  selectedConstellation: Constellation | null;
  favorites: Set<string>;
  onSelect: (constellation: Constellation) => void;
  onToggleFavorite: (id: string) => void;
  onResetView: () => void;
  onCloseInfo: () => void;
}

type FilterHemisphere = 'All' | 'Northern' | 'Southern' | 'Both';
type FilterSeason = 'All' | 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round';

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return text.slice(0, cut > 0 ? cut : max) + '...';
}

export default function SidePanel({
  constellations,
  selectedConstellation,
  favorites,
  onSelect,
  onToggleFavorite,
  onResetView,
  onCloseInfo,
}: SidePanelProps) {
  const [search, setSearch] = useState('');
  const [hemisphere, setHemisphere] = useState<FilterHemisphere>('All');
  const [season, setSeason] = useState<FilterSeason>('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    return constellations
      .filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (hemisphere !== 'All' && c.hemisphere !== hemisphere) return false;
        if (season !== 'All' && c.season !== season) return false;
        if (showFavoritesOnly && !favorites.has(c.id)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [constellations, search, hemisphere, season, showFavoritesOnly, favorites]);

  const neighborConstellations = useMemo(() => {
    if (!selectedConstellation) return [];
    return selectedConstellation.neighbors
      .map((name) => constellations.find((c) => c.name === name))
      .filter((c): c is Constellation => c !== undefined);
  }, [selectedConstellation, constellations]);

  const c = selectedConstellation;

  return (
    <div className="side-panel">
      {/* Header */}
      <div className="panel-header">
        <button className="home-btn" onClick={onResetView} title="Reset view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <h2>Constellations</h2>
        <span className="constellation-count">{constellations.length}</span>
      </div>

      {/* Info section — shown when a constellation is selected */}
      {c && (
        <div className="info-card">
          <div className="info-card-header">
            <div>
              <h1 className="info-title">{c.name}</h1>
              {c.pronunciation && <span className="pronunciation">{c.pronunciation}</span>}
            </div>
            <div className="info-card-actions">
              <button
                className={`fav-btn-sm ${favorites.has(c.id) ? 'active' : ''}`}
                onClick={() => onToggleFavorite(c.id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={favorites.has(c.id) ? '#ffd700' : 'none'} stroke={favorites.has(c.id) ? '#ffd700' : 'currentColor'} strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button className="close-btn-sm" onClick={onCloseInfo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="info-card-tags">
            <span className={`difficulty-badge ${c.difficulty.toLowerCase()}`}>{c.difficulty}</span>
            <span className="tag">{c.abbreviation}</span>
            <span className="tag">{c.hemisphere}</span>
            <span className="tag">{c.season}</span>
            {c.isZodiac && <span className="tag tag-zodiac">Zodiac</span>}
          </div>

          <div className="info-card-body">
            <div className="quick-stats">
              <div className="stat"><span className="stat-label">Area</span><span className="stat-val">{c.area} sq°</span></div>
              <div className="stat"><span className="stat-label">Brightest</span><span className="stat-val">{c.brightestStar}</span></div>
              <div className="stat"><span className="stat-label">Stars</span><span className="stat-val">{c.numberOfStars}</span></div>
            </div>

            <p className="info-desc">{truncate(c.description, 180)}</p>

            <details className="info-details">
              <summary>How It Formed</summary>
              <p>{truncate(c.howItFormed, 200)}</p>
            </details>

            <details className="info-details">
              <summary>Origin of Name</summary>
              <p>{truncate(c.whyItWasNamed, 200)}</p>
            </details>

            <details className="info-details">
              <summary>Mythology</summary>
              <p>{truncate(c.mythology, 250)}</p>
            </details>

            <details className="info-details">
              <summary>Importance</summary>
              <p>{truncate(c.importance, 200)}</p>
            </details>

            <div className="fun-facts">
              <h4>Quick Facts</h4>
              <ul>
                {c.interestingFacts.slice(0, 3).map((f, i) => (
                  <li key={i}>{truncate(f, 120)}</li>
                ))}
              </ul>
            </div>

            {neighborConstellations.length > 0 && (
              <div className="related">
                <h4>Neighbors</h4>
                <div className="related-tags">
                  {neighborConstellations.map((nc) => (
                    <button key={nc.id} className="related-tag" onClick={() => onSelect(nc)}>
                      {nc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="search-container">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filters">
        <select value={hemisphere} onChange={(e) => setHemisphere(e.target.value as FilterHemisphere)} className="filter-select">
          <option value="All">All Hemispheres</option>
          <option value="Northern">Northern</option>
          <option value="Southern">Southern</option>
          <option value="Both">Both</option>
        </select>
        <select value={season} onChange={(e) => setSeason(e.target.value as FilterSeason)} className="filter-select">
          <option value="All">All Seasons</option>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
          <option value="Autumn">Autumn</option>
          <option value="Winter">Winter</option>
          <option value="Year-round">Year-round</option>
        </select>
      </div>

      <button
        className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Favorites {favorites.size > 0 && `(${favorites.size})`}
      </button>

      {/* Constellation list */}
      <div className="constellation-list">
        {filtered.map((constellation) => (
          <div
            key={constellation.id}
            role="button"
            tabIndex={0}
            className={`constellation-item ${selectedConstellation?.id === constellation.id ? 'selected' : ''}`}
            onClick={() => onSelect(constellation)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(constellation); } }}
          >
            <div className="item-info">
              <span className="item-name">{constellation.name}</span>
              <span className="item-meta">{constellation.abbreviation} · {constellation.season}</span>
            </div>
            <button
              className="fav-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(constellation.id);
              }}
              title={favorites.has(constellation.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={favorites.has(constellation.id) ? '#ffd700' : 'none'} stroke={favorites.has(constellation.id) ? '#ffd700' : 'currentColor'} strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="no-results">No constellations found</div>
        )}
      </div>
    </div>
  );
}
