export type HomeZone = "shelter" | "living" | "bedroom" | "kitchen" | "study" | "gym" | "entertainment";
/** Camera regions for the 3D venues: casino, bar and gym areas, plus a public floor and a back-of-house space. */
export type VenueZone = "floor" | "back" | "vip" | "bar" | "dance" | "weights" | "cardio";
/** Every zone a 3D plan can use: the home rooms plus the venue regions. */
export type PlanZone = HomeZone | VenueZone;
export type VenueId = "casino" | "bar" | "gym" | "pawn" | "police" | "shop" | "diner" | "furniture" | "bank" | "school" | "work" | "yard" | "clinic" | "depot";
export const VENUE_IDS: readonly string[] = ["casino", "bar", "gym", "pawn", "police", "shop", "diner", "furniture", "bank", "school", "work", "yard", "clinic", "depot"];
export const isVenue = (id: string): id is VenueId => VENUE_IDS.includes(id);
/** Area buttons for the everyday venues: the public floor and the back-of-house space. */
const AREAS: Partial<Record<VenueId, [string, string]>> = {
  shop: ["Shop floor", "Stockroom"],
  diner: ["Dining room", "Kitchen"],
  furniture: ["Showroom", "Bedroom gallery"],
  bank: ["Banking hall", "Vault"],
  school: ["Library & hall", "Lecture room"],
  work: ["Open-plan office", "Manager's office"],
  yard: ["Yard shed", "Foreman's cabin"],
  clinic: ["Waiting room", "Treatment room"],
  depot: ["Concourse", "Bus bays"],
  pawn: ["Shop floor", "Back room"],
  police: ["Reception", "Squad room"],
};
export const venueZones = (id: VenueId): { id: PlanZone; label: string }[] => {
  const areas = AREAS[id];
  if (areas) return [{ id: "floor", label: areas[0] }, { id: "back", label: areas[1] }];
  return id === "casino"
    ? [{ id: "floor", label: "Casino floor" }, { id: "vip", label: "High-stakes room" }]
    : id === "bar"
      ? [{ id: "bar", label: "The bar" }, { id: "dance", label: "Dance floor & darts" }]
      : [{ id: "weights", label: "Weights floor" }, { id: "cardio", label: "Cardio & stretch" }];
};
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