import { describe, expect, it } from "vitest";
import { CAREERS, currentRole, missingRequirements, nextRole, shiftReward } from "@/lib/careers";

const novice = {career:0,job:0,xp:0,int:5,cha:5,str:5,school:0};
describe("branching careers",()=>{
  it("offers four complete, differently paid career tracks",()=>{
    expect(CAREERS).toHaveLength(4);
    expect(new Set(CAREERS.map(c=>c.name)).size).toBe(4);
    for(const career of CAREERS) {
      expect(career.roles).toHaveLength(5);
      expect(career.roles[0].experience).toBe(0);
      expect(career.roles.every((role,i)=>i===0||role.pay>career.roles[i-1].pay)).toBe(true);
    }
  });
  it("pays by selected career and awards work experience",()=>{
    expect(shiftReward(novice)).toMatchObject({money:36,xp:4});
    expect(shiftReward({...novice,career:3,job:1})).toMatchObject({money:84,xp:4});
  });
  it("prevents buying a promotion with education alone",()=>{
    const requirements=missingRequirements({...novice,school:4,int:100,cha:100},nextRole(novice)!);
    expect(requirements.join(" ")).toContain("work XP");
  });
  it("allows unqualified workers to progress into skilled trades",()=>{
    const trainee={...novice,career:3,job:0,xp:20,str:20,int:12};
    expect(missingRequirements(trainee,nextRole(trainee)!)).toEqual([]);
    expect(currentRole({...trainee,job:1}).name).toBe("Tradesperson");
  });
  it("requires a qualification for corporate analytical work",()=>{
    const candidate={...novice,job:1,xp:40,int:60,cha:60,school:0};
    expect(missingRequirements(candidate,nextRole(candidate)!)).toContain("education level 2");
  });
});