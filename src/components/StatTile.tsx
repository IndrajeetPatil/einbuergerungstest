import type { ReactElement } from "react";

/**
 * A labelled figure.
 * @param props - Label and value.
 * @returns The definition-list entry.
 */
function StatTile(
  props: Readonly<{ label: string; value: string }>,
): ReactElement {
  const { label, value } = props;
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold">{value}</dd>
    </div>
  );
}

export { StatTile };
