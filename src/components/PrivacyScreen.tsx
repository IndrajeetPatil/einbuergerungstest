import type { ReactElement, ReactNode } from "react";

import { ExternalLink } from "./ExternalLink.tsx";

const ISSUES = "https://github.com/IndrajeetPatil/einbuergerungstest/issues";

const SECTIONS: readonly { heading: string; body: ReactNode }[] = [
  {
    heading: "Kostenlos · Free",
    body: (
      <>
        No price, no adverts, no account, and no sign-up. The app is open-source
        software under the MIT licence, so anyone can read{" "}
        <ExternalLink href="https://github.com/IndrajeetPatil/einbuergerungstest">
          its code
        </ExternalLink>
        .
      </>
    ),
  },
  {
    heading: "Ihre Daten bleiben bei Ihnen · Your data stays with you",
    body: (
      <>
        Your answers, scores, and settings are saved in this browser, on this
        device, and are never uploaded. There is no server that could receive
        them. Clearing your browser data deletes them, so export a backup under
        Ihre Daten · Your data on the overview to keep them or move them to
        another device.
      </>
    ),
  },
  {
    heading: "Besuche zählen · Counting visits",
    body: (
      <>
        Like the rest of indrapatil.com, the site counts visits with Google
        Analytics: Google learns that the page was opened, with details such as
        your browser and rough location, but never your answers or progress. The{" "}
        <ExternalLink href="https://www.indrapatil.com/privacy/">
          privacy notice
        </ExternalLink>{" "}
        has the details. The app works the same if your browser blocks it.
      </>
    ),
  },
  {
    heading: "Kontakt · Get in touch",
    body: (
      <>
        Spotted a mistake, a privacy concern, or something that does not work?
        Open an issue on <ExternalLink href={ISSUES}>GitHub</ExternalLink>.
      </>
    ),
  },
];

/**
 * What the app does with your data, in plain words.
 * @returns The privacy view.
 */
function PrivacyScreen(): ReactElement {
  return (
    <main className="mx-auto max-w-5xl px-5 pt-10 pb-24 md:px-8">
      <h1 className="text-title">
        Datenschutz <span className="text-muted">· Privacy</span>
      </h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        This trainer is free and private: what you practise stays on your
        device.
      </p>
      <div className="mt-6 divide-y divide-line border-t border-line">
        {SECTIONS.map((section) => (
          <section
            key={section.heading}
            className="max-w-prose py-6"
          >
            <h2 className="text-heading">{section.heading}</h2>
            <p className="mt-2">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

export { PrivacyScreen };
