---
name: miguel-professional-context
description: Provides only the relevant parts of Miguel Virgílio’s documented professional profile as context for another task. Use when a task needs accurate facts about his experience, skills, education, projects, portfolio, areas of work, positioning, or professional goals.
---

# Miguel Professional Context

## Purpose

Provide other tasks and chats with the smallest sufficient portion of Miguel Virgílio’s documented professional context. This Skill is a source of profile information; it does not perform the downstream task.

## Source of truth

The files in `references/` are the sole source of truth for Miguel’s professional profile. Do not invent or infer undocumented skills, proficiency, experience, employers, education, projects, preferences, or goals. Preserve the level of proficiency and qualifications used in the source material.

## Selective loading

1. Read `references/00_INDICE_ROUTER.md` to identify the most relevant module or modules for the information the current task needs.
2. Read only those modules. Do not load every reference by default.
3. If the selected modules do not contain an essential fact, consult the single most relevant additional module.
4. Read the complete profile only if the task explicitly requires a global view of all documented competencies, experience, education, and projects. In that case, read modules `01` through `11` as well as the router.
5. Return only the useful facts for the downstream task. Do not reproduce unrelated profile information or expose the routing process unless asked.

## Scope

Use this Skill only to retrieve, select, and accurately summarize professional context. A task that uses the profile to create a CV, research employers, prospect companies, search for jobs, browse the web, analyze spreadsheets, or carry out another external activity belongs to the requesting task; this Skill supplies relevant context only and does not add or perform those capabilities.

## Profile maintenance

When asked to record a durable professional update, edit the narrowest relevant reference module. Update `01_PERFIL_GERAL.md` only if the general profile changes; update `10_PROJETOS_PORTFOLIO.md` for a new or changed project; update the router only if a new information category or routing rule is needed. Avoid duplicating detail across modules.
