import type { ReactElement, ReactNode } from "react";

/**
 * A link to another site, opened in a new tab.
 * @param props - Target and link text.
 * @returns The link.
 */
function ExternalLink(
  props: Readonly<{ href: string; children: ReactNode }>,
): ReactElement {
  return (
    <a
      className="link"
      href={props.href}
      target="_blank"
      rel="noreferrer"
    >
      {props.children}
    </a>
  );
}

export { ExternalLink };
