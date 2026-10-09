export type FurnitureId = "bed" | "kitchen" | "weights" | "desk" | "sofa";
export type FurnitureItem = { id: FurnitureId; bit: number; name: string; cost: number; benefit: string };
export const FURNITURE: FurnitureItem[] = [
  { id: "bed", bit: 1, name: "Proper bed", cost: 180, benefit: "+25 sleep recovery" },
  { id: "kitchen", bit: 2, name: "Kitchen set", cost: 250, benefit: "cheap cooked meals" },
  { id: "weights", bit: 4, name: "Home weights", cost: 400, benefit: "train strength at home" },
  { id: "desk", bit: 8, name: "Study desk", cost: 220, benefit: "study intelligence at home" },
  { id: "sofa", bit: 16, name: "Cosy sofa", cost: 300, benefit: "relax to improve charm" },
];
export function ownsFurniture(mask: number, id: FurnitureId): boolean {
  const item = FURNITURE.find((i) => i.id === id);
  return !!item && (mask & item.bit) !== 0;
}
export function furnitureBonus(mask: number, stat: "sleep"): number {
  return stat === "sleep" && ownsFurniture(mask, "bed") ? 25 : 0;
}
