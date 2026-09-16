# Design

Design reference for Lunch Money for Agents. This document describes the current
implementation and the constraints for future changes. Source code takes
precedence when implementation details differ.

## Product purpose

Help people connect Lunch Money to an MCP-compatible AI client and understand
what that connection permits. The website explains the service, demonstrates
sample questions, and guides setup. It is not an account dashboard or a live
financial chat interface.

The integration is unofficial and independently developed by n3wth. Keep that
relationship clear without implying endorsement by Lunch Money.

### Core constraints

- Financial access is read-only: no record edits, budget changes, or money movement.
- Connection tools can link, replace, and remove a connection.
- Enter API tokens on the browser connection page, never in chat or MCP config.
- Retrieved records reach the user's AI client and are subject to its policies.
- The connector does not retain the financial responses it returns.
- Complete transaction totals require all pages; keep currencies separate unless
  the user explicitly requests conversion.

## Experience and page structure

The primary action is **Connect Lunch Money**, linking to `#connect`.

| Region | Purpose | Current treatment |
| --- | --- | --- |
| Navigation | Identify the product and expose setup | Text wordmark and compact Connect button |
| Hero | Explain the value through a question and answer | Dark surface, centered heading, primary action, conversation demo |
| Independence note | Establish the product's relationship to Lunch Money | Quiet supporting text below the hero |
| Setup | Turn interest into a working connection | Copyable setup prompt, four steps, manual setup disclosure |
| Privacy | Explain access and control | Four concise statements on a muted surface |
| Closing action | Provide another route to setup | Centered heading and primary button |
| Footer | Provide ownership and reference links | n3wth, GitHub, Terms, Privacy |

The setup sequence is: add the connector, sign in, ask the agent to link Lunch
Money, enter the token on the connection page, then try a small read request.
Signing in to the connector and authorizing Lunch Money are separate steps.

## Visual language

Use quiet, flat surfaces, generous spacing, and clear type hierarchy. The palette
combines warm off-white, dark green, and restrained green accents. Financial
figures and setup instructions should remain more prominent than decoration.

The hero already includes a subtle decorative WebGL shader. Treat it as a local
exception, not a reason to add gradients, glows, or shadows elsewhere.

### Color

Colors are defined in `src/themes/neutral/neutralTheme.ts`. These values document
the current theme; consumers should use semantic tokens rather than copying hex
values into components.

| Token | Light | Dark |
| --- | --- | --- |
| `--color-background-body` / `--color-background-surface` | `#FAFAF6` | `#141D1B` |
| `--color-background-card` / `--color-background-muted` | `#F0F2ED` | `#141D1B` |
| `--color-text-primary` | `#18221E` | `#FAFAF6` |
| `--color-text-secondary` | `#5D6861` | `#B8C5BE` |
| `--color-accent` | `#176B57` | `#B9E3D3` |
| `--color-on-accent` | `#FAFAF6` | `#18221E` |

Chart tokens are `--color-chart-deep`, `--color-chart-teal`, and
`--color-chart-soft`. Pair chart marks with visible labels and amounts; color
alone must not carry meaning. The page uses a light theme with a nested dark hero.

### Typography

- Self-hosted **Suisse Intl** for body text and headings, with system fallbacks.
- Theme type scale: base 16, ratio 1.2.
- `display-1` for the hero, `display-2` for major section headings.
- Supporting text for secondary context; monospaced text for the MCP endpoint.
- Tabular numerals for financial amounts.
- Font weights and font loading live in the theme and `src/app/fonts.css`.

### Layout and components

Use Astryx for page structure, spacing, and controls. The active page uses
`AppShell`, `TopNav`, `VStack`, `HStack`, `Grid`, `Section`, `Heading`, `Text`,
`Button`, `Link`, `Collapsible`, and chat components.

Current content containers have a maximum width of 1120, with the hero content
and conversation region capped at 840. Setup and privacy grids fit up to two
columns with a minimum column width of 240. These are existing component values,
not a new spacing scale. Preserve readable single-column flow on narrow screens.

For new work:

- Use component props first, then token-backed utilities when needed.
- Keep brand changes in the theme; do not override color tokens in `:root`.
- Use rows for dense data. Reserve cards for standalone widgets.
- Use `StatusDot` or `Token` for status and `Badge` for counts.
- Avoid raw layout `div`/`span`, inline styles, arbitrary values, and new custom CSS.
- Follow the Astryx discovery workflow in `AGENTS.md`: `npx astryx build`, layout
  documentation, relevant templates, and component documentation before UI edits.

## Interaction and accessibility

### Conversation preview

`src/app/ai-chat/page.tsx` contains fictional Spending, Bills, and Accounts
examples. It does not call the financial service. Each example includes a
question, summary, detail, and labeled amounts with proportional bars.

Examples rotate every seven seconds. Hover, keyboard focus within the preview,
and a hidden browser tab pause rotation. Reduced-motion preference disables
automatic rotation and entrance animation. Users can choose examples with
buttons whose selected state is exposed through `aria-pressed`.

Keep the fictional-data label, readable amount labels, hidden inactive slides,
and manual controls when changing the demo. Do not imply these are live records.

### Setup controls

The setup prompt button changes to **Copied** after clipboard success. On failure,
it displays the prompt for manual selection and announces the error through a
polite live region. The manual connection disclosure exposes the remote endpoint
and setup guide without crowding the initial flow.

### Motion and resilience

Theme motion values are fast 125 ms, medium 300 ms, and slow 700 ms. Use theme
durations for new animation and honor reduced-motion preferences.

The decorative hero canvas is hidden from assistive technology. It uses a
reduced-resolution rendering surface, limits drawing frequency, and stops its
continuous loop when offscreen or the document is hidden. Reduced motion renders
a still frame; unavailable WebGL leaves the page content available.

For UI changes, verify keyboard navigation, visible focus, heading order,
contrast, narrow-screen overflow, reduced motion, and clipboard failure. These
are validation requirements, not a claim of a completed accessibility audit.

## Content and trust

Use direct, plain language. Explain what users can ask, what the connector reads,
where records go, and how to stop access. Avoid promises of financial outcomes
or claims that the integration can perform financial writes.

Distinguish disconnecting the stored connection from revoking the original token
in Lunch Money. Removing a plugin does neither. Preserve links to setup, privacy,
terms, and source code.

Analytics is limited in `src/app/analytics.ts` to landing, connection-click, and
setup-copy events on the production hostname. It respects the stored opt-out,
Do Not Track, and Global Privacy Control. Do not add financial data, tokens, or
chat contents to analytics payloads.

## Implementation map

| Source | Responsibility |
| --- | --- |
| `src/app/App.tsx` | Active landing page structure and content |
| `src/app/shell-top-nav/page.tsx` | Navigation and wordmark |
| `src/app/ai-chat/page.tsx` | Fictional interactive conversation examples |
| `src/app/SetupPrompt.tsx` | Setup prompt and clipboard states |
| `src/app/HeroShader.tsx` | Decorative hero animation |
| `src/themes/neutral/neutralTheme.ts` | Typography, colors, motion, component styling |
| `src/app/fonts.css` | Font faces and minimal base styles |
| `build.js` | Theme compilation, prerendering, bundling, static output |
| `site/` | HTML shell, assets, and static legal pages |
| `packages/` | MCP service, authentication contract, API adapter, client plugins |

`build.js` copies public assets and legal pages from `site/`, compiles the Astryx
theme, and renders React into `src/app/document.html` to generate the homepage.
It assembles `app.css` from Astryx reset/core CSS, the compiled theme, and font
CSS. The old static homepage and `preview/` implementation have been removed.
`site/legal.css` styles the standalone legal pages. Edit `src/app/` for homepage
changes; do not edit `dist/` or generated `.cache/` files directly.

At the service level, Auth0 identifies the connector user, Nango manages the
Lunch Money token, and the Cloudflare MCP service retrieves financial records
from Lunch Money for the AI client. See `docs/threat-model.md` and
`docs/runbook.md` for security and operational detail.

## Validation

Run `npm run build` after changes. For visual or interaction changes, run
`npm run preview` and inspect the built site at `http://localhost:4173` on desktop
and narrow screens. Verify demo selection and pause behavior, setup copying and
fallback, manual setup disclosure, and footer links. Use browser screenshots
when practical. Backend changes also require the package checks in `README.md`.
