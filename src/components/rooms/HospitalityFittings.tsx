import type { ShopFixture } from "@/lib/walkable-shops";

export function HospitalityFitting({
  fixture: f,
  venue,
}: {
  fixture: ShopFixture;
  venue: "diner" | "bar";
}) {
  const w = f.w * 24,
    h = f.d * 24,
    pub = venue === "bar";
  return (
    <g
      transform={`translate(${f.x * 24} ${f.y * 24})`}
      pointerEvents="none"
      data-hospitality-fitting={f.id}
    >
      {f.id === "dartboard" ? <g data-pub-dartboard>
        <rect width={w} height={h} rx="3" fill="#35283f" stroke="var(--town-ink)"/>
        <circle cx={w/2} cy={h/2} r={h/2-2} fill="#efe4cc" stroke="#252430" strokeWidth="3"/>
        <circle cx={w/2} cy={h/2} r={h/3} fill="none" stroke="#4d997c" strokeWidth="3"/>
        <path d={`M${w/2} 2v${h-4}M${w/2-h/2+2} ${h/2}h${h-4}`} stroke="#252430"/>
        <circle cx={w/2} cy={h/2} r="3" fill="#c15767"/>
        <text x={w/2} y={h+10} textAnchor="middle" fontSize="8" fill="var(--town-paper)">DARTS</text>
      </g> : f.id === "counter" || f.id === "bar-counter" ? (
        <g data-hospitality-counter>
          <rect x="3" y="4" width={w} height={h} rx="3" fill="var(--town-ink)" opacity=".15" />
          <rect
            width={w}
            height={h}
            rx="3"
            fill={pub ? "var(--pub-counter)" : "var(--shop-counter-top)"}
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <path
            d={`M0 ${h - 8}h${w}v8H0Z`}
            fill={pub ? "var(--shop-wood-dark)" : "var(--diner-seat)"}
            stroke="var(--town-ink)"
          />
          <g transform={`translate(${w - 26} 3)`} data-hospitality-till>
            <rect width="22" height="19" rx="2" fill="var(--town-glass)" stroke="var(--town-ink)" />
            <rect x="3" y="3" width="16" height="7" fill="var(--shop-screen)" />
            <path d="M4 14h14" stroke="var(--town-paper)" strokeWidth="3" />
          </g>
          {pub ? (
            <g data-pub-taps fill="var(--shop-brass)" stroke="var(--town-ink)">
              {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${15 + i * 23} 5)`}>
                  <path d="M0 17V2h10v7" fill="none" strokeWidth="3" />
                  <ellipse cx="5" cy="18" rx="9" ry="3" />
                  <circle cx="10" cy="0" r="4" fill="var(--pub-bottle)" />
                </g>
              ))}
            </g>
          ) : (
            <g data-diner-coffee>
              <circle cx="82" cy="14" r="11" fill="var(--town-paper)" stroke="var(--town-ink)" />
              <circle cx="80" cy="13" r="4" fill="var(--shop-product-gold)" />
              <path d="M87 9l4 8M72 10l2 7" stroke="var(--diner-seat)" strokeWidth="3" />
              <rect
                x="12"
                y="3"
                width="24"
                height="23"
                rx="3"
                fill="var(--town-glass)"
                stroke="var(--town-ink)"
              />
              <circle cx="24" cy="14" r="7" fill="var(--shop-wood-dark)" />
              <path d="M44 8h12v13H44Z" fill="var(--town-paper)" stroke="var(--town-ink)" />
              <path d="M56 10q9 2 0 8" fill="none" stroke="var(--town-ink)" />
            </g>
          )}
          <text x={w / 2} y={h - 1} textAnchor="middle" fontSize="8" fill="var(--town-paper)">
            {pub ? "THE BAR" : "ORDER HERE"}
          </text>
          {pub && (
            <g data-pub-stools fill="var(--pub-seat)" stroke="var(--town-ink)">
              {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={18 + i * 40} cy={h - 2} r="6" />
              ))}
            </g>
          )}
        </g>
      ) : f.id === "pub-bottles" ? (
        <g data-pub-bottle-shelf>
          <rect width={w} height={h} fill="var(--shop-wood-dark)" stroke="var(--town-ink)" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i} transform={`translate(${7 + i * 12} 3)`}>
              <path
                d="M3 0h4v6l3 4v13H0V10l3-4Z"
                fill={i % 2 ? "var(--pub-bottle)" : "var(--shop-product-gold)"}
                stroke="var(--town-ink)"
              />
              <path d="M2 14h6" stroke="var(--town-paper)" strokeWidth="3" />
            </g>
          ))}
          <path d={`M0 ${h - 3}h${w}`} stroke="var(--shop-brass)" strokeWidth="3" />
        </g>
      ) : f.id === "dance-floor" ? (
        <g data-pub-dance-floor>
          <rect
            width={w}
            height={h}
            rx="4"
            fill="var(--pub-floor)"
            stroke="var(--shop-brass)"
            strokeWidth="2"
          />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${i * 24} 0v${h}M0 ${i * 24}h${w}`}
              stroke="var(--pub-seat)"
              opacity=".5"
            />
          ))}
          <text x={w / 2} y={h / 2} textAnchor="middle" fontSize="9" fill="var(--shop-linen)">
            BAD DECISIONS
          </text>
        </g>
      ) : f.id.startsWith("pub-table") ? (
        <g data-pub-table>
          <rect
            x="3"
            y="3"
            width={w - 6}
            height={h - 6}
            rx="10"
            fill="var(--shop-wood)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <circle cx="22" cy="19" r="6" fill="var(--shop-brass)" stroke="var(--town-ink)" />
          <circle cx="22" cy="19" r="3" fill="var(--town-paper)" />
          <rect
            x="40"
            y="13"
            width="16"
            height="15"
            fill="var(--shop-linen)"
            stroke="var(--town-ink)"
          />
          <rect
            x="-3"
            y="8"
            width="12"
            height={h - 16}
            rx="4"
            fill="var(--pub-seat)"
            stroke="var(--town-ink)"
          />
          <rect
            x={w - 9}
            y="8"
            width="12"
            height={h - 16}
            rx="4"
            fill="var(--pub-seat)"
            stroke="var(--town-ink)"
          />
        </g>
      ) : f.id === "booth" || f.id === "diner-booth" ? (
        <g data-diner-booth>
          <rect
            x="3"
            y="3"
            width={w - 6}
            height={h - 6}
            rx="4"
            fill="var(--shop-counter-top)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <rect
            x="1"
            y="1"
            width={w - 2}
            height="10"
            rx="3"
            fill="var(--diner-seat)"
            stroke="var(--town-ink)"
          />
          <rect
            x="1"
            y={h - 11}
            width={w - 2}
            height="10"
            rx="3"
            fill="var(--diner-seat)"
            stroke="var(--town-ink)"
          />
          <rect
            x={w / 2 - 5}
            y="17"
            width="10"
            height="15"
            fill="var(--town-paper)"
            stroke="var(--town-ink)"
          />
          <circle cx="20" cy={h / 2} r="5" fill="var(--town-paper)" stroke="var(--town-ink)" />
        </g>
      ) : f.id === "hiring" ? (
        <g>
          <rect width={w} height={h} fill="var(--shop-wood)" stroke="var(--town-ink)" />
          <rect x="4" y="3" width={w - 8} height={h - 6} fill="var(--town-paper)" />
          <text x={w / 2} y="16" textAnchor="middle" fontSize="8" fill="var(--town-ink)">
            HIRING
          </text>
        </g>
      ) : (
        <g data-diner-kitchen>
          <rect width={w} height={h} fill="var(--shop-wall)" stroke="var(--town-ink)" />
          <rect x="7" y="7" width={w - 14} height={h - 14} fill="var(--town-glass)" />
          <path d={`M8 ${h - 8}h${w - 16}`} stroke="var(--shop-counter-top)" strokeWidth="5" />
          <text x={w / 2} y="24" textAnchor="middle" fontSize="9" fill="var(--town-paper)">
            KITCHEN PASS
          </text>
        </g>
      )}
    </g>
  );
}
