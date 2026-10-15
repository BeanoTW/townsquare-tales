export type HomeZone = "shelter" | "living" | "bedroom" | "kitchen" | "study" | "gym" | "entertainment";
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
