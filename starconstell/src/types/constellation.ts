export interface Star {
  id: string;
  name: string;
  ra: number;   // right ascension in degrees (0-360)
  dec: number;  // declination in degrees (-90 to +90)
  magnitude: number;
  color?: string;
}

export interface ConstellationLine {
  from: string; // star id
  to: string;   // star id
}

export interface Constellation {
  id: string;
  name: string;
  pronunciation?: string;
  abbreviation: string;
  hemisphere: 'Northern' | 'Southern' | 'Both';
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round';
  area: number; // square degrees
  brightestStar: string;
  numberOfStars: number;
  neighbors: string[];
  isZodiac: boolean;
  description: string;
  howItFormed: string;
  whyItWasNamed: string;
  mythology: string;
  importance: string;
  interestingFacts: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  stars: Star[];
  lines: ConstellationLine[];
  centerRa: number;
  centerDec: number;
}
