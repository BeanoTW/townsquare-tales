import { deckRotation, elevation, type SkateJump } from "@/lib/skate-tricks";

interface SkaterFigureProps {
  skateAngle: number;
  moving: boolean;
  phase: number;
  turnVelocity?: number;
  head?: string;
  outline?: string;
  jump?: SkateJump | null;
}

/** Classic top-down stick figure: head and balancing arms only, no standing legs. */
export function SkaterFigure({
  skateAngle, moving, phase, turnVelocity = 0,
  head = "var(--town-paper)", outline = "var(--town-player)", jump = null,
}: SkaterFigureProps) {
  const lean = Math.max(-10, Math.min(10, turnVelocity * 10));
  const armMotion = moving ? Math.sin(phase * 0.8) * 1.3 : 0;
  const carve = turnVelocity * 2;
  const lift = elevation(jump);
  return (
    <g data-skater-pose data-skate-angle={Math.round(skateAngle)}>
      <g transform={`rotate(${skateAngle + 180})`}>
        {/* Shadow stays on the road rather than rising with the rider during tricks. */}
        <ellipse data-skate-shadow cx="0" cy="2" rx={jump ? 8 : 7} ry={jump ? 20 : 18}
          fill="#1e2025" opacity={jump ? 0.18 : 0.29} />
      </g>
      <g transform={`translate(0 ${-lift}) rotate(${skateAngle + 180})`}>
        <g data-skateboard="deck-group" transform={`rotate(${deckRotation(jump) + lean})`}>
          {/* Visible wheel edges and the two metal trucks sit beneath the deck. */}
          {[-12, 10].flatMap(y => [-1, 1].map(side => (
            <rect key={`${y}:${side}`} x={side < 0 ? -7.1 : 4.7} y={y - 2.3}
              width="2.4" height="4.6" rx="1.2" fill="#e8e2d2"
              stroke="#22252a" strokeWidth="0.7" />
          )))}
          {[-12, 10].map(y => (
            <line key={y} x1="-6" y1={y} x2="6" y2={y}
              stroke="#747c84" strokeWidth="1.7" strokeLinecap="round" />
          ))}
          <path data-skateboard="deck"
            d="M 0 -22 C 3.8 -22 5.8 -18 5.8 -12 C 5.8 -4 4.8 0 5.2 6 C 5.6 12 4.6 16.5 3.6 18.5 C 2.2 20.2 -2.2 20.2 -3.6 18.5 C -4.6 16.5 -5.6 12 -5.2 6 C -4.8 0 -5.8 -4 -5.8 -12 C -5.8 -18 -3.8 -22 0 -22 Z"
            fill="#89949c" stroke="#262930" strokeWidth="1.5" />
          <path d="M 0 -20 C 3.2 -20 4.8 -16.5 4.8 -11 C 4.8 -4 3.9 0 4.3 6 C 4.6 11 3.8 15 2.9 17 C 1.8 18.5 -1.8 18.5 -2.9 17 C -3.8 15 -4.6 11 -4.3 6 C -3.9 0 -4.8 -4 -4.8 -11 C -4.8 -16.5 -3.2 -20 0 -20 Z"
            fill="#373c44" opacity="0.88" />
          {[-2, 2].flatMap(x => [-13, -10.5, 9, 11.5].map(y => (
            <circle key={`${x}:${y}`} cx={x} cy={y} r="0.65"
              fill={y === -13 ? "#facc15" : "#e5e7eb"} />
          )))}
        </g>
        <g data-overhead-person transform={`translate(${carve * 0.4} 0) rotate(${72 + lean * 0.5})`}>
          <ellipse cy="2" rx="8.5" ry="4" fill="#22252a" opacity="0.22" />
          <path data-person-arms
            d={`M -6 -5 Q ${-15 + carve} ${-9 + armMotion} ${-14 + carve * 1.5} -1 M 6 -5 Q ${14 - carve} ${-2 - armMotion} ${12 - carve} 6`}
            stroke={outline} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx={-14 + carve * 1.5} cy="-1" r="1.3" fill={head} stroke={outline} strokeWidth="1.2" />
          <circle cx={12 - carve} cy="6" r="1.3" fill={head} stroke={outline} strokeWidth="1.2" />
          <circle cy="-5" r="9" fill={head} stroke={outline} strokeWidth="2.2" />
          <path d="M -3 -13.5 Q 0 -16 3 -13.5" stroke={outline}
            strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </g>
  );
}
