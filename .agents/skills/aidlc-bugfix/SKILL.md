---
name: aidlc-bugfix
generated-by: aidlc-runner-gen
description: >
  Run the AI-DLC workflow with the bugfix scope baked in — no scope
  detection. Fix a specific bug. Packaging over `/aidlc --scope bugfix`, which works
  without this skill.
argument-hint: "[description | --status | --stage <slug|#> | --phase <name|#>]"
user-invocable: true
---

# AI-DLC — bugfix scope

Drive the AI-DLC engine with the **bugfix** scope fixed. This is the same
deterministic forwarding loop the `/aidlc` orchestrator runs, with `--scope
bugfix` baked into the first `next` so scope detection is skipped. The
engine owns all routing; the conductor persona arrives on the first directive's
`conductor_persona` field — adopt it for the whole run.

## The loop

1. `directive = aidlc engine orchestrate next --scope bugfix $ARGUMENTS`
2. Before acting on each directive, read
   `.aidlc/aidlc-common/protocols/stage-protocol.md` once per session,
   then read every
   `.aidlc/aidlc-common/protocols/stage-protocol-<module>.md` named by
   `directive.protocol_modules`. Load every listed module before acting; skip
   only a module already loaded earlier in this session. Then act on
   `directive.kind` exactly as the orchestrator does (run-stage / invoke-swarm /
   ask / print / error / done). Every engine `ask` carries `ask_type` and
   `response_route`: `next` follows the chosen command, `command` runs
   `resume_command` only when the human chooses to resume and then re-runs
   `next` (otherwise it waits for their direction), `claim` follows the Unit claim
   contract, and `execute-remedy` offers only executable guard remedies and
   executes the human-selected command or action. An empty remedy list is
   terminal; wait for the human and invent no report, receipt, reset, or decision.
   For `intent-pick`, choose the `select_commands` entry by its exact
   `selector` and execute its complete `command` verbatim, never by selector
   interpolation. Scope and compose commands retain `--request <8hex id>`;
   never append the request text. The ask names the request only by id (a
   pasted `<document>` block stays in the question store as data),
   while `question` echoes at most 240 characters, ending in `...`. The engine
   carries the request through a second `new-work-routing` ask (a question of
   its own) on any harness and through compose/creation handoffs until creation
   succeeds; a repeated answer carries on with the work it started instead of
   creating it twice.
   That ask carries its routes as `new_intent_command`, `scope_commands`,
   `compose_command`, and `continue_command` for the active workflow or (with
   `available_intents`) `select_commands` and `reshape_commands`; run the chosen one verbatim and
   preserve its description and scope; an unselected intent with new work waiting
   is not an `intent-pick`.
   Legacy Plan Approval recovery keeps its explicit bare-`next` choice.
   Never use `report` as a fallback for an engine ask answer; a selected guard
   remedy may still explicitly name a stage report.
3. `aidlc engine orchestrate report --stage <directive.stage> --result <outcome> [--user-input "<text>"]` only after acting on a stage directive. The prompt-rendered resume menu is the sole non-stage report round-trip and uses `report --result resumed --user-input "<choice>"`.
4. Repeat from step 1 until `directive.kind == done`.

Pass `$ARGUMENTS` through verbatim after `--scope bugfix`; the engine parses
any flags (`--status`, `--stage`, …) and the `--scope` from the
state file always wins on an existing workflow, so re-running a started workflow
resumes it. To run a different scope, use `/aidlc --scope <other>` instead.

## Starting unrelated new work?

Before you forward `$ARGUMENTS` on step 1, make the SAME recognise-vs-route
judgment the `/aidlc` orchestrator makes: does this input **continue** the
active intent, or does it describe a **genuinely new, unrelated** piece of work?
This matters most when the active intent is already **complete**: then `next`
correctly returns `done` (the engine never creates alongside a live intent
without the confirmed new-work route), and the loop above would simply stop. New work is NOT a
continuation; the escape hatch is `next --new-intent`.

This recognition and conductor-authored offer apply only before an engine ask
is emitted. Once an ask exists, follow its typed route and supplied commands,
preserving any `--request` id rather than rebuilding the request.

- **Default to CONTINUATION.** Treat the input as new-work ONLY when it clearly
  names a distinct feature/bug/unit unrelated to the active intent's subject
  (`aidlc engine intent list --json` gives its `slug` and
  `status`). When in doubt, continue: false-positive offers are the main risk.
- **On genuine new-work, OFFER, never auto-create.** Surface an
  `AskUserQuestion` showing the active intent and the proposed new one, **including
  the scope you'd give the new intent**. Default that scope to this runner's baked
  `bugfix` (the new work is likely the same flavour that made the user reach for
  this command), but if the new work clearly fits a DIFFERENT scope, propose that
  instead, and name it so the human can correct it. **Lead the affirmative option
  with "Yes"** (e.g. "Yes, start a second intent"). Starting a workflow is a
  mutation gated on a human yes.
- **On CONFIRM**, re-run `next` with `--new-intent`, the confirmed scope, and the
  new-work text:

  ```bash
  aidlc engine orchestrate next --new-intent --scope <the confirmed scope> "<the new-work description>"
  ```

  The engine returns a `print` directive naming the `intent-create` command
  (with the `--label "<2-3 word kebab essence>"` placeholder). Act on it exactly
  as the loop's `print` handling describes: create the intent, then, because this is
  a NEW, unrelated intent and this session still carries the previous intent's
  context, **STOP** and follow the directive's hand-off: tell the user to start a
  fresh session (exit or restart the current harness and start a new session) and invoke `/aidlc` to begin the
  new intent with a clean slate. Nothing is lost; the intent is saved on disk.
- **On DECLINE**, proceed with the active intent, the normal loop above.
