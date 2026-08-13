#!/usr/bin/env python3
"""Translate portfolio JSON into a sibling locale overlay via Google Translate.

Only public prose is sent. Stable identifiers, URLs, code, equations, file names,
dates, and media paths are excluded. Review the generated prose before publishing.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


ENDPOINT = "https://translate.googleapis.com/translate_a/single"
TRANSLATABLE_KEYS = {
    "title", "subtitle", "abstract", "category", "imageAlt", "cardImageAlt",
    "lede", "closing", "heading", "paragraphs", "bullets", "caption", "alt",
    "label", "description", "note", "text", "columns", "callouts",
    "numberedSteps", "terms", "steps", "flow", "docLinks", "references",
    "sections", "tables", "technicalTables", "rows",
}
SKIP_KEYS = {
    "slug", "id", "url", "src", "image", "cardImage", "publishedAt",
    "readingTime", "file", "language", "code", "expression", "symbol",
    "icon", "tone", "type", "kind",
}


def is_translatable(value: str) -> bool:
    stripped = value.strip()
    return (
        bool(re.search(r"[A-Za-z]", stripped))
        and not stripped.startswith(("http://", "https://", "/content/"))
        and not (len(stripped) <= 30 and re.search(r"[_=<>\[\]{}]", stripped))
    )


def walk_strings(value, active=False, key="", result=None):
    if result is None:
        result = []
    if key in SKIP_KEYS:
        return result
    active = active or key in TRANSLATABLE_KEYS
    if isinstance(value, str) and active and is_translatable(value):
        result.append(value)
    elif isinstance(value, list):
        for child in value:
            walk_strings(child, active, key, result)
    elif isinstance(value, dict):
        for child_key, child in value.items():
            walk_strings(child, active, child_key, result)
    return result


def request_translation(values: list[str], locale: str) -> list[str]:
    separators = [f"<<<I18N_{index:04d}>>>" for index in range(1, len(values))]
    source = values[0]
    for separator, value in zip(separators, values[1:]):
        source += f"\n{separator}\n{value}"
    body = urllib.parse.urlencode({
        "client": "gtx", "sl": "en", "tl": locale, "dt": "t", "q": source,
    }).encode()
    request = urllib.request.Request(ENDPOINT, data=body, headers={"User-Agent": "Mozilla/5.0"})
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                payload = json.loads(response.read().decode("utf-8"))
            translated = "".join(segment[0] for segment in payload[0] if segment[0])
            pattern = "|".join(re.escape(separator) for separator in separators)
            matches = re.split(pattern, translated) if pattern else [translated]
            if len(matches) != len(values):
                raise ValueError(f"Expected {len(values)} translated fields, received {len(matches)}")
            return [match.strip() for match in matches]
        except Exception as error:
            last_error = error
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Translation request failed: {last_error}")


def translate_strings(values: list[str], locale: str) -> dict[str, str]:
    unique = list(dict.fromkeys(values))
    result = {}
    batch = []
    size = 0
    for value in unique + [None]:
        encoded_size = len(value.encode("utf-8")) if value is not None else 10_000
        if batch and size + encoded_size > 4_000:
            translated = request_translation(batch, locale)
            result.update(zip(batch, translated))
            batch, size = [], 0
        if value is not None:
            batch.append(value)
            size += encoded_size
    return result


def make_overlay(value, translations, active=False, key=""):
    if key in SKIP_KEYS:
        return None
    active = active or key in TRANSLATABLE_KEYS
    if isinstance(value, str):
        return translations.get(value, value) if active else None
    if isinstance(value, list):
        entries = [make_overlay(child, translations, active, key) for child in value]
        return [child if translated is None else translated for child, translated in zip(value, entries)] if active else None
    if isinstance(value, dict):
        result = {}
        for child_key, child in value.items():
            translated = make_overlay(child, translations, active, child_key)
            if translated is not None:
                result[child_key] = translated
        return result or None
    return value if active else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("locale", choices=("ja", "zh-CN"))
    parser.add_argument("files", nargs="+", type=Path)
    args = parser.parse_args()
    target_locale = "zh-CN" if args.locale == "zh-CN" else "ja"
    for source_path in args.files:
        source = json.loads(source_path.read_text(encoding="utf-8"))
        translations = translate_strings(walk_strings(source), target_locale)
        overlay = make_overlay(source, translations)
        target = source_path.with_name(f"{source_path.stem}.{args.locale}.json")
        target.write_text(json.dumps(overlay, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {target}")


if __name__ == "__main__":
    main()
