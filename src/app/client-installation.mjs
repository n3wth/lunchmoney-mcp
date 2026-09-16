import cursorConfig from '../../packages/cursor-plugin/mcp.json' with {type: 'json'}

// Shared Cursor one-click install link (name=lunchmoney, not generic name=server).
// Derived from packages/cursor-plugin/mcp.json so the site button and docs stay aligned.
export const cursorInstallUrl = 'cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=' +
  encodeURIComponent(btoa(JSON.stringify(cursorConfig.mcpServers.lunchmoney)))

export const cursorInstallMarkdown = `[Add to Cursor](${cursorInstallUrl})`

export const cursorDirectoryUrl = 'https://cursor.directory/plugins/lunch-money'
export const cursorDirectoryMarkdown = `[Cursor directory listing](${cursorDirectoryUrl})`

export const clients = [
  {
    value: 'grok', label: 'Grok Bot',
    description: 'Connection support for Grok Bot has not yet been verified.',
    next: 'There is no verified install link yet. See the setup guide for current availability.',
    guide: 'docs/user-guide.md'
  },
  {
    value: 'chatgpt', label: 'ChatGPT',
    description: 'The Lunch Money plugin is awaiting ChatGPT directory review.',
    next: 'A direct install link will appear here when the listing is available.',
    guide: 'docs/user-guide.md'
  },
  {
    value: 'claude-chat', label: 'Claude',
    description: 'In Claude, open Customize → Connectors → + → Add custom connector. Name it Lunch Money and enter the server URL below.',
    code: 'https://mcp.lunchmoney.sh/mcp',
    next: 'Claude supports custom connectors, but sign-in for this plugin has not yet been verified. Additional OAuth configuration may be required; see the setup guide before connecting.',
    guide: 'docs/user-guide.md'
  },
  {
    value: 'codex', label: 'Codex',
    description: 'In Codex, open Plugins → Create menu → Add marketplace. Enter the repository below, then install Lunch Money and start a new task.',
    code: 'n3wth/lunchmoney-mcp',
    command: 'codex plugin marketplace add n3wth/lunchmoney-mcp\ncodex plugin add codex-plugin@lunchmoney-mcp',
    next: 'Sign in when asked, then follow the steps below to link your Lunch Money account.',
    guide: 'packages/codex-plugin/README.md'
  },
  {
    value: 'claude', label: 'Claude Code',
    description: 'In Claude Code, open /plugin and add n3wth/lunchmoney-mcp as a marketplace. Then find and install Lunch Money.',
    command: '/plugin marketplace add n3wth/lunchmoney-mcp\n/plugin install lunchmoney@lunchmoney-mcp',
    next: 'Start a new session, then use /mcp to sign in to Lunch Money.',
    guide: 'packages/claude-plugin/README.md'
  },
  {
    value: 'cursor', label: 'Cursor',
    description: 'Open the install link or the Cursor directory listing, review the connection in Cursor, and confirm. No configuration file editing is needed.',
    next: 'Enable Lunch Money in Cursor’s MCP settings and complete sign-in.',
    guide: 'packages/cursor-plugin/README.md'
  },
  {
    value: 'cowork', label: 'Claude Cowork',
    description: 'Open Customize → Plugins → Browse plugins → Add marketplace. Enter this repository, then install lunchmoney.',
    code: 'n3wth/lunchmoney-mcp',
    next: 'Cowork supports custom marketplaces, but this plugin’s Cowork sign-in flow has not yet been verified. These instructions do not apply to Claude Chat.',
    guide: 'packages/claude-plugin/README.md'
  },
  {
    value: 'other', label: 'Other apps',
    description: 'This service needs a remote MCP connection with OAuth. Support and setup differ by app; a server URL alone may not be enough.',
    code: 'https://mcp.lunchmoney.sh/mcp',
    next: 'Check the connection guide for authentication requirements before configuring another app.',
    guide: 'docs/user-guide.md'
  }
]
