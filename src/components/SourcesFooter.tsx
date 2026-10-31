import type { ReactElement } from "react";

import { catalogue } from "#lib/catalogue.ts";

/**
 * Credits for the question data and the licence.
 * @returns The footer.
 */
function SourcesFooter(): ReactElement {
  return (
    <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
      <p>
        Questions and answers:{" "}
        <a
          className="link"
          href={catalogue.source.url}
          target="_blank"
          rel="noreferrer"
        >
          BAMF Gesamtfragenkatalog
        </a>
        , edition {catalogue.source.edition}. English translations and answer
        key via{" "}
        <a
          className="link"
          href="https://github.com/lezeroq/lebenindeutschland"
          target="_blank"
          rel="noreferrer"
        >
          lezeroq/lebenindeutschland
        </a>
        ; explanations via{" "}
        <a
          className="link"
          href="https://github.com/abdullahbutt/leben-in-deutschland-test"
          target="_blank"
          rel="noreferrer"
        >
          abdullahbutt/leben-in-deutschland-test
        </a>{" "}
        (both MIT). This app is MIT-licensed open-source software; your progress
        stays on your computer in <code>data/progress.sqlite</code>.
      </p>
    </footer>
  );
}

export { SourcesFooter };
