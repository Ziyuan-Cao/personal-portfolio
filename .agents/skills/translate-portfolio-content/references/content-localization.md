# Portfolio localization contract

## Runtime

`public/assets/js/i18n.js` owns supported locales, UI messages, locale persistence, date locale selection, and deep overlay merging. The browser selects a saved locale first, then the browser preference, and finally English.

Routes and identifiers remain language-neutral. Navigation uses `data-route`; portfolio filtering uses `data-filter-value`. Never derive behavior from translated visible text.

## Static UI

Use these attributes in `public/index.html`:

- `data-i18n="key"` for text content
- `data-i18n-placeholder="key"` for input placeholders
- `data-i18n-aria-label="key"` for accessible labels

Dynamic JavaScript must use `window.portfolioI18n.t("key", values)`. Use `{name}` placeholders for interpolation. Add every key to all three dictionaries.

## Authored JSON

English files are complete canonical records. Locale files are overlays and may omit immutable fields, but every included array must retain the English array length and order.

Required portfolio overlay fields:

```json
{
  "title": "…",
  "subtitle": "…",
  "category": "…"
}
```

Required blog overlay fields:

```json
{
  "title": "…",
  "abstract": "…",
  "category": "…",
  "imageAlt": "…",
  "lede": "…",
  "sections": []
}
```

Translate prose recursively in sections, including headings, paragraphs, bullets, callouts, table headings and cells, figure captions, flow labels and steps, numbered steps, and reference descriptions.

Do not translate: `slug`, `id`, `url`, `src`, `image`, `cardImage`, `publishedAt`, `readingTime`, `file`, `language`, `code`, `expression`, `symbol`, `icon`, `tone`, `type`, or `kind`.

## Terminology

Preferred Japanese terms:

- Paper → 論文
- Real-time rendering → リアルタイムレンダリング
- Game engine architecture → ゲームエンジンアーキテクチャ
- Screen-space reflections → スクリーンスペース反射
- Ambient occlusion → アンビエントオクルージョン

Preferred Simplified Chinese terms:

- Paper → 论文
- Real-time rendering → 实时渲染
- Game engine architecture → 游戏引擎架构
- Screen-space reflections → 屏幕空间反射
- Ambient occlusion → 环境光遮蔽
- Pipeline → 管线

Keep acronyms and API/product names unchanged unless a standard localized name is clearer.

## Validation and fallback

Run:

```powershell
npm test
```

The content validator requires both overlays for every authored post and project, checks required fields, verifies array alignment, rejects empty values and batching markers, and ensures immutable values remain identical when repeated. Runtime merging falls back field-by-field to English.
