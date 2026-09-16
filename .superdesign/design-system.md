# Lunch Money for Agents

Unofficial, open-source, read-only MCP connector for existing Lunch Money users. The site explains the integration and links to setup. The conversation is interactive sample data, not live financial access.

## Current direction

The user rejected the dark TypeUI treatment and requested the clarity and craft associated with Apple, Webflow, Anthropic, and OpenAI. The source implementation supersedes the older Superdesign canvas draft.

- White canvas with a full-width soft gray conversation region.
- Self-hosted Mona Sans display typography and Geist Sans body text.
- Centered product-led hero; 52–96px display type, 34–56px section titles, 16px body.
- Black primary actions, pill controls, no shadows, gradients, stock imagery, or decorative icons.
- One coherent example conversation: question, answer, supporting records, follow-up questions.
- Follow-up controls remain mounted to preserve keyboard focus. The answer fades when changed, respecting reduced motion.
- Setup is a real three-step sequence. Privacy uses a quiet two-column layout with optional provider details.
- Desktop content widths: 960px hero, 760px conversation, 1120px lower sections. Mobile uses 24px gutters.

## Implementation

Use Astryx AppShell, TopNav, Heading, Text, Stack, Grid, Section, Button, Link, Collapsible and Table. Theme source: src/themes/neutral/neutralTheme.ts. Layout uses component props; colors and typography belong in the theme. No raw layout wrappers or inline styling.

## Product truth

Keep all installation destinations and read-only claims accurate. Never imply official Lunch Money affiliation. API tokens go only into the connection browser flow. AI clients and model providers receive results under their own policies. Disconnecting the connector and revoking the original Lunch Money token are separate actions.
