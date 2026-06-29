# Practical UI Skill

Agent skill containing logic-driven UI design guidelines from [Practical UI](https://www.practical-ui.com/) by Adham Dannaway.

## Structure

- `SKILL.md` — Entry point with when-to-apply guidance and quick reference
- `AGENTS.md` — Compiled guidelines for agents (full document)
- `rules/` — Individual rule files by category
  - `_sections.md` — Section metadata
  - `_template.md` — Template for new rules
- `metadata.json` — Version and references

## Usage

Agents should read `SKILL.md` first, then `AGENTS.md` or specific rule files under `rules/` when implementing or reviewing UI.

## Categories

1. **fundamentals** — Logic, consistency, hierarchy, grouping
2. **simplicity** — Remove noise, visible content
3. **color** — Purposeful colour, WCAG contrast
4. **layout** — Proximity, spacing scale, grid
5. **typography** — Type system and readability
6. **copy** — Headings and scannable content
7. **forms** — Labels and hints
8. **buttons** — Weights, targets, semantics

## Attribution

Guidelines derived from publicly available Practical UI content. The full book contains 100+ guidelines with visual examples—support the author at [practical-ui.com](https://www.practical-ui.com/).
