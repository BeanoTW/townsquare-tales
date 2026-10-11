/** Consistent, tiny overhead sprite for all outdoor characters. */
export function OverheadPerson({ head = "#f0d5b7", outline = "#222530", phase = 0, moving = false, hat, angle = 0, pose = "standing" }: {
  head?: string; outline?: string; phase?: number; moving?: boolean; hat?: string;
  angle?: number; pose?: "standing" | "sitting" | "lying";
}) {
  const sway = moving ? Math.sin(phase) * 2.1 : 0;
  const leadingLeft = Math.sin(phase) >= 0;
  return <g data-overhead-person data-pose={pose} data-heading={angle}>
    <ellipse cy="4" rx="10" ry="4" fill="#292a2c" opacity=".18"/>
    {pose !== "standing" && <g data-resting-legs stroke={outline} strokeWidth="2.8" strokeLinecap="round" fill="none">
      {pose === "sitting" ? <g data-sideways-seated-legs>
        {/* Same circular head as standing; bent knees project to one side, like classic Stick RPG. */}
        <path d="M-5 0L-15 8L-23 5M4 1L-7 14L-17 17"/>
        <path d="M-23 5l-4 2M-17 17l-3 3" strokeWidth="3.2"/>
      </g> : <path d="M-5 1L-7 16M5 1L7 16"/>}
    </g>}
    <g transform={`rotate(${angle})`} data-body-heading>
      {moving && <g data-walking-feet stroke={outline} strokeWidth="3" strokeLinecap="round">
        {/* Match the overhead reference: short leading and trailing stubs, not side legs. */}
        <path d={leadingLeft ? "M1 -16L2 -20M-1 2L-2 6" : "M-1 -16L-2 -20M1 2L2 6"}/>
      </g>}
      <path d={`M-7 -7 Q-13 ${-5+sway} -13 0 M7 -7 Q13 ${-5-sway} 13 0`}
        stroke={outline} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      <circle cy="-7" r="9.2" fill={head} stroke={outline} strokeWidth="2.1"/>
      {hat && <path d="M-7 -11Q0 -19 7 -11" fill="none" stroke={hat} strokeWidth="3.4" strokeLinecap="round"/>}
      <path d="M-2 -15h4" stroke={outline} opacity=".55" strokeWidth="1.2" strokeLinecap="round"/>
    </g>
  </g>;
}
