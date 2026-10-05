# Design system: Tour Portfolio Intelligence

Direction: **ship's manifest**. The look is an editorial, ledger-like interface for an executive audience. Most of the page is warm paper and ink navy, with brass as the single accent. Data reads like a printed departures register: serif display figures, mono labels and hairline rules.

## Tokens (`src/app/globals.css`)

| Role | Value | Use |
|---|---|---|
| Paper | `#f3efe5` | Page background, with a faint grain |
| Card | `#fbf9f4` | Panels and tables |
| Ink | `#10212e` | Text, masthead, primary actions, tooltips |
| Brass | `#b5741c` / light `#e3b261` | Accent, focus rings, active nav and range |
| Rule | `#dcd4c2` | Hairlines, borders, ledger dividers |
| Muted text | `#5d6670` | Secondary text (about 5:1 on paper) |
| Series 1 / 2 | `#0b6fa4` river / `#c9781a` brass | Chart series; the pair passes the dataviz validator on `#fbf9f4` |
| Status | good `#2f8a4c`, warning `#e0a12a`, critical `#c2412f` | Reserved for break-even state. Always paired with an icon or label. |

## Type

- **Display:** Instrument Serif, used for headlines, panel titles and hero figures.
- **Body:** Schibsted Grotesk, used for UI text.
- **Ledger:** IBM Plex Mono, used for eyebrows (`.eyebrow`), column heads, badges, axis ticks and money columns.

## Rules

- Panels have a 1px rule border and a soft, low shadow. There are no heavy shadows or gradients.
- KPI and stat rows are a single ledger panel split by 1px rules, not separate floating cards.
- The year filter is a route line: click a stop for one year, then a second stop to extend the range.
- The page entrance uses one staggered rise (`.rise`, `--i`). It is disabled under `prefers-reduced-motion`.
- Focus is shown as a 2px brass outline. Interactive targets are at least 36 to 44px tall.
- Never use purple or "AI gradient" styling. The AI insight is an ink panel with brass labels, marked Demo.
