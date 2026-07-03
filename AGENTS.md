# Agent Notes

Before doing broad code exploration in this repository, read the documentation index first:

- Chinese: `docs/context-index.zh-CN.md`
- English: `docs/context-index.md`

Use the index to choose the smallest relevant set of docs before opening source files. This avoids repeatedly spending context on decisions, architecture notes, release plans, and recent-change summaries that have already been written down.

Default workflow for future agents:

1. Read `docs/context-index.zh-CN.md` or `docs/context-index.md`.
2. Follow the routing table there for the user's task.
3. Only then inspect implementation files with `rg`, targeted `sed`, or tests.
4. When a new durable convention or pull summary is discovered, add or update a short doc and link it from the context index.

Project-specific reminders:

- Product north star: `xshow` is an interactive computer science visualization platform connecting signals, circuits, machines, and algorithms.
- Mainline path: signal/circuit layer -> logic/memory layer -> machine layer -> algorithm layer.
- Experimental area: tank lab, 3D Rubik's cube, and other standalone prototypes that do not yet serve the mainline path.
- Keep English and Chinese docs aligned when a document has both versions.
- Do not read every doc by default; read the index, then the relevant docs.
