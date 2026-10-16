/** First-person stick arms at the bottom of the screen; they sway while idle and drop away during activity scenes. */
export function FirstPersonHands({ acting }: { acting: boolean }) {
  return (
    <div aria-hidden className={`fp-hands pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[26%] transition-transform duration-500 ${acting ? "translate-y-full" : ""}`}>
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax meet" className="h-full w-full">
        <g className="fp-arm fp-arm-l" stroke="var(--foreground)" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M40 170 Q70 110 110 92" />
          <circle cx="114" cy="90" r="15" fill="var(--card)" strokeWidth="6" />
        </g>
        <g className="fp-arm fp-arm-r" stroke="var(--foreground)" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M360 170 Q330 110 290 92" />
          <circle cx="286" cy="90" r="15" fill="var(--card)" strokeWidth="6" />
        </g>
      </svg>
    </div>
  );
}
