/** Consistent, tiny overhead sprite for all outdoor characters. */
export function OverheadPerson({ head = "#f0d5b7", outline = "#222530", phase = 0, moving = false, hat, angle = 0, pose = "standing" }: {
  head?: string; outline?: string; phase?: number; moving?: boolean; hat?: string;
  angle?: number; pose?: "standing" | "sitting" | "lying";
}) {
  const sway = moving ? Math.sin(phase) * 2.1 : 0;
  const step = moving ? Math.sin(phase) * 3 : 0;
  return <g data-overhead-person data-pose={pose} data-heading={angle}>
    <ellipse cy="4" rx="10" ry="4" fill="#292a2c" opacity=".18"/>
    {pose !== "standing" && <g data-resting-legs stroke={outline} strokeWidth="2.8" strokeLinecap="round">
      <path d={pose==="sitting"?"M-5 1L-7 11L-13 14M5 1L7 11L13 14":"M-5 1L-6 15M5 1L6 15"}/>
    </g>}
    <g transform={`rotate(${angle})`} data-body-heading>
      {moving && <g data-walking-feet stroke={outline} strokeWidth="3" strokeLinecap="round">
        <path d={`M-4 0L${-4+step} 7M4 0L${4-step} 7`}/>
      </g>}
      <path d={`M-7 -7 Q-13 ${-5+sway} -13 0 M7 -7 Q13 ${-5-sway} 13 0`}
        stroke={outline} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      <circle cy="-7" r="9.2" fill={head} stroke={outline} strokeWidth="2.1"/>
      {hat && <path d="M-7 -11Q0 -19 7 -11" fill="none" stroke={hat} strokeWidth="3.4" strokeLinecap="round"/>}
      <path d="M-2 -15h4" stroke={outline} opacity=".55" strokeWidth="1.2" strokeLinecap="round"/>
    </g>
  </g>;
}
