import cursorConfig from '../../packages/cursor-plugin/mcp.json' with {type: 'json'}

export const cursorInstallUrl = 'cursor://anysphere.cursor-deeplink/mcp/install?name=lunchmoney&config=' +
  encodeURIComponent(btoa(JSON.stringify(cursorConfig.mcpServers.lunchmoney)))

export const clients = [
  {
    value: 'codex', label: 'Codex',
    description: 'In Codex, open Plugins → Create menu → Add marketplace. Enter the repository below, then install Lunch Money and start a new task.',
    code: 'n3wth/lunchmoney-mcp',
    command: 'codex plugin marketplace add n3wth/lunchmoney-mcp\ncodex plugin add codex-plugin@lunchmoney-mcp',
    next: 'Sign in when prompted. You can also use the terminal commands below.',
    guide: 'packages/codex-plugin/README.md'
  },
  {
    value: 'claude', label: 'Claude Code',
    description: 'Run these commands in Claude Code, one at a time. The first adds the marketplace; the second installs the plugin.',
    code: '/plugin marketplace add n3wth/lunchmoney-mcp\n/plugin install lunchmoney@lunchmoney-mcp',
    next: 'Start a new session, then use /mcp to sign in to Lunch Money.',
    guide: 'packages/claude-plugin/README.md'
  },
  {
    value: 'cursor', label: 'Cursor',
    description: 'Open the install link, review the connection in Cursor, and confirm. No configuration file editing is needed.',
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
    value: 'other', label: 'Other apps / ChatGPT',
    description: 'This service needs a remote MCP connection with OAuth. Support and setup differ by app; a server URL alone may not be enough.',
    code: 'https://mcp.lunchmoney.sh/mcp',
    next: 'ChatGPT marketplace review is pending. Check the connection guide before configuring another app.',
    guide: 'docs/user-guide.md'
  }
]
