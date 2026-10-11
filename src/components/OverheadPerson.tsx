/** One shared overhead silhouette for every town pedestrian and site worker.
 * Coordinates are centred on the ground position, with the head at y=-7.
 * Roles are expressed through head colour, never character dimensions. */
export function OverheadPerson({ head = "#f0d5b7", outline = "#222530", phase = 0, moving = false, hat }: {
  head?: string; outline?: string; phase?: number; moving?: boolean; hat?: string;
}) {
  const sway = moving ? Math.sin(phase) * 2.1 : 0;
  return <g data-overhead-person>
    <ellipse cy="4" rx="10" ry="4" fill="#292a2c" opacity=".18"/>
    <path d={`M-7 -7 Q-13 ${-5+sway} -13 0 M7 -7 Q13 ${-5-sway} 13 0`}
      stroke={outline} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    <circle cy="-7" r="9.2" fill={head} stroke={outline} strokeWidth="2.1"/>
    {hat && <path d="M-7 -11Q0 -19 7 -11" fill="none" stroke={hat} strokeWidth="3.4" strokeLinecap="round"/>}
  </g>;
}
