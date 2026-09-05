---
name: translate-portfolio-content
description: Translate, add, or update this portfolio's English, Japanese, and Simplified Chinese UI and JSON content. Use when adding or editing blog posts, portfolio projects, news presentation, static interface copy, localized metadata, or when checking translation coverage and locale-file structure.
---

# Translate Portfolio Content

Keep English (`en`) as the canonical source and maintain Japanese (`ja`) and Simplified Chinese (`zh-CN`) overlays without changing stable identifiers, routes, code, or media.

## Workflow

1. Read [references/content-localization.md](references/content-localization.md).
2. Inspect `git status` and the relevant English source files. Preserve unrelated changes.
3. Finish or update the English source first.
4. Translate every user-visible prose field into `post.ja.json` and `post.zh-CN.json`, or `project.ja.json` and `project.zh-CN.json` sibling files.
5. Preserve array order and object shape. Never translate or change slugs, IDs, URLs, dates, asset paths, code, equations, symbols, file names, syntax labels, icon names, or style tokens. Keep equation `expression` values identical whether they are a string or an array of row strings.
6. Build a narrow protected glossary of proper names, paper-defined model or method names, and explicitly approved article-specific exceptions. For Simplified Chinese, translate ordinary technical vocabulary in prose, headings, keyword labels, and tables into natural Chinese; an English source term is not automatically protected. Follow the terminology rules in the reference.
7. Review technical terminology and proper nouns manually. Keep Unreal Engine, DirectX, GitHub, Qt, Siv3D, PSF, SSR, and SSAO unchanged.
8. For static UI copy, add the same key to all dictionaries in `public/assets/js/i18n.js`, then annotate the HTML or render it through `portfolioI18n.t(...)`.
9. Run `npm test`, then preview all three locales. Check navigation, filters, dates, long headings, code blocks, equations, tables, links, and mobile layout.

## Drafting translations

Translate directly when practical. To draft many public JSON fields, use `scripts/translate_json_google.py` only after confirming that sending the public prose to Google Translate is acceptable:

```powershell
python .agents/skills/translate-portfolio-content/scripts/translate_json_google.py ja <source-json-files>
python .agents/skills/translate-portfolio-content/scripts/translate_json_google.py zh-CN <source-json-files>
```

Treat generated text as a draft. Review it before delivery. The script overwrites sibling locale files and intentionally excludes stable technical fields.

## News policy

Localize the News page interface, controls, states, and dates. Keep automatically collected third-party headlines and summaries in their source language by default so the daily collector stays deterministic and does not misrepresent publishers. If the user explicitly requests translated news items, store translations as optional locale overlays and keep the original text as fallback.

## Completion criteria

- Every authored blog post and portfolio project has both locale overlays.
- Every new static UI key exists in `en`, `ja`, and `zh-CN`.
- English fallback still renders if an optional overlay is unavailable.
- Stable routes, filters, links, assets, code, and equations are unchanged.
- `npm test` and visual checks pass.
