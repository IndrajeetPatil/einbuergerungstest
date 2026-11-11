# Third-party notices

The code in this repository is MIT-licensed (see [LICENSE](LICENSE)). The
question data in `src/data/catalogue.json` and `public/img/` combines the
sources below, each under its own terms.

| Source | Used for | Terms |
| --- | --- | --- |
| [BAMF Gesamtfragenkatalog](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.html), edition 07.05.2025 | German questions, options, pictures | Official publication of the Bundesamt für Migration und Flüchtlinge |
| [lezeroq/lebenindeutschland](https://github.com/lezeroq/lebenindeutschland) | Answer key, English translations, PDF parsing approach | MIT, Copyright (c) 2026 Artsiom Kaval |
| [abdullahbutt/leben-in-deutschland-test](https://github.com/abdullahbutt/leben-in-deutschland-test) | Explanations | MIT, Copyright (c) 2026 Abdullah Butt |

## Photos

The BAMF PDF credits five photos to the Bundesregierung or the Deutscher
Bundestag. They are not used. Four are replaced by freely licensed photos from
Wikimedia Commons, which keep their own licences (not MIT) and were resized
and converted to WebP; `g70` has no free photo of the same scene and is shown
without a picture. `scripts/photos.py` pins each file.

| Question | Photo | Author | Licence | Changes |
| --- | --- | --- | --- | --- |
| `g55` | [West facade of the Reichstag building, Berlin](https://commons.wikimedia.org/wiki/File:West_facade_of_the_Reichstag_building,_Berlin.jpg) | Christian David | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Resized |
| `g181` | [Ghetto Heroes Monument, Warsaw](https://commons.wikimedia.org/wiki/File:Kniefall.jpg) | Raymond | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) | Resized |
| `g216` | [Plenarsaal des Bundestags mit dem Bundesadler](https://commons.wikimedia.org/wiki/File:Berlin,_Reichstagsgeb%C3%A4ude,_Plenarsaal_2014-07_(11).jpg) | HerrAdams | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Resized |
| `g235` | [Helmut Kohl – Kanzler der Europäischen Einigung](https://commons.wikimedia.org/wiki/File:KAS-Kohl,_Helmut-Bild-14083-2.jpg) (KAS/ACDP 10-001: 14083) | CDU, provided by the Konrad-Adenauer-Stiftung | [CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en) | Cropped to the photo of Mitterrand and Kohl at Verdun |

The edited pictures in `public/img/` are shared under the same licences.

## MIT licence text of the MIT-licensed sources

```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
