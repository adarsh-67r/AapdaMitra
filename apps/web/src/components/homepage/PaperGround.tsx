/**
 * The ground the instrument is printed on: a plotting-sheet ruling with a
 * coarser major grid every fifth line, faded out toward the bottom, over a fine
 * grain that keeps large areas of flat colour from looking like dead pixels.
 *
 * Deliberately static. This sits behind every section on the page, so anything
 * that moved here would be movement the user can never finish reading.
 */
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
       <filter id='n'>
         <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>
         <feColorMatrix type='saturate' values='0'/>
       </filter>
       <rect width='120' height='120' filter='url(#n)' opacity='0.55'/>
     </svg>`
  );

export default function PaperGround() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Minor ruling, 24px */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 88%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 88%)",
        }}
      />
      {/* Major ruling, every fifth line */}
      <div
        className="absolute inset-0 opacity-[0.65]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 88%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 42%, transparent 88%)",
        }}
      />
      {/* Paper grain */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "120px 120px" }}
      />
    </div>
  );
}
