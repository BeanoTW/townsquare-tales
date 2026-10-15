export type FurnitureId = "bed" | "kitchen" | "weights" | "desk" | "sofa" | "tv" | "console" | "bookshelf";
export type FurnitureItem = { id: FurnitureId; bit: number; name: string; cost: number; benefit: string };
export const FURNITURE: FurnitureItem[] = [
  { id: "bed", bit: 1, name: "Proper bed", cost: 180, benefit: "+25 sleep recovery" },
  { id: "kitchen", bit: 2, name: "Kitchen set", cost: 250, benefit: "cheap cooked meals" },
  { id: "weights", bit: 4, name: "Home weights", cost: 400, benefit: "train strength at home" },
  { id: "desk", bit: 8, name: "Study desk", cost: 220, benefit: "study intelligence at home" },
  { id: "sofa", bit: 16, name: "Cosy sofa", cost: 300, benefit: "relax to improve charm" },
  { id: "tv", bit: 32, name: "Television", cost: 450, benefit: "watch educational and fitness channels at home" },
  { id: "console", bit: 64, name: "Game console", cost: 620, benefit: "play brain games and party games" },
  { id: "bookshelf", bit: 128, name: "Bookshelf", cost: 340, benefit: "read books for intelligence and career XP" },
];
export function ownsFurniture(mask: number, id: FurnitureId): boolean {
  const item = FURNITURE.find((i) => i.id === id);
  return !!item && (mask & item.bit) !== 0;
}
export function furnitureBonus(mask: number, stat: "sleep"): number {
  return stat === "sleep" && ownsFurniture(mask, "bed") ? 25 : 0;
}

/** Luxury is a separate purchase; its original furniture benefit is unchanged. */
export const LUXURY_FURNITURE: FurnitureItem[] = [
  { id: "bed", bit: 1, name: "Cloud king bed", cost: 1800, benefit: "Tufted headboard, twin pillows and a quilted duvet" },
  { id: "kitchen", bit: 2, name: "Chef's kitchen", cost: 2500, benefit: "Stone worktops, brass taps and a proper range" },
  { id: "weights", bit: 4, name: "Pro home gym", cost: 2400, benefit: "Chrome rack, padded bench and matching plates" },
  { id: "desk", bit: 8, name: "Executive desk", cost: 1600, benefit: "A polished desk, laptop and brass reading lamp" },
  { id: "sofa", bit: 16, name: "Velvet lounge sofa", cost: 2200, benefit: "Deep teal velvet, gold feet and plush cushions" },
  { id: "tv", bit: 32, name: "Cinema television", cost: 3200, benefit: "An edge-to-edge screen and a soundbar" },
  { id: "console", bit: 64, name: "Next-gen game station", cost: 1800, benefit: "A sleek tower, wireless controller and glowing dock" },
  { id: "bookshelf", bit: 128, name: "Collector's bookcase", cost: 1500, benefit: "A glass-front library with gold-bound volumes" },
];
