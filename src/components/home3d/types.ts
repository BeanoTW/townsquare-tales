import type { HomeZone } from "@/lib/home-zones";

export type OpeningLike = { w: number; h: number; cx: number; T: number };

export type Scene3DProps = {
  /** Hotspot ids that are visible (ownership and tier rules already applied). */
  visibleIds: readonly string[];
  /** Furniture quality per id: true when the luxury version is owned. */
  luxury: Readonly<Record<string, boolean>>;
  /** Whether the basic mattress or the real bed is shown. */
  hasBed: boolean;
  selectedId: string | null;
  zone: HomeZone;
  hour: number;
  /** Used to decide whether the camera should refit after the user changes room. */
  onSelect: (id: string) => void;
  /** Tap on empty space. */
  onDeselect?: () => void;
  onReady?: () => void;
};

/** Imperative camera handle shared with the on-screen camera buttons. */
export type CameraControls = {
  reset: () => void;
  zoom: (factor: number) => void;
  rotate: (radians: number) => void;
  tilt: (radians: number) => void;
  focus: (zone: HomeZone | "all") => void;
  /** Current camera state, for tests and diagnostics. */
  read: () => { az: number; el: number; dist: number; tx: number; tz: number };
};
