// Questions whose correct answer depends on when the test is taken, with the
// latest facts checked against official sources. Update `CHECKED` and the
// facts together whenever they are re-checked.
import { question } from "./catalogue.ts";
import type { Question } from "./schemas.ts";

/** Day the facts below were last checked, as `YYYY-MM-DD`. */
const CHECKED = "2026-11-03";

interface Bilingual {
  de: string;
  en: string;
}

interface Source {
  label: string;
  url: string;
}

interface CurrentFact {
  /** Catalogue question id. */
  id: string;
  /** Catalogue option that is correct today. */
  option: number;
  /** The latest information behind that option. */
  latest: Bilingual;
  /** A known upcoming change, if any. */
  outlook: Bilingual | null;
  sources: readonly Source[];
}

interface CurrentAffair {
  question: Question;
  fact: CurrentFact;
  /** Whether the official answer key still matches today's facts. */
  upToDate: boolean;
}

const FACTS: readonly CurrentFact[] = [
  {
    id: "g72",
    option: 3,
    latest: {
      de: "Friedrich Merz (CDU), Bundeskanzler seit dem 6. Mai 2025, an der Spitze einer Koalition aus CDU/CSU und SPD.",
      en: "Friedrich Merz (CDU), Chancellor since 6 May 2025, leading a coalition of CDU/CSU and SPD.",
    },
    outlook: null,
    sources: [
      {
        label: "Bundesregierung",
        url: "https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett/friedrich-merz-2342660",
      },
    ],
  },
  {
    id: "g73",
    option: 0,
    latest: {
      de: "CDU/CSU mit 208 und AfD mit 150 der 630 Sitze; danach folgen SPD (120), Grüne (85) und Linke (64). Stand: 3. März 2026.",
      en: "CDU/CSU with 208 and AfD with 150 of the 630 seats, followed by SPD (120), Greens (85) and Linke (64). As of 3 March 2026.",
    },
    outlook: {
      de: "Die nächste reguläre Bundestagswahl ist 2029.",
      en: "The next regular federal election is in 2029.",
    },
    sources: [
      {
        label: "Deutscher Bundestag",
        url: "https://www.bundestag.de/dokumente/textarchiv/2025/kw09-wahlergebnis-1049580",
      },
      {
        label: "wahlen-in-deutschland.de",
        url: "https://wahlen-in-deutschland.de/bBundestagFraktionen.htm",
      },
    ],
  },
  {
    id: "g75",
    option: 0,
    latest: {
      de: "Frank-Walter Steinmeier, Bundespräsident seit dem 19. März 2017; seine zweite Amtszeit endet am 18. März 2027.",
      en: "Frank-Walter Steinmeier, Federal President since 19 March 2017; his second term ends on 18 March 2027.",
    },
    outlook: {
      de: "Die Bundesversammlung wählt am 30. Januar 2027 die Nachfolge. Ab dem 19. März 2027 ändert sich die Antwort, auch wenn der Fragenkatalog noch nicht aktualisiert ist.",
      en: "The Federal Convention elects a successor on 30 January 2027. From 19 March 2027 the answer changes, even before the catalogue is updated.",
    },
    sources: [
      {
        label: "Tagesspiegel",
        url: "https://www.tagesspiegel.de/politik/nachfolge-von-steinmeier-nachster-bundesprasident-wird-am-30-januar-2027-gewahlt-15296220.html",
      },
      {
        label: "Handelsblatt",
        url: "https://www.handelsblatt.com/politik/deutschland/staatsoberhaupt-naechster-bundespraesident-wird-am-30.-januar-2027-gewaehlt/100203704.html",
      },
    ],
  },
  {
    id: "g213",
    option: 2,
    latest: {
      de: "83,3 Millionen am 30. Juni 2026; 84 Millionen ist die nächstliegende Antwort.",
      en: "83.3 million on 30 June 2026; 84 million is the closest option.",
    },
    outlook: null,
    sources: [
      {
        label: "Statistisches Bundesamt",
        url: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsstand/_inhalt.html",
      },
    ],
  },
  {
    id: "g236",
    option: 3,
    latest: {
      de: "27 Mitgliedstaaten, seit das Vereinigte Königreich am 31. Januar 2020 ausgetreten ist.",
      en: "27 member states, since the United Kingdom left on 31 January 2020.",
    },
    outlook: null,
    sources: [
      {
        label: "Europäische Union",
        url: "https://european-union.europa.eu/principles-countries-history/eu-countries_en",
      },
    ],
  },
];

/**
 * Joins facts with their catalogue questions.
 * @param facts - The facts to show.
 * @returns Each question with its fact and whether the key is still right.
 */
function currentAffairs(
  facts: readonly CurrentFact[] = FACTS,
): CurrentAffair[] {
  return facts.map((fact) => {
    const entry = question(fact.id);
    return { question: entry, fact, upToDate: entry.answer === fact.option };
  });
}

export { CHECKED, currentAffairs };
export type { CurrentAffair, CurrentFact };
