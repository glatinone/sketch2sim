---
title: "Two Claude Code sessions, one folder, no merge conflicts: how I split a hackathon build between AI agents"
published: true
description: "File ownership, a frozen contract and two status files let two AI coding sessions build one app in parallel. What worked and what broke."
tags: ai, productivity, hackathon, programming
cover_image: https://glatinone.github.io/sketch2sim/blog/cover-2.png
series: Hackathon log
---

*Hackathon log, part 2. [Part 1](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm) covers what Sketch2Sim is: a photo of a circuit sketch goes in, a Wokwi project that runs comes out. This part is about how it got built.*

I entered the MLH Hacktoberfest Hack Day in Batam alone, with about two and a half hours of build time. Instead of one AI coding session doing everything in sequence, I ran two Claude Code sessions at the same time, in the same folder, on the same laptop. They built one app together and never had a merge conflict.

This post is the setup I used, the timeline it produced, and the four things that broke. Everything below comes from the status files the sessions wrote during the day.

![Gantt chart of the build day: me, Session A, Session B and subagents, from 12:30 to 15:00](https://glatinone.github.io/sketch2sim/blog/timeline.png)

## The setup: written before any code

I spent the first seven minutes writing a plan, not code. Three pieces made parallel work possible.

### 1. One owner per file

```
sketch2sim/
├── src/contract/types.ts   ← frozen; changing it needs a note in both status files
├── src/engine/**           ← Session A only
├── scripts/run-engine.ts   ← Session A only
├── package.json, configs   ← Session B only (the only one allowed to npm install)
└── everything else in src/ ← Session B only
```

Both sessions shared one working tree with no branches and no worktrees. Git was just the record. The ownership table did the conflict prevention.

### 2. A frozen contract

One TypeScript file defined everything the two halves needed to agree on:

```ts
export interface CompileInput {
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg";
  board: Board;
  apiKey: string;
  modelId: string;
}

export type CompileSketch = (input: CompileInput) => Promise<CompileResult>;
```

Session B (the app) built the whole UI against a mock that returned a realistic fake `CompileResult` after 1.5 seconds. It never waited for the engine. When Session A posted "engine ready", B flipped one constant in `compileClient.ts` and the app was talking to Gemma 4.

### 3. Two status files as a message bus

Each session wrote only to its own file, `status/A.md` or `status/B.md`, and read the other one before starting each task. Every entry was one line:

```
[12:52 WIB] A5 DONE — ENGINE READY. Live compile of a hand-drawn UNO+BUTTON+LED sketch: valid circuit, 0 fixes needed.
[12:56 WIB] SYNC1 DONE — INTEGRATED: USE_MOCK off. Live compile of presets/blink-button.png through the UI: OK.
```

Anything one session needed from the other went under a "Requests to other session" heading in its *own* file. Neither session ever edited the other's status file.

![Two Claude Code sessions coordinating through a frozen contract and separate status files](https://glatinone.github.io/sketch2sim/blog/two-sessions.png)

## What it produced

From the logs:

| Time (WIB) | Event |
|---|---|
| 12:31 | Plan, contract and both briefs written |
| 12:39 | Session B: scaffold ready, build passes |
| 12:52 | Session A: engine ready, first live compile works |
| 12:56 | Session B: UI switched from mock to the real engine |
| 13:02 | Session B: README, contributing guide, public repo |
| 13:08 | Session A: three presets plus cached fallbacks |
| 13:35 | Five generated circuits verified running in Wokwi |
| 14:22 | Session B: slide deck and demo video done |

The engine was ready about 50 minutes ahead of the schedule I'd written in the plan. That buffer paid for everything that went wrong later.

## Subagents for the slow side quests

Session A kept writing engine code while it handed slow, self-contained jobs to subagents that ran in the background:

- **Getting an API key.** One subagent drove my logged-in browser to Google AI Studio, created a free Gemini API key, saved it to a local `.env`, and then probed Gemma 4: which model IDs exist, whether image input works, whether JSON mode and system instructions are accepted, and how long each call takes.
- **Research.** Another checked every Wokwi pin name against the official docs and the `wokwi-cli` diagram linter, so the part catalog wasn't built from memory.
- **Verification.** Later ones pasted generated projects into the real Wokwi editor, pressed play, held the virtual button, and saved screenshots as proof.
- **End-to-end and mobile QA.** One ran the full flow on the deployed app; another emulated an iPhone and measured horizontal overflow on every screen.

The rule I'd keep: subagents do jobs whose answer fits in a short report. The main session never reads their transcripts, only their conclusions.

## What broke (and what I'd do differently)

**1. Cleanup collisions.** Session B tidied its temp files and also deleted Session A's temporary browser profiles and killed browser processes that matched a name pattern. It owned up to it in its status file, which is the only reason A knew. Lesson: cleanup must be scoped to things *you* created, by exact path or ID, never by pattern.

**2. Unsaved state in an agent-owned browser window is fragile.** A subagent filled in the MLH submission form and left it open for my review. Later, another agent ended its own browser session, the window holding the form closed, and the whole fill was gone. Nothing had been saved, because I'd asked for review before submit. It took one more subagent run to fill it again. Lesson: if a human needs to review something, put it somewhere that survives (a saved draft, or the text in a file) instead of an open tab.

**3. I let an agent get too close to submitting.** I asked a subagent to fill the submission form and submit it. Halfway through, I decided I wanted to review first and stopped it. The stop message only reaches a running subagent at its next step, so for a moment I couldn't be sure what it had clicked. It hadn't submitted anything. Lesson: for anything public or irreversible, agents prepare and a human presses the button. Write that into the brief from the start.

**4. Trust, then verify.** Subagent reports were mostly accurate, but I checked the ones that mattered myself. For example, I confirmed the YouTube title through YouTube's public oEmbed endpoint instead of trusting "title set correctly". It was right. One time a report noted that a checkbox hadn't stuck on the first click, and that was true too.

## Ownership can move, if you announce it

Late in the day, Session B was busy rendering the demo video and the app needed a proper phone layout. Session A took over every UI file with one line in its status file:

```
[14:04 WIB] OWNERSHIP CHANGE — A now owns ALL app UI files for a mobile overhaul … B: please don't edit these until A posts MOBILE DONE.
```

A finished the mobile layout, posted `MOBILE DONE`, and handed the files back. The same protocol that prevented conflicts also made the handover cheap.

## A template you can copy

If you want to try this on your next hackathon or side project:

1. Write the ownership table before any code. Every path gets exactly one owner.
2. Freeze one contract file. Give the UI side a mock that satisfies it.
3. One status file per session, one line per update, requests in your own file.
4. Only one session installs dependencies and pushes.
5. Agents prepare outward-facing actions (posts, submissions, uploads); a human confirms them.

Total cost of the setup: about seven minutes and half a page of Markdown. For me it was the best seven minutes of the day.

*Next in the series: part 3 goes inside the engine: what Gemma 4 vision reads well, where it slips, and the validator that fixes it.*

---

**Hackathon log: building Sketch2Sim**

1. [From a paper sketch to a running circuit: building Sketch2Sim with Gemma 4 in one hack day](https://dev.to/kielltampubolon/from-a-paper-sketch-to-a-running-circuit-building-sketch2sim-with-gemma-4-in-one-hack-day-2ndm)
2. [Two Claude Code sessions, one folder, no merge conflicts: how I split a hackathon build between AI agents](https://dev.to/kielltampubolon/two-claude-code-sessions-one-folder-no-merge-conflicts-how-i-split-a-hackathon-build-between-ai-3d5n)
3. [What Gemma 4 vision gets right about circuit sketches, and the validator that fixes the rest](https://dev.to/kielltampubolon/what-gemma-4-vision-gets-right-about-circuit-sketches-and-the-validator-that-fixes-the-rest-g18)
4. [From Arduino sketches to digital twins: where Sketch2Sim goes next, and how to get involved](https://dev.to/kielltampubolon/from-arduino-sketches-to-digital-twins-where-sketch2sim-goes-next-and-how-to-get-involved-2bcb)
