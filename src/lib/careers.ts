/** Branching careers: experience is earned at work, not purchased with education. */
export type Career = {
  name: string;
  roles: readonly {
    name: string;
    pay: number;
    experience: number;
    int: number;
    cha: number;
    str: number;
    school: number;
  }[];
};
export const CAREERS: readonly Career[] = [
  {
    name: "Corporate",
    roles: [
      { name: "Office Intern", pay: 9, experience: 0, int: 0, cha: 0, str: 0, school: 0 },
      { name: "Office Assistant", pay: 16, experience: 12, int: 15, cha: 8, str: 0, school: 0 },
      { name: "Analyst", pay: 29, experience: 35, int: 30, cha: 20, str: 0, school: 2 },
      { name: "Department Manager", pay: 50, experience: 75, int: 55, cha: 40, str: 0, school: 2 },
      { name: "CEO", pay: 110, experience: 160, int: 95, cha: 75, str: 0, school: 3 },
    ],
  },
  {
    name: "Hospitality",
    roles: [
      { name: "Kitchen Porter", pay: 8, experience: 0, int: 0, cha: 0, str: 0, school: 0 },
      { name: "Line Cook", pay: 15, experience: 12, int: 5, cha: 4, str: 8, school: 0 },
      { name: "Head Chef", pay: 28, experience: 36, int: 12, cha: 16, str: 16, school: 0 },
      { name: "Restaurant Manager", pay: 47, experience: 85, int: 25, cha: 35, str: 15, school: 0 },
      {
        name: "Hospitality Director",
        pay: 85,
        experience: 170,
        int: 50,
        cha: 60,
        str: 15,
        school: 0,
      },
    ],
  },
  {
    name: "Retail",
    roles: [
      { name: "Shop Assistant", pay: 8, experience: 0, int: 0, cha: 0, str: 0, school: 0 },
      { name: "Sales Associate", pay: 15, experience: 12, int: 3, cha: 15, str: 0, school: 0 },
      { name: "Supervisor", pay: 25, experience: 37, int: 10, cha: 28, str: 0, school: 0 },
      { name: "Store Manager", pay: 45, experience: 80, int: 25, cha: 48, str: 0, school: 0 },
      { name: "Regional Director", pay: 80, experience: 170, int: 40, cha: 75, str: 0, school: 0 },
    ],
  },
  {
    name: "Trades",
    roles: [
      { name: "Apprentice", pay: 10, experience: 0, int: 0, cha: 0, str: 0, school: 0 },
      { name: "Tradesperson", pay: 21, experience: 18, int: 8, cha: 0, str: 18, school: 0 },
      { name: "Site Lead", pay: 36, experience: 54, int: 18, cha: 10, str: 30, school: 0 },
      { name: "Contractor", pay: 62, experience: 108, int: 30, cha: 26, str: 38, school: 0 },
      {
        name: "Construction Director",
        pay: 100,
        experience: 210,
        int: 48,
        cha: 45,
        str: 42,
        school: 0,
      },
    ],
  },
];
export type CareerStats = {
  career: number;
  job: number;
  xp: number;
  int: number;
  cha: number;
  str: number;
  school: number;
};
const ENTRY = CAREERS[0]!.roles[0]!;
export function currentRole(s: CareerStats) {
  return CAREERS[s.career]?.roles[s.job] ?? ENTRY;
}
export function nextRole(s: CareerStats) {
  return CAREERS[s.career]?.roles[s.job + 1] ?? null;
}
export function missingRequirements(s: CareerStats, role: Career["roles"][number]): string[] {
  const missing: string[] = [];
  if (s.xp < role.experience) missing.push(`${role.experience - s.xp} more work XP`);
  if (s.int < role.int) missing.push(`${role.int - s.int} intelligence`);
  if (s.cha < role.cha) missing.push(`${role.cha - s.cha} charm`);
  if (s.str < role.str) missing.push(`${role.str - s.str} strength`);
  if (s.school < role.school) missing.push(`education level ${role.school}`);
  return missing;
}
export function shiftReward(s: CareerStats) {
  const role = currentRole(s);
  return { money: role.pay * 4, xp: 4, karma: 1, role: role.name };
}
