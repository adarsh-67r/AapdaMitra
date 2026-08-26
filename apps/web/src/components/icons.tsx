/**
 * Authored icon set. One family, one geometry: 24×24 box, 1.75 stroke, round
 * caps and joins, `currentColor` throughout — so an icon inherits the colour of
 * whatever it sits in and stays optically consistent beside its label.
 *
 * These replace the emoji that previously stood in for icons. Emoji render
 * differently on every platform, carry their own colour, and can't match a type
 * weight, which makes them read as placeholders rather than as an icon system.
 */

type IconProps = {
  size?: number;
  className?: string;
  /** Decorative by default; pass a label when the icon is the only content. */
  label?: string;
};

function Svg({ size = 24, className, label, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  );
}

export function ShelterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
      <path d="M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21" />
    </Svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-4.5-4.5Z" />
      <path d="M14 2.5V7h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.6 13.6l-1.6 1.6a13.4 13.4 0 0 1-5.2-5.2l1.6-1.6a1.5 1.5 0 0 0 .3-1.7L9.4 4a1.5 1.5 0 0 0-1.8-.8l-2.5.8A2 2 0 0 0 3.7 6.2 17.6 17.6 0 0 0 17.8 20.3a2 2 0 0 0 2.2-1.4l.8-2.5a1.5 1.5 0 0 0-.8-1.8l-2.7-1.3a1.5 1.5 0 0 0-1.7.3Z" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1.5 1.5 0 0 0 1.3-.8l.7-1.4A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.3.8l.7 1.4a1.5 1.5 0 0 0 1.3.8h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </Svg>
  );
}

export function SosIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </Svg>
  );
}
