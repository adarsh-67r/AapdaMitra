const NUMBERS = [
  { label: "Fire", value: "101" },
  { label: "Police", value: "100" },
  { label: "Medical", value: "108" },
  { label: "Disaster (NDRF)", value: "1078" },
];

export default function EmergencyNumbers() {
  return (
    <div className="relative z-10 px-6 md:px-10 py-6 border-y border-white/10">
      <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm">
        {NUMBERS.map((n) => (
          <span key={n.label} className="text-text-muted">
            <b className="text-text">{n.label}</b> {n.value}
          </span>
        ))}
      </div>
    </div>
  );
}
