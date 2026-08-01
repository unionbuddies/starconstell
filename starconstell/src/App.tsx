import { useState, useCallback, useEffect } from 'react';
import { constellations } from './data/constellations';
import type { Constellation } from './types/constellation';
import { useStarMap } from './hooks/useStarMap';
import StarMap from './components/StarMap';
import SidePanel from './components/SidePanel';
import IntroOverlay from './components/IntroOverlay';
import './App.css';

function loadFavorites(): Set<string> {
  try {
    const saved = localStorage.getItem('constellation-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites: Set<string>) {
  localStorage.setItem('constellation-favorites', JSON.stringify([...favorites]));
}

export default function App() {
  const [selectedConstellation, setSelectedConstellation] = useState<Constellation | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showIntro, setShowIntro] = useState(() => {
    return !localStorage.getItem('constellation-intro-seen');
  });

  const {
    viewState,
    canvasRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    centerOn,
    hoveredConstellation,
    setHoveredConstellation,
  } = useStarMap(constellations);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [canvasRef, handleWheel]);

  const handleSelectConstellation = useCallback(
    (constellation: Constellation) => {
      setSelectedConstellation(constellation);
      centerOn(constellation.centerRa, constellation.centerDec);
    },
    [centerOn]
  );

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedConstellation(null);
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedConstellation(null);
    resetView();
  }, [resetView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntro) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case 'Escape':
          if (selectedConstellation) handleCloseInfo();
          break;
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const sorted = [...constellations].sort((a, b) => a.name.localeCompare(b.name));
          const currentIdx = selectedConstellation
            ? sorted.findIndex((c) => c.id === selectedConstellation.id)
            : -1;
          const nextIdx =
            e.key === 'ArrowDown'
              ? Math.min(currentIdx + 1, sorted.length - 1)
              : Math.max(currentIdx - 1, 0);
          handleSelectConstellation(sorted[nextIdx]);
          break;
        }
        case 'r':
          handleResetView();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, selectedConstellation, handleSelectConstellation, handleCloseInfo, handleResetView]);

  return (
    <div className="app">
      <div className="center-panel">
        <StarMap
          constellations={constellations}
          selectedConstellation={selectedConstellation}
          hoveredConstellation={hoveredConstellation}
          viewState={viewState}
          canvasRef={canvasRef}
          onConstellationClick={handleSelectConstellation}
          onConstellationHover={setHoveredConstellation}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {hoveredConstellation && !selectedConstellation && (
          <div className="tooltip">
            <strong>{hoveredConstellation.name}</strong>
            <span>{hoveredConstellation.abbreviation} · {hoveredConstellation.season}</span>
          </div>
        )}
        <div className="zoom-controls">
          <span className="zoom-label">{Math.round(viewState.zoom * 100)}%</span>
        </div>

        <button
          className="panel-toggle-btn"
          onClick={() => setPanelOpen(!panelOpen)}
          aria-label="Toggle panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {panelOpen ? (
              <polyline points="9 6 15 12 9 18" />
            ) : (
              <polyline points="15 6 9 12 15 18" />
            )}
          </svg>
        </button>
      </div>

      <div className={`side-panel-container ${panelOpen ? 'open' : ''}`}>
        <SidePanel
          constellations={constellations}
          selectedConstellation={selectedConstellation}
          favorites={favorites}
          onSelect={handleSelectConstellation}
          onToggleFavorite={handleToggleFavorite}
          onResetView={handleResetView}
          onCloseInfo={handleCloseInfo}
        />
      </div>

      {showIntro && (
        <IntroOverlay
          onDismiss={() => {
            setShowIntro(false);
            localStorage.setItem('constellation-intro-seen', '1');
          }}
        />
      )}
    </div>
  );
}
