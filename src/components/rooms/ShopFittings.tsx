import { HospitalityFitting } from "@/components/rooms/HospitalityFittings";
import type { ShopFixture, ShopId } from "@/lib/walkable-shops";

/** Furniture keeps its collision footprint; shallow faces add depth without changing projection. */
export function ShopFitting({ fixture: f, shop }: { fixture: ShopFixture; shop: ShopId }) {
  if (shop === "diner" || shop === "bar") return <HospitalityFitting fixture={f} venue={shop} />;
  const w = f.w * 24,
    h = f.d * 24;
  const counter = f.id === "checkout" || f.id === "pawn-counter" || f.id === "catalogue" || f.id === "premium";
  const shelf = f.id === "shelves" || f.id === "curiosities" || f.id === "aisle";
  return (
    <g
      transform={`translate(${f.x * 24} ${f.y * 24})`}
      data-shop-fitting={f.id}
      pointerEvents="none"
    >
      <rect x="3" y="4" width={w} height={h} rx="3" fill="var(--town-ink)" opacity=".14" />
      {counter ? (
        <g data-shop-counter>
          <rect
            width={w}
            height={h}
            rx="3"
            fill={f.id === "premium" ? "#4e3b65" : "var(--shop-wood)"}
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <path d={`M0 ${h - 9}h${w}v9H0Z`} fill={f.id === "premium" ? "#c1a778" : "var(--shop-wood-dark)"} stroke="var(--town-ink)" />
          <rect
            x="3"
            y="3"
            width={w - 6}
            height={h - 15}
            rx="2"
            fill={shop === "pawn" ? "var(--shop-case-glass)" : "var(--shop-counter-top)"}
            stroke="var(--town-ink)"
          />
          {shop === "pawn" && (
            <g fill="var(--shop-brass)" stroke="var(--town-ink)">
              <circle cx="22" cy="18" r="7" />
              <circle cx="22" cy="18" r="3" fill="var(--shop-case-glass)" />
              <path d="M40 10l7 7 -7 8 -7-8Z" />
              <rect x="54" y="11" width="17" height="14" rx="3" />
            </g>
          )}
          <g transform={`translate(${w - 29} 7)`} data-shop-till>
            <rect width="23" height="22" rx="2" fill="var(--town-glass)" stroke="var(--town-ink)" />
            <rect x="3" y="3" width="17" height="8" fill="var(--shop-screen)" />
            <path d="M4 15h4m3 0h4m3 0h2M4 19h15" stroke="var(--town-paper)" strokeWidth="2" />
          </g>
          <rect
            x="8"
            y={h - 22}
            width={Math.max(25, w - 49)}
            height="8"
            fill="var(--shop-counter-mat)"
            rx="2"
          />
          <text x={w / 2} y={h - 1} textAnchor="middle" fontSize="8" fill="var(--town-paper)">
            {shop === "pawn" ? "VALUATIONS" : f.id === "premium" ? "PREMIUM" : f.id === "catalogue" ? "BASIC" : "CHECKOUT"}
          </text>
        </g>
      ) : shelf ? (
        <g data-stocked-shelf>
          <rect
            width={w}
            height={h}
            rx="2"
            fill="var(--shop-wood-dark)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          {[0, 1, 2].map((row) => (
            <g key={row} transform={`translate(5 ${6 + (row * (h - 12)) / 3})`}>
              <rect width={w - 10} height={(h - 12) / 3 - 5} fill="var(--shop-shelf-back)" />
              {Array.from({ length: f.id === "aisle" ? 2 : 4 }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${3 + (i * (w - 14)) / (f.id === "aisle" ? 2 : 4)} 3)`}
                >
                  {shop === "pawn" ? (
                    row === 0 ? (
                      <path
                        d="M1 7h4l2-6h4l2 6h4v11H1Z"
                        fill="var(--town-glass)"
                        stroke="var(--town-ink)"
                      />
                    ) : row === 1 ? (
                      <circle
                        cx="8"
                        cy="10"
                        r="7"
                        fill="var(--shop-brass)"
                        stroke="var(--town-ink)"
                      />
                    ) : (
                      <path
                        d="M2 3h10v18H2Z"
                        fill="var(--shop-product-green)"
                        stroke="var(--town-ink)"
                      />
                    )
                  ) : (
                    <>
                      <rect
                        width={f.id === "aisle" ? 8 : 10}
                        height={Math.min(20, (h - 12) / 3 - 12)}
                        rx="2"
                        fill={
                          [
                            "var(--shop-product-red)",
                            "var(--shop-product-green)",
                            "var(--shop-product-gold)",
                            "var(--shop-product-blue)",
                          ][(row + i) % 4]
                        }
                        stroke="var(--town-ink)"
                        strokeWidth=".7"
                      />
                      <path d="M2 7h6" stroke="var(--town-paper)" strokeWidth="3" />
                    </>
                  )}
                </g>
              ))}
              <path
                d={`M0 ${(h - 12) / 3 - 3}h${w - 10}`}
                stroke="var(--shop-counter-top)"
                strokeWidth="3"
              />
            </g>
          ))}
        </g>
      ) : f.id === "sofa-display" ? (
        <g data-showroom-sofa>
          <rect x="-5" y="-5" width={w + 10} height={h + 10} rx="8" fill="var(--shop-rug)" />
          <rect
            width={w}
            height={h}
            rx="7"
            fill="var(--shop-sofa-dark)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <rect
            x="9"
            y="12"
            width={w / 2 - 10}
            height={h - 20}
            rx="4"
            fill="var(--shop-sofa)"
            stroke="var(--town-ink)"
          />
          <rect
            x={w / 2 + 1}
            y="12"
            width={w / 2 - 10}
            height={h - 20}
            rx="4"
            fill="var(--shop-sofa)"
            stroke="var(--town-ink)"
          />
          <rect
            x="2"
            y="5"
            width="8"
            height={h - 10}
            rx="3"
            fill="var(--shop-sofa)"
            stroke="var(--town-ink)"
          />
          <rect
            x={w - 10}
            y="5"
            width="8"
            height={h - 10}
            rx="3"
            fill="var(--shop-sofa)"
            stroke="var(--town-ink)"
          />
          <path d={`M11 7h${w - 22}`} stroke="var(--town-ink)" />
        </g>
      ) : f.id === "bed-display" ? (
        <g data-showroom-bed>
          <rect
            width={w}
            height={h}
            rx="3"
            fill="var(--shop-wood-dark)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <rect
            x="5"
            y="5"
            width={w - 10}
            height={h - 12}
            rx="4"
            fill="var(--town-paper)"
            stroke="var(--town-ink)"
          />
          <rect
            x="11"
            y="10"
            width={w / 2 - 14}
            height="20"
            rx="6"
            fill="var(--shop-linen)"
            stroke="var(--town-ink)"
          />
          <rect
            x={w / 2 + 3}
            y="10"
            width={w / 2 - 14}
            height="20"
            rx="6"
            fill="var(--shop-linen)"
            stroke="var(--town-ink)"
          />
          <path
            d={`M6 37h${w - 12}v${h - 46}H6Z`}
            fill="var(--shop-bedspread)"
            stroke="var(--town-ink)"
          />
          <path d={`M6 45h${w - 12}`} stroke="var(--shop-linen)" strokeWidth="5" />
        </g>
      ) : f.id === "shop-board" ? (
        <g data-shop-noticeboard>
          <rect
            width={w}
            height={h}
            fill="var(--shop-wood)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <rect x="5" y="3" width="17" height="17" fill="var(--town-paper)" />
          <rect x="26" y="5" width="16" height="14" fill="var(--shop-product-gold)" />
          <path d="M8 8h11m-11 4h8M29 9h10" stroke="var(--town-ink)" />
        </g>
      ) : (
        <g data-shop-office>
          <rect
            width={w}
            height={h}
            fill="var(--shop-wall)"
            stroke="var(--town-ink)"
            strokeWidth="2"
          />
          <rect
            x="12"
            y="3"
            width={w - 24}
            height={h - 9}
            fill="var(--shop-wood)"
            stroke="var(--town-ink)"
          />
          <circle cx={w - 22} cy={h / 2} r="2" fill="var(--shop-brass)" />
          <text x={w / 2} y="18" fontSize="9" textAnchor="middle" fill="var(--town-paper)">
            STAFF ONLY
          </text>
        </g>
      )}
    </g>
  );
}

export function ShopShell({ shop }: { shop: ShopId }) {
  return (
    <g pointerEvents="none" data-shop-shell={shop}>
      <rect
        x="24"
        y="24"
        width="384"
        height="312"
        rx="2"
        fill={
          shop === "bar"
            ? "var(--pub-floor)"
            : shop === "pawn"
              ? "var(--shop-pawn-floor)"
              : "var(--shop-floor)"
        }
        stroke="var(--town-ink)"
        strokeWidth="3"
      />
      {shop === "shop" || shop === "diner" ? (
        <g stroke="var(--shop-tile-line)" opacity=".35">
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d={`M${24 + i * 24} 24v312`} />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <path key={i} d={`M24 ${24 + i * 24}h384`} />
          ))}
        </g>
      ) : (
        <g stroke="var(--shop-wood-dark)" opacity=".16">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M24 ${48 + i * 24}h384`} />
          ))}
        </g>
      )}
      <path d="M24 24h384v22H24Z" fill="var(--shop-wall)" stroke="var(--town-ink)" />
      <path d="M24 46h384M24 24v312m384-312v312" stroke="var(--shop-wood-dark)" strokeWidth="5" />
      <rect x="43" y="28" width="106" height="13" rx="2" fill="var(--town-ink)" />
      <text x="96" y="38" textAnchor="middle" fill="var(--town-paper)" fontSize="9">
        {shop === "shop"
          ? "OPEN · REGRETTABLY"
          : shop === "pawn"
            ? "NO HAUNTED RETURNS"
            : shop === "diner"
              ? "COOK STILL ALIVE"
              : shop === "bar"
                ? "LAST ORDERS. AGAIN."
                : "SHOWROOM · NO NAPS"}
      </text>
      <rect
        x="191"
        y="292"
        width="50"
        height="20"
        rx="3"
        fill="var(--shop-counter-mat)"
        opacity=".65"
      />
    </g>
  );
}
