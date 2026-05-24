# Add guided lesson mode

## Problem

The playground is useful for free exploration, but learners would benefit from short guided experiments.

## Proposal

Add a lesson mode that presents step-by-step tasks and checks whether the circuit matches the goal.

## Acceptance Criteria

- [x] A lesson panel can show a title, objective, and steps
- [x] At least one starter lesson exists for battery + switch + bulb + variable resistor
- [x] Multiple guided experiments can be selected from the lesson panel
- [x] The app can detect simple success states, such as the bulb being on
- [x] Lesson content is stored in editable data rather than hardcoded UI text
- [x] Each lesson can load a matching starter workspace
- [x] Free play remains available without entering lesson mode

## Notes

Keep lessons short and visual. The goal is to guide discovery, not build a textbook inside the app. Next polish: add contextual hints for the next incomplete step.
