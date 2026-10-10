import type { PlaceId } from "@/lib/rooms";

/** Counter-led screens use direct interactions; training and street scenes retain object hotspots. */
export const ARCADE_PLACES: readonly PlaceId[] = [
  "shop", "bank", "school", "work", "yard", "diner", "bar",
  "pawn", "clinic", "depot", "police", "furniture",
];

export function isArcadeRoom(id: PlaceId): boolean {
  return ARCADE_PLACES.includes(id);
}
