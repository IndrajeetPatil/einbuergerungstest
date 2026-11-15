import type { ReactElement } from "react";

import { catalogue } from "#lib/catalogue.ts";

import { ExternalLink } from "./ExternalLink.tsx";

/**
 * Credits for the question data and the licence.
 * @returns The footer.
 */
function SourcesFooter(): ReactElement {
  return (
    <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">
      <p>
        Questions and answers:{" "}
        <ExternalLink href={catalogue.source.url}>
          BAMF Gesamtfragenkatalog
        </ExternalLink>
        , edition {catalogue.source.edition}. English translations and answer
        key via{" "}
        <ExternalLink href="https://github.com/lezeroq/lebenindeutschland">
          lezeroq/lebenindeutschland
        </ExternalLink>
        ; explanations via{" "}
        <ExternalLink href="https://github.com/abdullahbutt/leben-in-deutschland-test">
          abdullahbutt/leben-in-deutschland-test
        </ExternalLink>{" "}
        (both MIT). This app is free, MIT-licensed open-source software; see{" "}
        <a
          className="link"
          href="#datenschutz"
        >
          Datenschutz · Privacy
        </a>{" "}
        for what happens to your data.
      </p>
    </footer>
  );
}

export { SourcesFooter };
