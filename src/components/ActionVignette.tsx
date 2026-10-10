import { useEffect } from "react";
import "./action-vignette.css";

export type VignetteKind = "strength" | "run" | "study" | "drink" | "sleep" | "food" | "work" | "gamble" | "shady" | "shop" | "social" | "recover" | "travel" | "money" | "tv";

/** Use action IDs, not button text: translations or label changes won't break scenes. */
export function vignetteForAction(id: string): VignetteKind | null {
  if (["lift", "home-workout"].includes(id)) return "strength";
  if (id === "jog") return "run";
  if (["study-desk", "library", "enroll"].includes(id)) return "study";
  if (id === "round") return "drink";
  if (id === "sleep") return "sleep";
  if (id.startsWith("tv-") || id.startsWith("game-")) return "tv";
  if (id.startsWith("read-")) return "study";
  if (["cook", "hot-meal", "eat-snack", "snack", "soup", "breakfast", "fizzy-pop", "shop-sandwich", "shop-coffee"].includes(id)) return "food";
  if (["shift", "lunch-shift", "promote"].includes(id)) return "work";
  if (["slots", "high-dice", "alley-dice"].includes(id)) return "gamble";
  if (["mug", "sell-goods", "gang-mugging"].includes(id)) return "shady";
  if (["buy-house", "buy-shoes", "buy-alarm", "buy-smokes", "furniture", "sell-shoes", "sell-alarm"].includes(id) || id.startsWith("buy-")) return "shop";
  if (["chat-up", "relax", "encounter"].includes(id)) return "social";
  if (["recovery"].includes(id)) return "recover";
  if (["departures"].includes(id)) return "travel";
  if (["deposit-50", "deposit-all", "withdraw-50", "withdraw-all", "fine"].includes(id) || id.startsWith("bank-")) return "money";
  return null;
}

export const VIGNETTE_TITLES: Record<VignetteKind, string> = {
  strength: "FEEL THE BURN", run: "ONE MORE LAP", study: "BRAIN POWER",
  drink: "BOTTOMS UP", sleep: "LIGHTS OUT", food: "GOOD EATS",
  work: "CLOCKING IN", gamble: "LUCKY DAY?", shady: "QUESTIONABLE CHOICES",
  shop: "NEW GEAR", social: "MAKING FRIENDS", recover: "PATCHING UP",
  travel: "ON THE MOVE", money: "MONEY TALKS", tv: "CHANNEL SURFING",
};

/** Success actions only. Results are computed by runAction, never by artwork. */
export function ActionVignette({
  kind, changes, message, onDone,
}: {
  kind: VignetteKind; changes: string[]; message: string; onDone: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1850);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  const gains = changes.filter(change => /\+\d/.test(change) && /Strength|Intelligence|Charm|Energy|Cash|Work XP|Karma/.test(change));
  const headline = gains.slice(0, 2).map(c => c.replace(": ", " ")).join("   ") || changes.find(c => /-\d/.test(c))?.replace(": ", " ") || "ACTION COMPLETE";
  return (
    <div data-action-vignette={kind} className={"action-vignette action-vignette-"+kind} role="status" aria-label={VIGNETTE_TITLES[kind]}>
      <div className="action-vignette-card">
        <div className="action-vignette-title">{VIGNETTE_TITLES[kind]}</div>
        <svg viewBox="0 0 320 218" role="img" aria-label={kind+" animation"} className="action-vignette-svg">
          <rect width="320" height="218" rx="12" fill="#f5e9d1"/>
          <path d="M0 177H320" stroke="#4b4552" strokeWidth="5"/>
          <ellipse cx="158" cy="180" rx="105" ry="12" fill="#48434a" opacity=".13"/>
          {kind === "strength" && <g data-vignette-scene="strength">
            <path d="M62 161V80H257V161" fill="none" stroke="#5f6472" strokeWidth="7"/>
            <path d="M84 150H230" stroke="#635348" strokeWidth="12" strokeLinecap="round"/>
            <g className="vig-press" stroke="#2c2b34" strokeWidth="5" strokeLinecap="round" fill="none">
              <circle cx="158" cy="109" r="14" fill="#ecd0aa"/>
              <path d="M158 124V151M158 131L124 93M158 131L192 93M158 151L137 174M158 151L179 174"/>
              <path d="M91 86H225" strokeWidth="6"/>
              <rect x="88" y="71" width="11" height="28" rx="2" fill="#566a82"/>
              <rect x="217" y="71" width="11" height="28" rx="2" fill="#566a82"/>
            </g>
            <path d="M207 48q15 -17 23 1" fill="none" stroke="#73b5d3" strokeWidth="4"/>
          </g>}
          {kind === "study" && <g data-vignette-scene="study">
            <rect x="72" y="135" width="185" height="14" rx="3" fill="#986b51" stroke="#473b37" strokeWidth="4"/>
            <path d="M82 148V178M248 148V178" stroke="#473b37" strokeWidth="7"/>
            <rect x="186" y="121" width="45" height="13" fill="#faf3cf" stroke="#4d515d" strokeWidth="3"/>
            <path d="M208 120V108" stroke="#777c89" strokeWidth="2"/>
            <g className="vig-study" stroke="#292a34" strokeWidth="5" fill="none" strokeLinecap="round">
              <path d="M126 109L139 145M139 143L115 176M139 143L163 176M129 122L177 126"/>
              <circle cx="126" cy="92" r="16" fill="#ebcca6"/>
              <path d="M111 92L123 96M133 96L142 92" strokeWidth="3"/>
            </g>
            <text x="233" y="88" fontWeight="900" fontSize="24" fill="#c57b54">?!</text>
          </g>}
          {kind === "drink" && <g data-vignette-scene="drink">
            <rect x="44" y="156" width="235" height="18" rx="4" fill="#825a44" stroke="#433943" strokeWidth="4"/>
            <path d="M46 174V204M273 174V204" stroke="#40383d" strokeWidth="7"/>
            <g className="vig-chug" stroke="#302e39" strokeWidth="5" strokeLinecap="round" fill="none">
              <circle cx="153" cy="93" r="17" fill="#e8c29a"/>
              <path d="M153 109V147M153 122L113 151M153 122L201 91M153 147L127 174M153 147L185 174"/>
              <path d="M195 76H215V104H195Z" fill="#eabf62" strokeWidth="3"/>
              <path d="M215 82H227V99H215" strokeWidth="4"/>
            </g>
            <text x="235" y="67" fontWeight="bold" fontSize="19" fill="#87694b">GLUG!</text>
          </g>}
          {kind === "sleep" && <g data-vignette-scene="sleep">
            <rect x="59" y="112" width="208" height="59" rx="8" fill="#8c735e" stroke="#453b3c" strokeWidth="4"/>
            <rect x="67" y="117" width="192" height="31" rx="7" fill="#94b4b1"/>
            <rect x="69" y="115" width="64" height="29" rx="8" fill="#f8edca" stroke="#46404a" strokeWidth="3"/>
            <g className="vig-sleep"><circle cx="111" cy="126" r="13" fill="#e9c89e" stroke="#35323a" strokeWidth="3"/><path d="M103 125h5m7 0h5" stroke="#35323a" strokeWidth="2"/></g>
            <path d="M131 151H255V162H129Z" fill="#668ba9"/>
            <text x="210" y="71" fontSize="26" fill="#626eac" fontWeight="bold" className="vig-zzz">Z z z</text>
          </g>}
          {kind === "tv" && <g data-vignette-scene="tv">
            <rect x="68" y="52" width="185" height="111" rx="11" fill="#313443" stroke="#302b36" strokeWidth="6"/>
            <rect x="80" y="62" width="161" height="82" rx="5" fill="#93c9c4"/>
            <g className="vig-zzz"><path d="M90 84h50m-48 12h86m-86 12h68" stroke="#f8e7c1" strokeWidth="6" strokeLinecap="round"/><circle cx="207" cy="91" r="15" fill="#e5c26d"/></g>
            <path d="M158 162v16m-32 0h64" stroke="#302b36" strokeWidth="6" strokeLinecap="round"/>
            <g className="vig-breathe" stroke="#33313c" strokeWidth="5" strokeLinecap="round" fill="none">
              <circle cx="34" cy="125" r="13" fill="#edcba5"/><path d="M33 139l7 22m-7-12l30-8m-21 19l-12 17m12-17l27 16"/>
            </g>
          </g>}
          {kind === "run" && <g data-vignette-scene="run">
            <g className="vig-runner" stroke="#303039" strokeWidth="6" fill="none" strokeLinecap="round">
              <circle cx="164" cy="62" r="15" fill="#edcda6"/><path d="M160 79L145 122L181 144M151 107L104 115M151 109L198 101M145 122L109 161M145 122L203 166"/>
            </g><path d="M38 130H88M28 144H73" stroke="#b4a99d" strokeWidth="4"/>
          </g>}
          {kind === "food" && <g data-vignette-scene="food">
            <rect x="75" y="145" width="175" height="13" rx="3" fill="#aa805f" stroke="#4a4040" strokeWidth="4"/>
            <path d="M93 159V178M231 159V178" stroke="#514443" strokeWidth="7"/>
            <ellipse cx="195" cy="142" rx="37" ry="9" fill="#eee6d1" stroke="#5b5350" strokeWidth="3"/>
            <path d="M177 139q15 -19 27 0" fill="#bc8147" stroke="#785e3a" strokeWidth="3"/>
            <g className="vig-eat" stroke="#34303a" strokeWidth="5" fill="none" strokeLinecap="round">
              <circle cx="119" cy="94" r="17" fill="#efcca6"/><path d="M119 112V145M119 125L169 116M119 125L94 145M119 145L104 178M119 145L140 178"/>
            </g>
          </g>}
          {kind === "work" && <g data-vignette-scene="work">
            <rect x="162" y="82" width="113" height="69" rx="5" fill="#647c94" stroke="#373941" strokeWidth="5"/>
            <rect x="171" y="92" width="95" height="47" rx="2" fill="#b7dbda"/>
            <path d="M218 151V169M186 170H250" stroke="#4c4d56" strokeWidth="6"/>
            <g className="vig-work" stroke="#2f303b" strokeWidth="5" strokeLinecap="round" fill="none">
              <circle cx="112" cy="86" r="15" fill="#f0cfa9"/><path d="M112 103V145M112 119L174 133M112 121L88 143M112 145L91 177M112 145L139 177"/>
            </g><text x="206" y="65" fontSize="15" fontWeight="bold" fill="#58677b">WORK WORK WORK</text>
          </g>}
          {kind === "gamble" && <g data-vignette-scene="gamble">
            <ellipse cx="170" cy="153" rx="103" ry="31" fill="#2d836d" stroke="#4b384a" strokeWidth="10"/>
            <g className="vig-dice"><rect x="123" y="127" width="35" height="35" rx="5" fill="#fff8e6" stroke="#3d3440" strokeWidth="4"/><circle cx="140" cy="143" r="5" fill="#473947"/><rect x="179" y="132" width="35" height="35" rx="5" fill="#fff8e6" stroke="#3d3440" strokeWidth="4"/><circle cx="189" cy="143" r="4" fill="#473947"/><circle cx="203" cy="156" r="4" fill="#473947"/></g>
            <text x="149" y="86" fontSize="34" textAnchor="middle" fill="#d9a84d">★</text>
          </g>}
          {["shady", "shop", "social", "recover", "travel", "money"].includes(kind) && <g data-vignette-scene={kind}>
            <g className="vig-gesture" stroke="#33323b" strokeWidth="5" strokeLinecap="round" fill="none">
              <circle cx="123" cy="94" r="17" fill="#eacaa2"/>
              <path d="M123 111V147M123 127L157 112M123 127L95 144M123 147L102 177M123 147L144 177"/>
              <circle cx="211" cy="94" r="16" fill="#bc957d"/>
              <path d="M211 111V147M211 127L176 113M211 127L238 143M211 147L192 177M211 147L231 177"/>
            </g>
            <text x="168" y="74" textAnchor="middle" fontSize="29" fill="#a67849">{kind === "money" ? "$" : kind === "shady" ? "!" : kind === "recover" ? "+" : kind === "travel" ? "→" : kind === "shop" ? "★" : "♥"}</text>
          </g>}
        </svg>
        <div className="action-vignette-gain" aria-live="polite">{headline}</div>
        <p className="action-vignette-message">{message}</p>
      </div>
    </div>
  );
}
