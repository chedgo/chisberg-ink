# Dependency Upgrade Plan

Tracking major version upgrades for this project.

## Summary

All major dependency upgrades completed successfully. Build passing.

## Final Package Versions

| Package | Before | After | Status |
|---------|--------|-------|--------|
| `ai` | 3.4.17 | 6.0.50 | ✅ Done |
| `@ai-sdk/openai` | 0.0.68 | 3.0.19 | ✅ Done |
| `openai` | 4.56.2 | 4.104.0 | ✅ (stays v4 for AI SDK compat) |
| `zod` | 3.23.8 | 4.3.6 | ✅ Done |
| `react` / `react-dom` | 18.3.1 | 19.2.4 | ✅ Done |
| `next` | 14.2.3 | 16.1.5 | ✅ Done |
| `tailwindcss` | 3.4.1 | 4.1.18 | ✅ Done |
| `eslint` | 8.57.0 | 9.39.2 | ✅ Done |

## Recommended Upgrade Order

1. **OpenAI SDK** - Simple, isolated usage
2. **Zod** - No breaking changes apply
3. **AI SDK** - Codemod available
4. **React 19** - Required for Next.js 16
5. **Next.js 16** - Includes ESLint 9 support
6. **Tailwind CSS 4** - Independent, has upgrade tool

---

## Evaluation Notes

### 1. AI SDK (`ai` + `@ai-sdk/openai`) - 3.4 → 6.0

**Current usage:**
- `streamText` from `ai` (chat route)
- `streamObject` from `ai` (question-list, color-stories routes)
- `useChat` from `ai/react` (InterviewSimulator)
- `openai` provider from `@ai-sdk/openai`

**Breaking changes v3→v4→v5→v6:**
- v4→v5: Deprecated APIs removed, data format changes
- v5→v6: `system` renamed to `instructions`, `Experimental_Agent` → `ToolLoopAgent`

**Migration path:**
- Codemod available: `npx @ai-sdk/codemod v6`
- Can run `npx @ai-sdk/codemod upgrade` to go through all versions

**Assessment:** Required significant manual changes.

**Changes made:**
- Import path: `ai/react` → `@ai-sdk/react` (added `@ai-sdk/react` package)
- `Message` type → `UIMessage` type
- Message structure: `content` → `parts` array with `type: 'text'` parts
- Tool definition: `parameters` → `inputSchema`
- Response method: `toDataStreamResponse()` → `toUIMessageStreamResponse()`
- Option: `maxTokens` → `maxOutputTokens`
- `useChat` API completely changed:
  - No longer manages input state (use manual `useState`)
  - `handleSubmit`/`append` → `sendMessage({ text })`
  - `reload` → `regenerate`
  - `isLoading` → check `status === 'streaming'`
  - `api`/`body` options → `transport: new DefaultChatTransport({ api, body })`
  - `onToolCall` return type changed (no return value)
- `useObject` generic type parameter removed (infers from schema)

**Status:** ✅ Done

---

### 2. OpenAI SDK (`openai`) - 4.x → 6.x

**Current usage:**
- Only used in `moderation.ts` for content moderation
- Simple usage: `openai.moderations.create()`

**Breaking changes v4→v6:**
- v5: Migrated to built-in fetch (from node-fetch)
- v6: `ResponseFunctionToolCallOutputItem.output` type changed (tool calls only)

**Assessment:** Moderation API unchanged. Should be a drop-in upgrade.

**Status:** ⏳ Ready to attempt

---

### 3. Zod - 3.x → 4.x

**Current usage:**
- Simple object schemas with `z.object()`, `z.string()`, `z.number()`
- `.describe()` for AI SDK schema descriptions
- `z.infer<>` for type inference

**Breaking changes in v4:**
- String validators moved: `z.string().email()` → `z.email()` (not used here)
- `z.record()` requires two args (not used here)
- Error customization API changed (not used here)
- `.merge()` deprecated (not used here)

**Assessment:** Codebase uses basic schemas only. No breaking changes apply.

**Status:** ✅ Done - No code changes needed

---

### 4. Next.js - 14.2 → 16.x

**Current usage:**
- App Router with static pages
- API routes (edge runtime on some)
- No middleware
- No dynamic routes with params
- No custom webpack config
- No usage of `cookies()`, `headers()`, `params`, `searchParams`

**Breaking changes v14→v15→v16:**
- v15: Async Request APIs (`cookies()`, `headers()`, etc.) - not used here
- v16: Turbopack default (no custom webpack config, so fine)
- v16: `middleware.ts` → `proxy.ts` rename - no middleware here
- v16: Synchronous access to Request APIs removed - not used here

**Migration:**
- Codemod: `npx @next/codemod@canary upgrade latest`
- React 19 required for Next.js 16

**Assessment:** Very simple app. No breaking changes apply directly.

**Status:** ✅ Done - No code changes needed. Turbopack now default.

---

### 5. React / React-DOM - 18.3 → 19.x

**Current usage:**
- Standard hooks: `useState`, `useEffect`, `useRef`, `useCallback`
- No `forwardRef`
- No string refs
- No `createFactory`
- No `ReactDOM.render` (Next.js handles rendering)

**Breaking changes in v19:**
- `ReactDOM.render` removed → use `createRoot` (Next.js handles this)
- `forwardRef` no longer needed (not used here)
- String refs removed (not used here)
- `act` moved from `react-dom/test-utils` to `react` (no tests)

**Assessment:** No deprecated APIs used.

**Status:** ✅ Done - No code changes needed

---

### 6. Tailwind CSS - 3.4 → 4.x

**Current usage:**
- Simple `tailwind.config.ts` with custom colors and fonts
- Standard utility classes in components
- No plugins

**Breaking changes in v4:**
- Config moved from JS to CSS (`tailwind.config.ts` → CSS-based)
- `@tailwind base/components/utilities` → `@import 'tailwindcss'`
- Border/divide default colors changed
- Container utility config options removed
- Arbitrary value syntax: `bg-[--var]` → `bg-(--var)` (not used here)

**Migration tool:**
- `npx @tailwindcss/upgrade` - handles most changes automatically

**Assessment:** Config is simple. Upgrade tool handled most of it.

**Changes made:**
- `tailwind.config.ts` removed (config moved to CSS)
- `globals.css` now uses `@import 'tailwindcss'` and `@theme { }` block
- `postcss.config.mjs`: `tailwindcss` → `@tailwindcss/postcss`
- Theme colors and fonts now defined as CSS variables

**Status:** ✅ Done

---

### 7. ESLint - 8.x → 9.x

**Current usage:**
- Simple `.eslintrc.json` extending `next/core-web-vitals`
- No custom rules

**Breaking changes in v9:**
- Flat config is now default (`.eslintrc.json` → `eslint.config.js`)
- Node.js 18.18+ required
- Many internal API changes

**Note:** ESLint 9 upgrade is tied to `eslint-config-next`. Next.js 16 ships with updated ESLint support.

**Assessment:** Upgraded with Next.js 16.

**Status:** ✅ Done - eslint-config-next handles config migration
