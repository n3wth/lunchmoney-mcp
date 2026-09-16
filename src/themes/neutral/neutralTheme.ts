import {
  defineTheme,
  defineSyntaxTheme,
  type TokenValue,
} from '@astryxdesign/core/theme';
import {neutralIconRegistry} from './icons';
import {neutralPaletteRefs} from './neutralPaletteRefs.generated';

const {blue, cyan, green, neutral, orange, pink, purple, red, teal, yellow} =
  neutralPaletteRefs;
const withAlpha = (color: string, alpha: string) => `${color}${alpha}`;

const neutralSyntax = defineSyntaxTheme({
  name: 'astryx-neutral',
  tokens: {
    keyword: [purple.light[30], purple.light[80]],
    string: [green.light[30], green.light[80]],
    comment: [neutral.light[45], neutral.dark[65]],
    number: [orange.light[30], orange.dark[80]],
    function: [blue.light[30], blue.dark[80]],
    type: [purple.light[30], purple.light[80]],
    variable: [neutral.light[5], neutral.dark[90]],
    operator: [neutral.light[45], neutral.dark[65]],
    constant: [orange.light[30], orange.dark[80]],
    tag: [red.light[30], red.dark[80]],
    attribute: [yellow.light[30], yellow.light[80]],
    property: [teal.light[30], teal.light[80]],
    punctuation: [neutral.light[45], neutral.dark[65]],
    background: [neutral.light[100], neutral.dark[5]],
  },
});

const neutralLocalTokens: Record<string, TokenValue> = {
  '--astryx-theme-neutral-color-status-fill-accent': ['#0074e2', '#6d9cfe'],
  '--astryx-theme-neutral-color-status-fill-success': ['#198100', '#64af4c'],
  '--astryx-theme-neutral-color-status-fill-warning': '#ffce2f',
  '--astryx-theme-neutral-color-status-fill-error': ['#c9303a', '#ff705d'],
  '--astryx-theme-neutral-color-status-muted-accent': [
    blue.light[85],
    withAlpha(blue.dark[75], '3D'),
  ],
  '--astryx-theme-neutral-color-on-tint-neutral': ['#fafafa4D', '#0a0a0a4D'],
  '--astryx-theme-neutral-color-on-tint-overlay-hover': [
    '#fafafa1A',
    '#0a0a0a1A',
  ],
  '--astryx-theme-neutral-color-on-tint-overlay-pressed': [
    '#fafafa33',
    '#0a0a0a33',
  ],
  '--astryx-theme-neutral-color-destructive-overlay-hover': [
    withAlpha(red.light[70], '0D'),
    withAlpha(red.dark[65], '0D'),
  ],
  '--astryx-theme-neutral-color-destructive-overlay-pressed': [
    withAlpha(red.light[70], '1A'),
    withAlpha(red.dark[65], '1A'),
  ],
};

const statusFill = {
  accent: 'var(--astryx-theme-neutral-color-status-fill-accent)',
  success: 'var(--astryx-theme-neutral-color-status-fill-success)',
  warning: 'var(--astryx-theme-neutral-color-status-fill-warning)',
  error: 'var(--astryx-theme-neutral-color-status-fill-error)',
} as const;

export const neutralTheme = defineTheme({
  name: 'neutral',
  localTokens: neutralLocalTokens,

  // Product-led landing page: self-hosted type, neutral surfaces, clear scale.
  typography: {
    scale: {base: 16, ratio: 1.2},
    body: {
      family: 'Suisse Intl',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Suisse Intl',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      weights: {3: 'semibold', 4: 'semibold'},
    },
    code: {
      family: 'ui-monospace',
      fallbacks:
        '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },

  // Motion: snappier than default to match shadcn/Tailwind conventions.
  // Produces: fast-min=95ms, fast=125ms, fast-max=165ms,
  //           medium-min=225ms, medium=300ms, medium-max=400ms.
  motion: {fast: 125, medium: 300, slow: 700, ratio: 0.75},

  syntax: neutralSyntax,

  adaptations: {
    rules: [{
      when: {width: {below: 'sm'}},
      value: {components: {
        'page-frame': {base: {paddingInline: 'var(--spacing-2)'}},
        'brand-suffix': {base: {display: 'none'}},
        'hero-content': {base: {gap: 'var(--spacing-6)', paddingBlockStart: 'var(--spacing-3)'}},
        'privacy-surface': {base: {padding: 'var(--spacing-5)'}},
        'top-nav': {base: {paddingInline: 'var(--spacing-2)', paddingBlock: 'var(--spacing-5)'}},
        'page-section': {base: {paddingBlock: 'var(--spacing-8)'}},
        'chat-message-bubble': {'sender:assistant': {padding: 'var(--spacing-4)'}},
      }},
    }],
  },

  tokens: {
    '--color-background-surface': ['#FAF9F4', '#141D1B'],
    '--color-background-body': ['#FAF9F4', '#141D1B'],
    '--color-hero-background': ['#124C43', '#124C43'],
    '--color-background-card': ['#F0F2ED', '#141D1B'],
    '--color-background-popover': ['#FAFAF6', '#141D1B'],
    '--color-background-muted': ['#F0F2ED', '#141D1B'],

    '--color-accent': ['#124C43', '#FAF9F4'],
    '--color-accent-muted': [neutral.light[95], neutral.dark[15]],
    '--color-neutral': [
      withAlpha(neutral.light[0], '0F'),
      withAlpha(neutral.dark[100], '1A'),
    ],

    // Overlays (modal scrims, hover/pressed tints)
    '--color-overlay': [
      withAlpha(neutral.light[0], '80'),
      withAlpha(neutral.dark[0], 'CC'),
    ],
    '--color-overlay-hover': [
      withAlpha(neutral.light[0], '0D'),
      withAlpha(neutral.dark[100], '0D'),
    ],
    '--color-overlay-pressed': [
      withAlpha(neutral.light[0], '1A'),
      withAlpha(neutral.dark[100], '1A'),
    ],

    // Text
    '--color-text-primary': ['#18221E', '#FAFAF6'],
    '--color-text-secondary': ['#5D6861', '#B8C5BE'],
    '--color-text-disabled': [neutral.light[60], neutral.dark[35]],
    '--color-text-accent': [neutral.light[10], neutral.dark[95]],
    '--color-on-dark': neutral.light[100],
    '--color-on-light': neutral.light[5],
    '--color-on-accent': ['#FAF9F4', '#124C43'],
    '--color-on-success': [neutral.light[100], neutral.dark[5]],
    '--color-on-error': [neutral.light[100], neutral.dark[5]],
    '--color-on-warning': neutral.light[5],

    // Icon
    '--color-icon-accent': [neutral.light[10], neutral.dark[95]],
    '--color-icon-primary': [neutral.light[0], neutral.dark[100]],
    '--color-icon-secondary': [neutral.light[45], neutral.dark[65]],
    '--color-icon-disabled': [neutral.light[60], neutral.dark[35]],

    '--color-success': [green.light[25], green.light[80]],
    '--color-error': [red.light[25], red.dark[85]],
    '--color-warning': [yellow.light[25], yellow.light[85]],
    '--color-success-muted': [green.dark[85], withAlpha(green.light[75], '3D')],
    '--color-error-muted': [red.light[85], withAlpha(red.dark[75], '3D')],
    '--color-warning-muted': [
      yellow.dark[90],
      withAlpha(yellow.light[75], '3D'),
    ],

    '--color-border': ['#e5e7eb', '#1f1f1f'],
    '--color-border-emphasized': [neutral.light[85], neutral.dark[35]],

    // Effects
    '--color-skeleton': [neutral.light[95], neutral.dark[35]],
    '--color-shadow': [
      withAlpha(neutral.light[0], '1A'),
      withAlpha(neutral.dark[0], '4D'),
    ],
    '--color-tint-hover': ['black', 'white'],

    '--color-background-red': [red.light[85], red.dark[25]],
    '--color-border-red': [red.light[80], red.light[65]],
    '--color-icon-red': [red.light[25], red.dark[75]],
    '--color-text-red': [red.light[25], red.dark[80]],

    '--color-background-orange': [orange.light[85], orange.dark[25]],
    '--color-border-orange': [orange.light[85], orange.dark[65]],
    '--color-icon-orange': [orange.light[25], orange.light[75]],
    '--color-text-orange': [orange.light[25], orange.dark[80]],

    '--color-background-yellow': [yellow.dark[90], yellow.dark[25]],
    '--color-border-yellow': [yellow.dark[80], yellow.light[65]],
    '--color-icon-yellow': [yellow.light[25], yellow.light[75]],
    '--color-text-yellow': [yellow.light[25], yellow.light[80]],

    '--color-background-green': [green.dark[85], green.dark[25]],
    '--color-border-green': [green.dark[80], green.light[65]],
    '--color-icon-green': [green.light[25], green.light[75]],
    '--color-text-green': [green.light[25], green.light[75]],

    '--color-background-teal': [teal.light[85], teal.dark[25]],
    '--color-border-teal': [teal.light[80], teal.dark[65]],
    '--color-icon-teal': [teal.light[25], teal.dark[75]],
    '--color-text-teal': [teal.light[25], teal.light[80]],

    '--color-background-cyan': [cyan.dark[85], cyan.dark[25]],
    '--color-border-cyan': [cyan.dark[80], cyan.dark[65]],
    '--color-icon-cyan': [cyan.light[25], cyan.dark[75]],
    '--color-text-cyan': [cyan.light[25], cyan.dark[80]],

    '--color-background-blue': [blue.light[85], blue.dark[25]],
    '--color-border-blue': [blue.light[80], blue.dark[65]],
    '--color-icon-blue': [blue.light[25], blue.dark[75]],
    '--color-text-blue': [blue.light[25], blue.dark[80]],

    '--color-background-purple': [purple.light[90], purple.dark[25]],
    '--color-border-purple': [purple.light[85], purple.light[70]],
    '--color-icon-purple': [purple.light[25], purple.light[75]],
    '--color-text-purple': [purple.light[25], purple.dark[80]],

    '--color-background-pink': [pink.light[85], pink.dark[25]],
    '--color-border-pink': [pink.light[85], pink.light[70]],
    '--color-icon-pink': [pink.light[25], pink.dark[75]],
    '--color-text-pink': [pink.light[25], pink.dark[80]],

    '--color-background-gray': [neutral.light[90], neutral.dark[20]],
    '--color-border-gray': [neutral.light[85], neutral.dark[15]],
    '--color-icon-gray': [neutral.light[30], neutral.dark[65]],
    '--color-text-gray': [neutral.light[10], neutral.dark[85]],

    // =========================================================================
    // Radius — slightly larger than default (kept as-is)
    // --radius-none and --radius-full are always fixed and must never be
    // scaled by a theme (see defineTheme's radius config docs) — 0 and
    // 9999px respectively, matching @astryxdesign/core's own defaults.
    // =========================================================================
    '--radius-none': '0px',
    '--radius-inner': '0.375rem',
    '--radius-element': '9999px',
    '--radius-container': '0.75rem',
    '--radius-page': '1.75rem',
    '--color-chart-deep': ['#176B57', '#F4CF65'],
    '--color-chart-teal': ['#3C987B', '#A9DDD0'],
    '--color-chart-soft': ['#7ABAA3', '#FAF9F4'],
    '--color-chart-track': ['#DFE6DF', '#39786E'],
    '--radius-full': '9999px',

    // Flat n3wth surfaces; status outlines remain meaningful.
    '--shadow-low': 'none',
    '--shadow-med': 'none',
    '--shadow-high': 'none',
    '--shadow-inset-hover': `inset 0px 0px 0px 2px ${withAlpha(blue.light[50], '4D')}`,
    '--shadow-inset-selected': `inset 0px 0px 0px 2px ${withAlpha(blue.light[50], '80')}`,
    '--shadow-inset-success': `inset 0px 0px 0px 2px ${withAlpha(green.light[45], '4D')}`,
    '--shadow-inset-warning': `inset 0px 0px 0px 2px ${withAlpha(yellow.light[85], '4D')}`,
    '--shadow-inset-error': `inset 0px 0px 0px 2px ${withAlpha(red.light[55], '4D')}`,
  },

  components: {
    'selector-popup': {base: {
      backgroundColor: 'var(--color-background-card)',
      border: 'var(--border-width-thin, 1px) solid var(--color-border-emphasized)',
      borderRadius: 'var(--radius-container)',
    }},
    button: {
      base: {borderRadius: 'var(--radius-full)', boxShadow: 'none', fontWeight: '500', minHeight: '2.75rem'},
      'size:lg': {minHeight: '3rem', paddingInline: 'var(--spacing-6)'},
      'size:sm': {fontSize: 'var(--text-supporting-size)', '--text-label-size': 'var(--text-supporting-size)', minHeight: 'var(--spacing-8)', paddingBlock: 'var(--spacing-2)', paddingInline: 'var(--spacing-4)'},
      'variant:destructive': {
        backgroundColor: 'var(--color-error-muted)',
        color: 'var(--color-error)',
        '--color-overlay-hover':
          'var(--astryx-theme-neutral-color-destructive-overlay-hover)',
        '--color-overlay-pressed':
          'var(--astryx-theme-neutral-color-destructive-overlay-pressed)',
      },
    },

    badge: {
      'variant:info': {
        backgroundColor: statusFill.accent,
        color: 'var(--color-on-accent)',
      },
      'variant:neutral': {
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-gray)',
      },
      'variant:success': {
        backgroundColor: statusFill.success,
        color: 'var(--color-on-success)',
      },
      'variant:warning': {
        backgroundColor: statusFill.warning,
        color: 'var(--color-on-warning)',
      },
      'variant:error': {
        backgroundColor: statusFill.error,
        color: 'var(--color-on-error)',
      },

      'variant:red': {
        backgroundColor: 'var(--color-background-red)',
        color: 'var(--color-text-red)',
      },
      'variant:orange': {
        backgroundColor: 'var(--color-background-orange)',
        color: 'var(--color-text-orange)',
      },
      'variant:yellow': {
        backgroundColor: 'var(--color-background-yellow)',
        color: 'var(--color-text-yellow)',
      },
      'variant:green': {
        backgroundColor: 'var(--color-background-green)',
        color: 'var(--color-text-green)',
      },
      'variant:teal': {
        backgroundColor: 'var(--color-background-teal)',
        color: 'var(--color-text-teal)',
      },
      'variant:cyan': {
        backgroundColor: 'var(--color-background-cyan)',
        color: 'var(--color-text-cyan)',
      },
      'variant:blue': {
        backgroundColor: 'var(--color-background-blue)',
        color: 'var(--color-text-blue)',
      },
      'variant:purple': {
        backgroundColor: 'var(--color-background-purple)',
        color: 'var(--color-text-purple)',
      },
      'variant:pink': {
        backgroundColor: 'var(--color-background-pink)',
        color: 'var(--color-text-pink)',
      },
      'variant:gray': {
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-gray)',
      },
    },

    'status-dot': {
      'variant:success': {backgroundColor: statusFill.success},
      'variant:warning': {backgroundColor: statusFill.warning},
      'variant:error': {backgroundColor: statusFill.error},
      'variant:accent': {backgroundColor: statusFill.accent},
    },

    'avatar-status-dot': {
      'variant:success': {backgroundColor: statusFill.success},
      'variant:error': {backgroundColor: statusFill.error},
    },

    // Give the Neutral segmented control a roomier inset without changing its
    // outside height. The selected item stays flat against the tinted track.
    'segmented-control': {
      base: {
        padding: 'var(--spacing-1)',
      },
    },
    'segmented-control-item': {
      'size:sm': {
        height: 'calc(var(--size-element-sm) - 8px)',
      },
      'size:md': {
        height: 'calc(var(--size-element-md) - 8px)',
      },
      'size:lg': {
        height: 'calc(var(--size-element-lg) - 8px)',
      },
      selected: {
        boxShadow: 'none',
      },
    },

    banner: {
      base: {
        '--color-neutral': 'var(--astryx-theme-neutral-color-on-tint-neutral)',
        '--color-overlay-hover':
          'var(--astryx-theme-neutral-color-on-tint-overlay-hover)',
        '--color-overlay-pressed':
          'var(--astryx-theme-neutral-color-on-tint-overlay-pressed)',
      },
      'status:info': {
        '--color-accent-muted':
          'var(--astryx-theme-neutral-color-status-muted-accent)',
        '--color-text-primary': 'var(--color-text-blue)',
        '--color-text-secondary': 'var(--color-text-blue)',
        '--color-accent': 'var(--color-text-blue)',
      },
      'status:success': {
        '--color-text-primary': 'var(--color-text-green)',
        '--color-text-secondary': 'var(--color-text-green)',
        '--color-success': 'var(--color-text-green)',
      },
      'status:warning': {
        '--color-text-primary': 'var(--color-text-yellow)',
        '--color-text-secondary': 'var(--color-text-yellow)',
        '--color-warning': 'var(--color-text-yellow)',
      },
      'status:error': {
        '--color-text-primary': 'var(--color-text-red)',
        '--color-text-secondary': 'var(--color-text-red)',
        '--color-error': 'var(--color-text-red)',
      },
    },

    'step-indicator': {
      'status:accent': {'--color-accent': statusFill.accent},
      'status:success': {'--color-success': statusFill.success},
      'status:warning': {'--color-warning': statusFill.warning},
      'status:error': {'--color-error': statusFill.error},
    },

    switch: {
      base: {
        '--color-background-gray': 'var(--color-border-emphasized)',
      },
    },

    'progress-bar': {
      base: {
        '--color-background-muted': 'var(--color-border-emphasized)',
      },
      'variant:accent': {
        '--color-accent': statusFill.accent,
      },
      'variant:success': {
        '--color-success': statusFill.success,
      },
      'variant:warning': {
        '--color-warning': statusFill.warning,
      },
      'variant:error': {
        '--color-error': statusFill.error,
      },
    },

    card: {
      base: {
        padding: 'var(--spacing-3)',
      },
    },

    section: {
      'variant:muted': {borderRadius: 'var(--radius-page)'},
      'variant:section': {borderRadius: 'var(--radius-page)'},
      base: {
        padding: 'var(--spacing-3)',
      },
    },

    heading: {
      base: {letterSpacing: '-0.035em', fontWeight: '600'},
      'type:display-1': {fontSize: 'clamp(1.25rem, 7vw, 4.5rem)', lineHeight: '1.06', letterSpacing: '-0.045em'},
      'type:display-2': {fontSize: 'clamp(2.125rem, 4vw, 3.5rem)', lineHeight: '1.08'},
      'type:display-3': {fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: '1.15'},
      'level:3': {fontSize: '1.25rem', lineHeight: '1.3'},
    },
    'page-frame': {base: {paddingInline: 'var(--spacing-6)'}},
    'page-section': {base: {paddingBlock: 'calc(var(--spacing-8) * 2)'}},
    'brand-suffix': {base: {display: 'inline'}},
    'hero-surface': {base: {position: 'relative', isolation: 'isolate', overflow: 'hidden', borderRadius: 'var(--radius-page)', backgroundColor: 'var(--color-hero-background)'}},
    'hero-shader': {base: {position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0', borderRadius: 'var(--radius-page)'}},
    'hero-content': {base: {position: 'relative', zIndex: '1'}},
    'demo-stage': {base: {display: 'grid'}},
    'demo-timer': {base: {
      position: 'relative', overflow: 'hidden',
    }},
    'demo-progress-fill': {base: {
      position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
      backgroundColor: 'var(--color-hero-background)',
      backgroundImage: 'linear-gradient(var(--color-neutral), var(--color-neutral))',
      color: 'var(--color-text-primary)',
      clipPath: 'inset(0 100% 0 0)', pointerEvents: 'none',
    }},
    'chat-message-bubble': {'sender:assistant': {
      padding: 'var(--spacing-5)',
      borderRadius: 'var(--spacing-5)',
    }},
    'demo-slide': {base: {gridArea: '1 / 1', alignSelf: 'start', minWidth: '0'}},
    'demo-hidden': {base: {opacity: '0', pointerEvents: 'none'}},
    'demo-answer': {base: {
      '--container-padding-inline-start': '0px',
      '--container-padding-inline-end': '0px',
      '--container-padding-block-start': '0px',
      '--container-padding-block-end': '0px',
    }},
    'final-cta': {base: {paddingBlock: 'calc(var(--spacing-10) * 3)'}},
    'privacy-surface': {base: {
      backgroundColor: 'var(--color-background-card)',
      borderRadius: 'var(--spacing-4)',
    }},
    'code-block': {base: {
      borderRadius: 'var(--radius-container)',
      borderColor: 'var(--color-border)',
      '--color-syntax-background': 'var(--color-background-card)',
      '--color-syntax-variable': 'var(--color-text-primary)',
      '--color-syntax-comment': 'var(--color-text-secondary)',
    }},
    'code-block-title': {base: {fontFamily: 'var(--font-family-body)', color: 'var(--color-text-secondary)'}},
    'app-shell-header': {base: {backgroundColor: 'transparent', position: 'static'}},
    'top-nav': {base: {
      '--text-label-size': 'var(--text-supporting-size)',
      paddingInlineStart: 'var(--spacing-6)',
      paddingInlineEnd: 'var(--spacing-6)',
      paddingBlock: 'var(--spacing-8)',
      marginBlock: 'var(--spacing-3)',
      marginInline: 'auto',
      width: 'calc(100% - var(--spacing-6))',
      maxWidth: 'calc(var(--spacing-10) * 28)',
      borderRadius: 'var(--radius-full)',
      backgroundColor: 'color-mix(in srgb, var(--color-background-surface) 75%, transparent)',
      backdropFilter: 'blur(var(--spacing-5))',
      WebkitBackdropFilter: 'blur(var(--spacing-5))',
      border: 'var(--border-width-thin, 1px) solid color-mix(in srgb, var(--color-border-default) 50%, transparent)',
    }},
  },

  icons: neutralIconRegistry,
});
