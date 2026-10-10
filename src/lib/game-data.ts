import type { GameState } from "@/lib/game-state";

export const START: GameState = {
  day: 1,
  hour: 8,
  energy: 100,
  money: 20,
  str: 5,
  int: 5,
  cha: 5,
  karma: 0,
  house: 0,
  school: 0,
  job: 0,
  heat: 0,
  bank: 0,
  snacks: 0,
  smokes: 0,
  skateboard: 0,
  parkSmokes: 0,
  parkKidGone: 0,
  trainers: 0,
  alarm: 0,
  furniture: 0,
  career: 0,
  xp: 0,
};

export const HOUSES = [
  { name: "Cardboard Box", cost: 0, rest: 50 },
  { name: "Studio Flat", cost: 300, rest: 75 },
  { name: "Suburban House", cost: 2000, rest: 100 },
  { name: "Mansion", cost: 15000, rest: 100 },
] as const;

export const SCHOOLS = ["Dropout", "High School", "College", "University Degree", "PhD"] as const;
