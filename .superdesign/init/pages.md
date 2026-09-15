# Dependency trees
## /
- src/app/client.tsx and src/app/render.tsx
  - src/app/App.tsx
    - src/app/shell-top-nav/page.tsx
    - src/app/ai-chat/page.tsx
    - .cache/neutral.js (generated; canonical source src/themes/neutral/neutralTheme.ts)
      - src/themes/neutral/icons.tsx
      - src/themes/neutral/neutralPaletteRefs.generated.ts (canonical theme source dependency)
- src/app/fonts.css
- build.js includes npm Astryx reset.css and astryx.css, and generated .cache/neutral.css.
No globals.css or tailwind.config exists for current landing page. Use fonts.css plus theme source as global context. package.json defines dependencies.
## /privacy
- site/privacy/index.html
- site/styles.css
## /terms
- site/terms/index.html
- site/styles.css
