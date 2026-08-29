/**
 * The product mark: a pulse trace inside a bordered square.
 *
 * A single line that runs flat, spikes, and returns to flat — the shape of a
 * monitor readout, which is what this system is. Drawn rather than shipped as
 * an image so it takes the accent colour from the theme and stays sharp at any
 * size; it is small enough that a raster of it would be a download to say what
 * six drawing instructions already say.
 *
 * Decorative here: everywhere it appears it sits beside the word AapdaMitra,
 * so a screen reader that also announced the mark would say the name twice.
 */
export default function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="border border-accent rounded-md flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={Math.round(size * 0.53)}
        height={Math.round(size * 0.53)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    </div>
  );
}
