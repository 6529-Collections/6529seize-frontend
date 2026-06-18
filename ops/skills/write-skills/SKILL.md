---
name: write-skills
description: Create, improve, or review Codex/OpenAI Agent Skills and SKILL.md files. Use when writing a new skill, updating an existing skill, designing skill frontmatter and trigger behavior, choosing scripts/references/assets, validating skill structure, or turning repeatable Codex workflows into reusable skills.
---

# Write Skills

## Principles

- Keep each skill focused on one job. Split broad workflows into separate skills or references.
- Treat frontmatter as the routing surface. Put all "when to use this skill" guidance in `description`, because the body is only loaded after the skill triggers.
- Assume Codex is already capable. Add only procedural knowledge, repo-specific context, examples, scripts, and constraints that materially improve repeatability.
- Prefer clear instructions over scripts unless deterministic behavior, external tooling, or repeated code would reduce mistakes.
- Use progressive disclosure: keep `SKILL.md` lean, put large details in directly linked `references/`, and keep output templates or reusable files in `assets/`.
- Write imperative steps with explicit inputs, outputs, and validation.
- Test trigger behavior with prompts that should invoke the skill and prompts that should not.

## Topics To Cover

When writing or reviewing a skill, decide whether each topic belongs in the skill:

- Frontmatter and trigger behavior
- Skill name and folder layout
- Task scope, anti-scope, and adjacent non-triggers
- Required inputs and expected outputs
- Step-by-step workflow
- Tool, command, or file conventions
- Scripts, references, and assets
- Validation and forward-testing
- Safety constraints, permissions, and destructive-action guardrails
- Maintenance notes, only when they change future use of the skill

If a topic is not needed for the skill's job, omit it. A short complete skill is better than a broad checklist pasted everywhere.

## Workflow

1. Clarify the target job

   Identify the narrow repeatable task, likely users, concrete prompts, expected outputs, and adjacent prompts that should not trigger the skill. If the job is ambiguous, ask for one or two examples before writing.

2. Choose name and location

   Use lowercase letters, digits, and hyphens only. Keep the folder name identical to the skill name. In this repo, place repo-local skills under `ops/skills/<skill-name>/SKILL.md` unless the user asks for another skill location.

3. Plan resources

   Use only resources that directly help the skill execute:

   - `scripts/`: deterministic tooling or repeated code that should not be rewritten each time.
   - `references/`: detailed docs, schemas, policies, API notes, or examples that should be read only when needed.
   - `assets/`: templates, images, fonts, boilerplate, or files used in final outputs.

4. Write `SKILL.md`

   Include only YAML `name` and `description` in frontmatter. In the body, describe the shortest reliable workflow, decision points, resource usage, and validation. Avoid a "when to use" body section because it cannot affect triggering.

5. Validate and iterate

   Check the folder name, frontmatter, trigger specificity, resource links, examples, and absence of unfinished placeholders. For complex skills, forward-test with realistic prompts and improve the skill based on failures.

## Frontmatter

Put frontmatter at the very top of `SKILL.md`:

```yaml
---
name: write-useful-skill
description: Create useful widgets from CSV exports. Use when Codex needs to turn a CSV, spreadsheet export, or tabular report into a small interactive widget with filtering, sorting, and validation.
---
```

Rules:

- Use exactly one skill name and one description.
- Keep `name` lowercase with letters, digits, and hyphens.
- Make the folder name match `name`.
- Write `description` as both capability and trigger policy: what the skill does, when to use it, file types, tools, common phrases, and important exclusions when needed.
- Do not rely on the body to explain when the skill should be used.
- Do not invent extra frontmatter fields unless the target skill system explicitly requires them.

Good descriptions are specific enough to route:

```yaml
description: Create, edit, and validate Solidity audit checklists for this repository. Use when reviewing Stream smart contracts, triaging security findings, writing remediation tasks, or preparing audit notes for Solidity changes.
```

Weak descriptions are too broad:

```yaml
description: Helps with engineering tasks.
```

## Body Topics

Use the body for instructions loaded after the skill triggers:

- `Workflow`: ordered actions the agent should follow.
- `Decision points`: how to choose between valid approaches.
- `Resource use`: when to read references, run scripts, or use assets.
- `Validation`: commands, checks, review criteria, and expected evidence.
- `Examples`: short examples only when they clarify trigger behavior or output shape.
- `Anti-patterns`: mistakes the skill is specifically meant to prevent.

Avoid generic tutorials. If Codex can infer it, leave it out.

## SKILL.md Template

```markdown
---
name: concise-skill-name
description: Do the specific repeatable job. Use when Codex needs to handle concrete scenario A, scenario B, or scenario C; include important file types, tools, or trigger phrases here.
---

# Concise Skill Name

## Workflow

1. Do the first required action.
2. Choose between options using explicit criteria.
3. Use linked resources only when the task needs them.
4. Validate the result with named checks.

## Resources

- Read `references/example.md` only when ...
- Run `scripts/example.py` when ...
- Use `assets/template.ext` when ...
```

Delete unused resource sections. Do not create placeholder resources.

## Quality Checklist

- The skill has exactly one required `SKILL.md`.
- The frontmatter contains only `name` and `description`.
- The description names the job and trigger contexts clearly enough for routing.
- The body is concise, procedural, and under 500 lines.
- Long details are moved into directly linked reference files.
- Scripts, if present, have been run or otherwise validated.
- Assets, if present, are files the skill actually uses in outputs.
- No README, changelog, installation guide, or process-history files were added inside the skill folder unless the user explicitly requested them.
- Positive trigger prompts and negative trigger prompts have been considered.
- The skill avoids hardcoded local assumptions unless it is intentionally repo-specific.

## Trigger Test Prompts

Before considering the skill done, write or mentally check a small prompt set:

- Positive explicit: "Use `$skill-name` to ..."
- Positive implicit: "Help me do the task this skill exists for ..."
- Contextual: a realistic request with extra details that should still trigger.
- Negative adjacent: a nearby task that should not trigger this skill.

If the skill would trigger too broadly, narrow the description. If it would not trigger for the intended prompts, add concrete trigger phrases or file/task contexts to the description.

## Anti-Patterns

- Do not write broad skills like "do engineering better" or "help with docs."
- Do not bury trigger conditions in the body.
- Do not include generic advice Codex already knows.
- Do not duplicate detailed reference content in `SKILL.md`.
- Do not add generated build outputs, logs, or cache files as skill resources.
- Do not claim validation happened unless commands or review actually confirmed it.
