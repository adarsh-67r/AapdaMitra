export default function Footer() {
  return (
    <footer className="relative z-10 px-6 md:px-10 py-10 border-t border-white/10">
      <div className="flex flex-wrap justify-between gap-6">
        <p className="font-semibold">
          Report it. Route it.
          <br />
          Resolve it.
        </p>
        <div className="flex gap-10 font-mono text-xs text-text-muted">
          <div className="flex flex-col gap-2">
            <span>Report Incident</span>
            <span>Live Map</span>
          </div>
          <div className="flex flex-col gap-2">
            <span>Sign In</span>
            <span>Emergency: 112</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
