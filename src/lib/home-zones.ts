export type HomeZone = "shelter" | "living" | "bedroom" | "kitchen" | "study" | "gym" | "entertainment";
/** Camera regions for the 3D venues (casino, bar, gym). */
export type VenueZone = "floor" | "vip" | "bar" | "dance" | "weights" | "cardio";
/** Every zone a 3D plan can use: the home rooms plus the venue regions. */
export type PlanZone = HomeZone | VenueZone;
export type VenueId = "casino" | "bar" | "gym" | "pawn" | "police" | "shop" | "diner" | "furniture" | "bank" | "school" | "work" | "yard" | "clinic" | "depot";
export const VENUE_IDS: readonly string[] = ["casino", "bar", "gym", "pawn", "police", "shop", "diner", "furniture", "bank", "school", "work", "yard", "clinic", "depot"];
export const isVenue = (id: string): id is VenueId => VENUE_IDS.includes(id);
export const venueZones = (id: VenueId): { id: PlanZone; label: string }[] =>
  (id === "pawn" || id === "police" || id === "shop" || id === "diner" || id === "furniture" || id === "bank" || id === "school" || id === "work" || id === "yard" || id === "clinic" || id === "depot")
    ? [{ id: "floor", label: "Main floor" }]
    : id === "casino"
    ? [{ id: "floor", label: "Casino floor" }, { id: "vip", label: "High-stakes room" }]
    : id === "bar"
      ? [{ id: "bar", label: "The bar" }, { id: "dance", label: "Dance floor & darts" }]
      : [{ id: "weights", label: "Weights floor" }, { id: "cardio", label: "Cardio & stretch" }];
export const homeZones = (house: number): { id: HomeZone; label: string }[] => {
  if (house <= 0) return [{ id: "shelter", label: "Shelter" }];
  if (house === 1) return [{ id: "living", label: "Living / Kitchen" }, { id: "bedroom", label: "Bedroom / Study" }];
  if (house === 2) return [{ id: "living", label: "Living Room" }, { id: "kitchen", label: "Kitchen" }, { id: "bedroom", label: "Bedroom" }, { id: "study", label: "Study / Gym" }];
  return [{ id: "living", label: "Living Room" }, { id: "kitchen", label: "Luxury Kitchen" }, { id: "bedroom", label: "Master Bedroom" }, { id: "study", label: "Study" }, { id: "gym", label: "Private Gym" }, { id: "entertainment", label: "Entertainment" }];
};
export function furnitureZone(id: string, house: number): HomeZone {
  if (house <= 0) return "shelter";
  const map: Record<string, HomeZone> = {
    sofa: "living", television: "living", tv: "living", bookshelf: "living", estate: "living",
    kitchen: house === 1 ? "living" : "kitchen",
    bed: "bedroom", desk: house === 1 ? "bedroom" : house === 2 ? "study" : "study",
    weights: house <= 2 ? "study" : "gym",
    console: house === 3 ? "entertainment" : "living",
  };
  return map[id] ?? "living";
}
export const requiresMainsPower = (id: string) => id === "tv" || id === "console" || id === "bookshelf";