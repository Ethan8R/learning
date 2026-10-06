# Design system: Microsoft Fluent 2 (Fluent UI React v9)

The dashboard follows [Fluent 2](https://fluent2.microsoft.design/) and is built on [Fluent UI React v9](https://github.com/microsoft/fluentui) (`@fluentui/react-components` and `@fluentui/react-icons`). It uses the stock `webLightTheme`. Only the product name is ours; there is no Microsoft branding or logo.

## Setup

- `src/app/providers.tsx` wraps the app in `RendererProvider` + `SSRProvider` + `FluentProvider`. Griffel styles are flushed into `<head>` with `useServerInsertedHTML`, so server-rendered pages arrive already styled.
- Do **not** put layout classes on `FluentProvider`. Fluent copies its classes onto portal containers (tooltips, drawers, dropdowns), which would then cover the page. Layout lives on an inner `div`.
- Tailwind is used for layout only (grid, flex, gap, padding). Colours, type, radii and shadows come from Fluent tokens, which `FluentProvider` exposes as CSS variables, for example `var(--colorNeutralForeground3)` and `var(--shadow4)`.

## Component mapping

| UI element | Fluent component |
|---|---|
| Page navigation | `TabList` / `Tab` with icons |
| Global filters | `Field` + `Dropdown` / `Option` |
| Primary action | `Button appearance="primary"` |
| Sample-data marker | `Badge appearance="tint" color="warning"` + `Tooltip` |
| Panels and KPIs | `Card` + `CardHeader`, type ramp (`LargeTitle`, `Title2`, `Subtitle1`, `Body1`, `Caption1`) |
| Alerts and explanations | `MessageBar` (`error` for retire candidates, `info` for notes) |
| Status (Keep / Watch / Rework / Retire) | `Badge appearance="tint"`: `success` / `warning` / `severe` / `danger`, each with an icon |
| Tables | `Table` (sortable `TableHeaderCell`, `TableCellLayout`) |
| Search and status filter | `SearchBox`, circular `ToggleButton`s |
| Chart view switches | `TabList size="small" appearance="subtle-circular"` |
| Breadcrumb | `Breadcrumb` / `BreadcrumbButton` |
| Ask the data | `OverlayDrawer` (end), `Avatar`, `Spinner`, `Input`, `MessageBar` |

## Charts

Charts stay on Recharts but use Fluent palette tokens (`src/app/globals.css`):

- **Series:** brand `#0f6cbd` and dark orange `#da3b01`. The pair passes the dataviz palette validator (CVD, contrast) on white.
- **Status fills:** green `#107c10`, marigold `#eaa300`, red `#d13438` (the Fluent palette's `Background3` steps).
- **Heatmap cells:** `colorPaletteRedBackground2`, `colorPaletteMarigoldBackground2`, `colorPaletteGreenBackground2`.
- **Tooltips:** match Fluent flyouts (white, `shadow16`, `borderRadiusMedium`).

## Accessibility

- There is a skip link, and Fluent provides its own focus indicators.
- Sortable headers expose `aria-sort`.
- Status is never shown by colour alone: there is always an icon and a label.
- Motion is reduced under `prefers-reduced-motion`.
