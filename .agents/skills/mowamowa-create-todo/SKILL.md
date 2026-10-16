---
name: mowamowa-create-todo
description: Create one or multiple tasks in the user's MowaMowa app through the MowaMowa MCP server. Use only when the user explicitly asks to add, create, or remember one or more todos in MowaMowa, including comma-separated, numbered, bulleted, or newline-separated task lists.
---

Create MowaMowa tasks from the user's explicit request.

1. Split only clearly enumerated items: commas, semicolons, numbered or bulleted lines, or separate lines. Keep a phrase together when splitting would change its meaning.
2. If the item boundaries are genuinely ambiguous, ask one concise question. Otherwise proceed.
3. Normalize a concise title for each item. Infer optional fields only from information attached to that item.
4. Resolve relative deadlines to ISO 8601 with the user's local timezone.
5. Call the `mowamowa` MCP server's `create_task` tool exactly once per item, in the user's order. Never edit the MowaMowa SQLite database directly.
6. Do not retry a failed creation automatically. Stop and report created items plus the item that failed, preventing unnoticed duplicates.
7. Return every created title, status, deadline if present, and task ID. For one item, use the same compact result format.
