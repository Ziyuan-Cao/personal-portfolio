---
name: research-keyword-blog
description: Turn a user-supplied technical structure and keyword list into a researched, evidence-led article or portfolio post. Use when Codex must preserve an outline, discover missing or modern terms, explain every keyword, add useful equations, connect terms to current AI research without forcing false relationships, research primary papers and official documentation, deduplicate shared evidence, or create and update this portfolio's blog JSON.
---

# Research Keyword Blog

Build a technical source guide from the user's own structure without silently replacing their vocabulary or organization.

Read [references/research-ledger-and-json.md](references/research-ledger-and-json.md) before researching or creating a portfolio `post.json`.

## Follow the workflow

1. Capture the supplied structure.
   - Preserve every user-provided heading and keyword verbatim and in order unless the user authorizes rewriting.
   - Build a coverage ledger before drafting.
   - Record ambiguous terms instead of guessing their intended meaning.
   - For a concision or deduplication pass, assign each shared concept one main section. Merge synonyms, acronyms, and closely related components into one useful entry; remove basic dictionary terms already clear from the introduction. Preserve distinct algorithms and meaningful tradeoffs. User-authorized consolidation takes precedence over verbatim keyword preservation.

2. Expand the vocabulary.
   - Search for missing prerequisites, accepted synonyms, sub-techniques, modern successors, production implementations, limitations, and neighboring concepts.
   - Add only terms that make the supplied structure more complete.
   - Keep additions distinguishable from the user's original terms during research. Merge them into the final outline only when their placement is justified.

3. Research every keyword or defensible keyword group.
   - Browse the web; do not rely on memory for source discovery or current implementation documentation.
   - Prefer original or author-hosted papers, DOI publication pages, normative specifications, official API documentation, official engine documentation, and reference implementations from the authors.
   - Use surveys, tutorials, or secondary explanations only to discover primary sources or fill a clearly labeled historical overview.
   - Collect two or three useful sources per keyword group. Do not add irrelevant links merely to reach a number.
   - If the user requests separate paper and documentation quotas, satisfy and track those roles separately when suitable sources exist; never count one URL twice.
   - Record what each source establishes. Distinguish invention papers, later improvements, normative contracts, and production documentation.
   - Research the current AI thread for each section and keyword. Prefer recent primary work, but retain an older seminal source when it explains the lineage.
   - Verify freshness against the current date. Record publication year, venue or status, and why the work is relevant instead of calling it merely "new" or "hot."

4. Group shared evidence carefully.
   - Group keywords only when every cited source directly treats them as the same model, algorithm, representation, pipeline stage, or API contract.
   - Write one concise summary explaining the relationship covered by the shared sources.
   - Display the links once for the whole group.
   - Define one catalog entry per URL and reuse its source ID everywhere. Merge aliases that resolve to the same paper or documentation page.
   - Split the group when a source supports only some terms. A broad chapter about a topic is not automatic evidence for every keyword beneath it.
   - Reuse a source in another group only when it independently supports that group's claim.

5. Write the article.
   - Lead each section with the technical claim, then explain the mechanism and consequence.
   - Define terms before using abbreviations.
   - Keep equations, spaces, units, stages, inputs, and tradeoffs explicit.
   - Give each retained concept a concise explanation. Do not create separate entries for a synonym, acronym expansion, elementary component, or a concept already explained in another section; refer back briefly when only the application changes.
   - Add an equation only when it clarifies the mechanism. Define its symbols or state what the equation demonstrates; never add decorative math.
   - Keep equation `note` arrays compact, usually one to three lines. Group related symbols in one sentence and explain only non-obvious quantities, assumptions, or caveats. Omit separate definitions of indices, ordinary operators, constants, and symbols already defined nearby. Keep a shared equation in one place; remove elementary or redundant formulas when prose suffices.
   - Use a per-keyword AI note only when it adds a relationship not already explained in section research. Distinguish direct learned methods, adjacent research, and non-neural mechanisms without repeating a generic AI disclaimer for every term.
   - Add one short current-AI synthesis per section with two or three recent primary sources. Put shared AI links in this section block instead of repeating them under every keyword.
   - When the user requests expanded `aiResearch` explanations, match the neighboring sections' structure: explain each named method's inputs, learned representation, inference or solver steps, output, and relevant limit in short paragraphs. Add a simple per-method flow when it clarifies the sequence. Distinguish offline training from runtime computation and geometric preprocessing from learned prediction.
   - Keep each research method together: title, explanation, its useful equations, then its flow before the next title. Store method-specific equations and flows inside that method's `aiResearch.explanations[]` entry; reserve research-level equations and flows for genuinely shared material. Do not add an equation just to fill this sequence.
   - Distinguish AI work from important non-neural companion research such as sampling, reuse, or deterministic reconstruction algorithms.
   - Add tables, code, or flows only when they clarify a relationship.
   - Keep source summaries factual. Do not claim that a paper invented a term unless the publication establishes that history.
   - End with a compact synthesis rather than another source list.

6. Integrate with the portfolio when requested.
   - Follow the `write-portfolio-blog` skill for editorial style and general post structure.
   - Store the post at `public/content/blog/<folder>/post.json` and register it in `public/content/blog/index.json` when it is new.
   - Use `sourceCatalog` and `keywordSourceGroups` for keyword guides as shown in the reference file.
   - Store per-keyword prose in `keywordSourceGroups[].details` and section research in `sections[].aiResearch` when the renderer supports this schema.
   - Keep URLs and source IDs stable across locale overlays. Use `translate-portfolio-content` when localized content must change.
   - In Chinese prose, translate ordinary technical terms and retain English for paper-specific model/method names and necessary proper names. Matching an existing section's style does not require copying its mixed-language wording.

## Validate before finishing

- Confirm supplied-keyword coverage, accounting for any user-authorized merges or removals; do not restore terms deliberately removed during a concision pass.
- Confirm that added keywords are technically relevant and placed deliberately.
- Confirm each group has a useful summary and directly relevant sources. Cite per detail when methods require different evidence; do not pad a narrowly supported method to reach a source count.
- Confirm each retained concept has an explanation, detail order matches keyword order, and equations have concise notes without repeated notation definitions.
- Confirm that each section AI block has two or three directly relevant, current primary sources.
- Confirm that source IDs resolve, URLs are globally unique in the catalog, and shared links render only once in their evidence or AI block.
- Check publication identity, authorship, year, and whether the linked page is actually primary or official.
- Check AI wording for category errors: simulation is not rendering, reconstruction is not a display standard, and a non-neural paper must not be labeled AI.
- Separate documented facts from inference in the prose.
- Validate JSON and run `npm test` after portfolio integration.

Report the number of original and added keywords, per-keyword explanations, equations, evidence groups, current-AI blocks and sources, plus any unresolved research gaps.
