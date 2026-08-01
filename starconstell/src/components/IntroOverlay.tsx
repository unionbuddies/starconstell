import { useState, useEffect } from 'react';

interface IntroOverlayProps {
  onDismiss: () => void;
}

export default function IntroOverlay({ onDismiss }: IntroOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 500);
  };

  return (
    <div
      className={`intro-overlay ${visible ? 'visible' : ''} ${exiting ? 'exiting' : ''}`}
      onClick={handleDismiss}
    >
      <div className="intro-content" onClick={(e) => e.stopPropagation()}>
        <div className="intro-stars" />

        <h1 className="intro-title">Constellations</h1>
        <p className="intro-subtitle">An Interactive Night Sky Explorer</p>

        <div className="intro-divider" />

        <section className="intro-section">
          <h2>What Are Constellations?</h2>
          <p>
            Constellations are patterns of stars that humans have identified and named
            over thousands of years. While the stars in a constellation may appear close
            together from Earth, they are often separated by vast distances in space — their
            apparent grouping is a trick of perspective from our vantage point.
          </p>
          <p>
            Ancient civilizations across the world — from the Greeks and Egyptians to the
            Chinese and Indigenous Australians — created their own constellations, weaving
            myths and stories into the night sky. These patterns served as celestial calendars
            for agriculture, navigation guides for sailors, and a canvas for cultural storytelling.
          </p>
          <p>
            Today, astronomers recognize 88 official constellations that divide the entire
            sky into mapped regions, much like countries on a globe. While modern astronomy
            relies on precise coordinates, constellations remain invaluable as a way to navigate
            and reference the night sky.
          </p>
        </section>

        <div className="intro-features">
          <div className="intro-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20" />
            </svg>
            <span>Pan & explore the sky</span>
          </div>
          <div className="intro-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>Zoom into constellations</span>
          </div>
          <div className="intro-feature">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Learn myths & history</span>
          </div>
        </div>

        <button className="intro-cta" onClick={handleDismiss}>
          Explore the Night Sky
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
