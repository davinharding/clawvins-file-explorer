---
name: morning-brief
description: Summarize overnight agent activity into a short brief for the human.
schedule: "0 8 * * *"
---

1. Pull tasks updated since the last brief from Mission Control.
2. Group by **done**, **in progress**, **blocked**.
3. Add anything from `memory/` that needs a decision.
4. Post the brief and link each item back to its task.
