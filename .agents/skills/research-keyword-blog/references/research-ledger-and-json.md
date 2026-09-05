# Research ledger and portfolio JSON

## Coverage ledger

Create a working record before drafting:

| Field | Purpose |
| --- | --- |
| Section | User-supplied location and order |
| Keyword | Exact supplied term or clearly marked addition |
| Meaning | Intended technical sense in this article |
| Related terms | Synonyms, prerequisites, successors, or sub-techniques |
| Evidence group | Terms genuinely covered by the same sources |
| Source | Paper, specification, official documentation, or implementation |
| Source role | Original method, later improvement, normative contract, or production practice |
| Supported claim | Exact fact the source establishes |
| Explanation | Concise, standalone definition for this keyword |
| Equation | Useful expression plus symbol or mechanism note, when applicable |
| AI relationship | Direct, adjacent, or no direct AI research track |
| AI source and date | Recent primary work, venue or status, and relevance |
| Gap | Missing source, ambiguity, or unsupported historical claim |

Research sources one keyword at a time. Merge ledger rows only after confirming that the shared publication directly supports every merged term.

## Source selection rules

Use this priority order:

1. Original paper or author/project publication page.
2. Normative standard or official API specification.
3. Official engine, SDK, or production documentation.
4. Author-maintained reference implementation.
5. Recent survey for taxonomy or historical navigation.

Prefer a stable publication page or DOI over an unversioned file mirror. For modern techniques, pair research with current official implementation documentation when useful. Replace dead links; do not preserve a weak URL solely because it appeared in an earlier draft.

For "newest" or "hot" research, search relative to the current date and prefer primary work from roughly the last two years. Explain the technical change that makes a source relevant. A popular non-neural paper may be included as an explicitly labeled companion, but it does not satisfy an AI-source requirement.

## Keyword-source JSON

Define each source once:

```json
{
  "sourceCatalog": {
    "microfacet01": {
      "label": "Microfacet Models for Refraction through Rough Surfaces",
      "url": "https://doi.org/10.2312/EGWR/EGSR07/195-206"
    },
    "microfacet02": {
      "label": "PBRT: Roughness Using Microfacet Theory",
      "url": "https://pbr-book.org/4ed/Reflection_Models/Roughness_Using_Microfacet_Theory"
    }
  }
}
```

Attach a defensible group to its section:

```json
{
  "keywordSourceGroups": [
    {
      "keywords": [
        "microfacet model",
        "GGX",
        "Trowbridge–Reitz distribution",
        "normal-distribution function",
        "NDF"
      ],
      "summary": "The rough-surface microfacet model uses an NDF; GGX is the common name for the long-tailed Trowbridge–Reitz distribution used in modern PBR.",
      "sourceIds": ["microfacet01", "microfacet02"],
      "details": [
        {
          "keyword": "microfacet model",
          "explanation": "A statistical surface model that replaces unresolved roughness with distributions of microscopic facets.",
          "equation": {
            "expression": "f_r = DFG / (4 |n·v| |n·l|)",
            "note": [
              "D: the facet-orientation distribution.",
              "F: Fresnel reflection.",
              "G: masking and shadowing."
            ]
          },
          "aiNote": "Neural appearance models can learn compact evaluation and importance sampling for layered microfacet behavior, while this analytic BRDF remains the physical reference."
        },
        {
          "keyword": "GGX",
          "explanation": "The common graphics name for the long-tailed Trowbridge–Reitz microfacet distribution.",
          "aiNote": "Learned material models may approximate GGX responses, but GGX itself is a deterministic distribution rather than an AI method."
        }
      ]
    }
  ]
}
```

The shortened example omits the remaining detail entries; production JSON must contain exactly one `details` entry for every keyword, in the same order. Keep shared links at group level.

Add current research once per section:

```json
{
  "aiResearch": {
    "summary": "Real-time neural appearance models compress layered material behavior and can learn both evaluation and sampling, while analytic BRDFs remain useful supervision and editing controls.",
    "sourceIds": ["neuralAppearance01", "neuralShading01"]
  }
}
```

Use two or three source IDs by default. If the user explicitly requests separate quotas for papers and documentation, expand the evidence set or schema deliberately and validate each source role. Do not duplicate one group into per-keyword records merely to repeat the same links.

When expanding research to match an existing article, the renderer also supports `aiResearch.explanations` as an array of `{ "title": "Method: mechanism", "text": ["Input and learned representation.", "Computation, output, and limitation."] }` objects and `aiResearch.flows` as an array of standard `{ "label": "Method sequence", "steps": [{ "title": "Stage", "text": "What happens" }] }` blocks. Keep the shared `sourceIds` in the research block. Explain what is learned, what still uses a conventional solver, and what the method does not establish. Keep corresponding locale arrays aligned with the canonical source; translate generic Chinese technical prose even when a neighboring example leaves it in English.

## Per-keyword writing rules

- Make `explanation` understandable without reading another keyword's entry.
- Include `equation` only when an accepted relationship adds understanding. Define symbols, operations, and caveats as separate entries in a `note` array so the renderer places each concept on its own line.
- Make `aiNote` name the keyword's actual relationship to current research.
- Use direct wording for learned methods, qualified wording for adjacent work, and explicit wording when no direct AI track exists.
- Avoid one generic AI template across unrelated keywords. Review optics, simulation, rendering, reconstruction, standards, and API contracts separately.
- Put two or three recent AI sources and their synthesis in `aiResearch`; do not repeat those URLs in every detail.

## Final audit

Count flattened keyword arrays and compare them with the original outline. Then verify:

- no supplied keyword disappeared or changed spelling;
- every addition is intentional;
- every source ID exists in `sourceCatalog`;
- each group has two or three unique sources;
- every group has one detail per keyword in identical order;
- every detail has `explanation` and `aiNote`;
- every equation has `expression` and a nonempty `note` array with one concept per line;
- every section has an `aiResearch` summary and two or three valid sources when AI research was requested;
- each summary matches all keywords in its group;
- no source is cited for a claim it does not support;
- identical URLs use one canonical catalog ID globally;
- AI notes do not overstate adjacent or non-neural research;
- locale section arrays remain aligned with English when locale overlays exist.
