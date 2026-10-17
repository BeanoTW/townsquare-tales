import type { ReactNode } from "react";
import { BankDecor, BankFixture } from "./bank";
import { ClinicDecor, ClinicFixture } from "./clinic";
import { CosyCornerDecor, CosyCornerFixture } from "./cosy-corner";
import { DepotDecor, DepotFixture } from "./depot";
import { GarageDecor, GarageFixture } from "./garage";
import { HallDecor, HallFixture } from "./community-hall";
import { DinerDecor, DinerFixture } from "./diner";
import { OfficeDecor, OfficeFixture } from "./office";
import { PawnDecor, PawnFixture } from "./pawn-shop";
import { PoliceDecor, PoliceFixture } from "./police-station";
import { PostDecor, PostFixture } from "./post-office";
import { SchoolDecor, SchoolFixture } from "./school";
import { ShopDecor, ShopFixture } from "./shop";
import { YardDecor, YardFixture } from "./yard";

/**
 * Detailed interiors for the everyday town venues, at the same standard as the gym and the homes.
 * Each venue supplies its interactive fixtures (drawn at their plan slots, front toward +z) and its set
 * dressing (drawn in plan coordinates). Plans live in src/lib/home3d/town-venues.ts.
 */
const VENUES: Record<string, { Fixture: (p: { id: string }) => ReactNode; Decor: () => ReactNode }> = {
  shop: { Fixture: ShopFixture, Decor: ShopDecor },
  diner: { Fixture: DinerFixture, Decor: DinerDecor },
  furniture: { Fixture: CosyCornerFixture, Decor: CosyCornerDecor },
  bank: { Fixture: BankFixture, Decor: BankDecor },
  school: { Fixture: SchoolFixture, Decor: SchoolDecor },
  work: { Fixture: OfficeFixture, Decor: OfficeDecor },
  yard: { Fixture: YardFixture, Decor: YardDecor },
  clinic: { Fixture: ClinicFixture, Decor: ClinicDecor },
  depot: { Fixture: DepotFixture, Decor: DepotDecor },
  pawn: { Fixture: PawnFixture, Decor: PawnDecor },
  police: { Fixture: PoliceFixture, Decor: PoliceDecor },
  post: { Fixture: PostFixture, Decor: PostDecor },
  hall: { Fixture: HallFixture, Decor: HallDecor },
  garage: { Fixture: GarageFixture, Decor: GarageDecor },
};

export const hasTownVenue = (kind: string) => Object.prototype.hasOwnProperty.call(VENUES, kind);

export function TownVenueFixture({ kind, id }: { kind: string; id: string }) {
  const v = VENUES[kind];
  return v ? <v.Fixture id={id} /> : null;
}

export function TownVenueDecor({ kind }: { kind: string }) {
  const v = VENUES[kind];
  return v ? <v.Decor /> : null;
}
