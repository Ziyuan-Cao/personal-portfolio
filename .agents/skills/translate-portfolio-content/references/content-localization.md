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

Name each blog owner directory after its canonical English `title`, while keeping `slug` as the stable route identifier. Replace Windows-forbidden characters (`< > : " / \\ | ? *`) with ` - `, collapse repeated whitespace, and remove trailing spaces or periods. Update the blog index and every owned asset URL when a title-based directory changes.

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

An equation `expression` may be one string or an array of row strings. Copy the complete value and row structure unchanged into an overlay whenever the field is included.

## Terminology

### Natural Chinese and protected names

For Simplified Chinese, write complete Chinese explanations and translate ordinary technical vocabulary, including keyword labels, headings, summaries, equation explanations, and research flows. Keep English for identifiable proper names and paper-defined models or named methods, such as `PhysSkin` and `Neural Deformation Gradients`. A term appearing in a paper does not make it a paper-specific name. Translate generic components such as encoder, attention, latent space, skinning, helper bone, deformation gradient, and finite element method as 编码器、注意力、潜在空间、蒙皮、辅助骨骼、变形梯度、有限元法.

Keep identifiers, code, symbols, units, official product/API names, and citation titles intact. Introduce a conventional acronym only when it helps subsequent reading; do not leave generic prose in English merely because an acronym exists. Keep `keywords` and corresponding `details[].keyword` translations aligned, while preserving their order and source IDs.

Build a short protected glossary from actual names and explicit user preferences, not every technical phrase in the source. Existing mixed-language text is not evidence that the user approved its terminology. A request to follow a neighboring section's style means matching its explanatory structure, not copying its translation defects.

After drafting Chinese content, inspect remaining Latin words in every visible field. Each should be a necessary name, notation, citation title, or explicitly requested exception; rewrite mixed-language clauses into natural Chinese.

### Article-specific scientific terminology exceptions

For lighting and photometry content, use `Unit of lighting and Convertion` (`public/content/blog/Unit of lighting and Convertion/`) as the reference pattern. Keep these terms in English:

- `lumen`, `candela`, `lux`, `nit`, `watt`, `Lambertian`
- `lm`, `cd`, `lx`, `cd/m²`, `W`
- Mathematical and physics notation such as `Φ`, `Ω`, `θ`, `ρ`, `π`, `I`, `E`, `L`, `A`, `Aₚ`, function names, subscripts, and superscripts

Preserve this established lighting glossary for that article family unless the user requests otherwise. Do not extend its English-preservation rule to unrelated technical subjects.

For Japanese, follow established localized terminology and explicitly approved article glossaries. For either locale, the user's current terminology correction takes precedence over an older example.

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
