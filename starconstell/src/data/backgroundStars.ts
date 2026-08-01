export interface BackgroundStar {
  ra: number;
  dec: number;
  magnitude: number;
  color: string;
}

const starColors = ['#ffffff', '#ffe8d0', '#fff4e8', '#d0e8ff', '#e8f0ff'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateBackgroundStars(count: number): BackgroundStar[] {
  const rand = seededRandom(42);
  const stars: BackgroundStar[] = [];

  for (let i = 0; i < count; i++) {
    const ra = rand() * 360;
    const dec = Math.asin(2 * rand() - 1) * (180 / Math.PI);
    const magnitude = 3 + rand() * 4;
    const color = starColors[Math.floor(rand() * starColors.length)];
    stars.push({ ra, dec, magnitude, color });
  }

  return stars;
}
