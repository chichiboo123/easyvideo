"use client";

interface MIconProps {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Google Material Symbols (Rounded) icon. The font is loaded in layout.tsx.
export default function MIcon({ name, size = 20, fill = false, weight = 400, className, style }: MIconProps) {
  return (
    <span
      className={`material-symbols-rounded${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
