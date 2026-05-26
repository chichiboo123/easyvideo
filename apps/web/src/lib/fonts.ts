// Curated Google Fonts list.
// Loaded once via a single <link> on layout. Adding fonts only inflates initial CSS size, not bundle.

export interface FontSpec {
  family: string;
  weights: string;         // for Google Fonts URL (e.g. "400;700")
  category: "kr-sans" | "kr-serif" | "kr-handwriting" | "display" | "sans" | "serif" | "mono" | "handwriting";
  korean?: boolean;
}

export const FONTS: FontSpec[] = [
  // ── Korean Sans ─────────────────────────────────────────
  { family: "Noto Sans KR",     weights: "400;500;700;900", category: "kr-sans", korean: true },
  { family: "Nanum Gothic",     weights: "400;700;800",     category: "kr-sans", korean: true },
  { family: "Nanum Gothic Coding", weights: "400;700",      category: "kr-sans", korean: true },
  { family: "Black Han Sans",   weights: "400",             category: "kr-sans", korean: true },
  { family: "Do Hyeon",         weights: "400",             category: "kr-sans", korean: true },
  { family: "Hi Melody",        weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Sunflower",        weights: "300;500;700",     category: "kr-sans", korean: true },
  { family: "Single Day",       weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Stylish",          weights: "400",             category: "kr-sans", korean: true },
  { family: "Yeon Sung",        weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Cute Font",        weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Gugi",             weights: "400",             category: "kr-sans", korean: true },
  { family: "Jua",              weights: "400",             category: "kr-sans", korean: true },
  { family: "Poor Story",       weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Gaegu",            weights: "300;400;700",     category: "kr-handwriting", korean: true },
  { family: "East Sea Dokdo",   weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Dokdo",            weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Diphylleia",       weights: "400",             category: "kr-serif", korean: true },
  { family: "Song Myung",       weights: "400",             category: "kr-serif", korean: true },
  { family: "Gowun Dodum",      weights: "400",             category: "kr-sans", korean: true },
  { family: "Gowun Batang",     weights: "400;700",         category: "kr-serif", korean: true },
  { family: "Nanum Myeongjo",   weights: "400;700;800",     category: "kr-serif", korean: true },
  { family: "Nanum Pen Script", weights: "400",             category: "kr-handwriting", korean: true },
  { family: "Nanum Brush Script", weights: "400",           category: "kr-handwriting", korean: true },

  // ── Latin Sans ──────────────────────────────────────────
  { family: "Roboto",           weights: "400;500;700;900", category: "sans" },
  { family: "Open Sans",        weights: "400;600;700;800", category: "sans" },
  { family: "Inter",            weights: "400;500;700;900", category: "sans" },
  { family: "Montserrat",       weights: "400;600;700;900", category: "sans" },
  { family: "Poppins",          weights: "400;600;700;900", category: "sans" },
  { family: "Lato",             weights: "400;700;900",     category: "sans" },
  { family: "Raleway",          weights: "400;700;900",     category: "sans" },
  { family: "Nunito",           weights: "400;700;900",     category: "sans" },
  { family: "Work Sans",        weights: "400;700;900",     category: "sans" },
  { family: "Source Sans 3",    weights: "400;700;900",     category: "sans" },
  { family: "Rubik",            weights: "400;700;900",     category: "sans" },
  { family: "Quicksand",        weights: "400;700",         category: "sans" },
  { family: "Manrope",          weights: "400;700;800",     category: "sans" },
  { family: "DM Sans",          weights: "400;700;900",     category: "sans" },
  { family: "Mulish",           weights: "400;700;900",     category: "sans" },
  { family: "Karla",            weights: "400;700",         category: "sans" },
  { family: "Bebas Neue",       weights: "400",             category: "display" },
  { family: "Oswald",           weights: "400;500;700",     category: "display" },
  { family: "Anton",            weights: "400",             category: "display" },
  { family: "Archivo Black",    weights: "400",             category: "display" },
  { family: "Big Shoulders Display", weights: "400;700;900", category: "display" },
  { family: "Russo One",        weights: "400",             category: "display" },
  { family: "Teko",             weights: "400;700",         category: "display" },
  { family: "Squada One",       weights: "400",             category: "display" },
  { family: "Saira Condensed",  weights: "400;700;900",     category: "sans" },

  // ── Latin Serif ─────────────────────────────────────────
  { family: "Playfair Display", weights: "400;600;700;900", category: "serif" },
  { family: "Merriweather",     weights: "400;700;900",     category: "serif" },
  { family: "Lora",             weights: "400;700",         category: "serif" },
  { family: "PT Serif",         weights: "400;700",         category: "serif" },
  { family: "Bitter",           weights: "400;700",         category: "serif" },
  { family: "Roboto Slab",      weights: "400;700;900",     category: "serif" },
  { family: "EB Garamond",      weights: "400;600;700",     category: "serif" },
  { family: "Cormorant Garamond", weights: "400;700",       category: "serif" },
  { family: "Libre Baskerville", weights: "400;700",        category: "serif" },
  { family: "DM Serif Display", weights: "400",             category: "serif" },
  { family: "Yeseva One",       weights: "400",             category: "serif" },
  { family: "Abril Fatface",    weights: "400",             category: "display" },
  { family: "Cinzel",           weights: "400;700;900",     category: "serif" },
  { family: "Marcellus",        weights: "400",             category: "serif" },
  { family: "Crimson Pro",      weights: "400;700",         category: "serif" },

  // ── Handwriting / Display ───────────────────────────────
  { family: "Lobster",          weights: "400",             category: "display" },
  { family: "Pacifico",         weights: "400",             category: "handwriting" },
  { family: "Dancing Script",   weights: "400;700",         category: "handwriting" },
  { family: "Caveat",           weights: "400;700",         category: "handwriting" },
  { family: "Permanent Marker", weights: "400",             category: "handwriting" },
  { family: "Shadows Into Light", weights: "400",           category: "handwriting" },
  { family: "Indie Flower",     weights: "400",             category: "handwriting" },
  { family: "Kalam",            weights: "400;700",         category: "handwriting" },
  { family: "Sacramento",       weights: "400",             category: "handwriting" },
  { family: "Satisfy",          weights: "400",             category: "handwriting" },
  { family: "Great Vibes",      weights: "400",             category: "handwriting" },
  { family: "Amatic SC",        weights: "400;700",         category: "handwriting" },
  { family: "Architects Daughter", weights: "400",          category: "handwriting" },
  { family: "Patrick Hand",     weights: "400",             category: "handwriting" },
  { family: "Kaushan Script",   weights: "400",             category: "handwriting" },
  { family: "Bangers",          weights: "400",             category: "display" },
  { family: "Fredoka",          weights: "400;500;600;700", category: "sans" },
  { family: "Luckiest Guy",     weights: "400",             category: "display" },
  { family: "Press Start 2P",   weights: "400",             category: "display" },
  { family: "Righteous",        weights: "400",             category: "display" },
  { family: "Fugaz One",        weights: "400",             category: "display" },
  { family: "Comfortaa",        weights: "400;700",         category: "display" },
  { family: "Audiowide",        weights: "400",             category: "display" },
  { family: "Orbitron",         weights: "400;700;900",     category: "display" },
  { family: "Black Ops One",    weights: "400",             category: "display" },
  { family: "Bungee",           weights: "400",             category: "display" },
  { family: "Faster One",       weights: "400",             category: "display" },
  { family: "Monoton",          weights: "400",             category: "display" },
  { family: "Creepster",        weights: "400",             category: "display" },
  { family: "Concert One",      weights: "400",             category: "display" },
  { family: "Titan One",        weights: "400",             category: "display" },
  { family: "Alfa Slab One",    weights: "400",             category: "display" },
  { family: "Modak",            weights: "400",             category: "display" },
  { family: "Sigmar",           weights: "400",             category: "display" },
  { family: "Carter One",       weights: "400",             category: "display" },
  { family: "Chango",           weights: "400",             category: "display" },
  { family: "Bowlby One",       weights: "400",             category: "display" },

  // ── Mono ────────────────────────────────────────────────
  { family: "JetBrains Mono",   weights: "400;700",         category: "mono" },
  { family: "Fira Code",        weights: "400;700",         category: "mono" },
  { family: "IBM Plex Mono",    weights: "400;700",         category: "mono" },
  { family: "Roboto Mono",      weights: "400;700",         category: "mono" },
  { family: "Source Code Pro",  weights: "400;700",         category: "mono" },
  { family: "Inconsolata",      weights: "400;700;900",     category: "mono" },
];

export function buildGoogleFontsHref(): string {
  const params = FONTS.map(
    (f) => `family=${encodeURIComponent(f.family).replace(/%20/g, "+")}:wght@${f.weights}`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function fontCategoryLabel(cat: FontSpec["category"]): string {
  switch (cat) {
    case "kr-sans": return "한글 산세리프";
    case "kr-serif": return "한글 명조";
    case "kr-handwriting": return "한글 손글씨";
    case "sans": return "Sans-serif";
    case "serif": return "Serif";
    case "display": return "Display";
    case "handwriting": return "Handwriting";
    case "mono": return "Mono";
  }
}
