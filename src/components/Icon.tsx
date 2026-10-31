import type { ReactElement } from "react";

const PATHS = {
  check: "M3 8.5l3.2 3L13 4.5",
  cross: "M4 4l8 8M12 4l-8 8",
  flag: "M3.5 14V2.5M3.5 3h8l-1.8 2.75L11.5 8.5h-8",
  clock: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 4.75V8l2.25 1.5",
  left: "M13 8H3m4-4L3 8l4 4",
  right: "M3 8h10M9 4l4 4-4 4",
} as const;

const TONES = {
  inherit: "",
  accent: "text-accent",
  rust: "text-rust",
  ochre: "text-ochre",
} as const;

const SIZES = { sm: "size-3", md: "size-3.5", lg: "size-4" } as const;

type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
}

/**
 * A monochrome hairline icon; decorative, so hidden from assistive technology.
 * @param props - Icon name, colour tone and size.
 * @returns The SVG icon.
 */
function Icon(props: Readonly<Props>): ReactElement {
  const { name, tone = "inherit", size = "lg" } = props;
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${SIZES[size]} ${TONES[tone]}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export { Icon };
