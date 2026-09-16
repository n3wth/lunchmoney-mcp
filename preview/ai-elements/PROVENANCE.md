# Vercel AI Elements

Source: https://github.com/vercel/ai-elements
Commit: `6a9d5b1822ffb10bba4bd97175f01edd7d8651cd`
License: Apache-2.0, retained in LICENSE and deployed with the bundle.

These are the upstream `Conversation`, `ConversationContent`, `Message`, and
`MessageContent` implementations from `packages/elements/src/conversation.tsx`
and `packages/elements/src/message.tsx`.

Changes: selected only the used exports, redirected the shadcn `cn` import to
the equivalent local clsx/tailwind-merge helper, replaced the type-only AI SDK
role reference with its literal union, and matched local formatting. Unused
markdown renderers, toolbars, download controls, and their dependencies are
not included. Component behavior and utility classes are preserved.

AI Elements is distributed as component source. These checked-in files are
real upstream components, not a CSS recreation. The surrounding sample data,
animation, and n3wth theme integration live in ../index.tsx and ../styles.css.
