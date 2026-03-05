---
description: Call AI Infinite Dialog feedback interface. Use this at the end of EVERY response to keep the conversation going.
---

This workflow calls the AI Infinite Dialog feedback interface. You MUST replace YOUR_SUMMARY with a brief summary of the work you just completed.

**CRITICAL EXECUTION RULES**:

- Step 1 (health check): `Blocking=true` (fast, <3s).
- Step 2 (send feedback): **MUST use `Blocking=false`** with `WaitMsBeforeAsync=2000`. Using `Blocking=true` causes Cascade session timeout.
- Step 3 (poll): call `command_status` with `WaitDurationSeconds=60`. **As soon as status is DONE, go to Step 4 immediately.** NEVER call `command_status` more than 3 times total.
- Step 4 (read): use `read_file` on the temp JSON file. NEVER parse terminal output.

// turbo
1. Health check — verify service is running:
```powershell
try { $h = Invoke-WebRequest -Uri "http://127.0.0.1:13956/health" -UseBasicParsing -TimeoutSec 3; Write-Host "HEALTH_OK" } catch { Write-Host "HEALTH_FAIL: Service not running on port 13956" }
```

// turbo
2. Send feedback — run as **non-blocking** (`Blocking=false`, `WaitMsBeforeAsync=2000`). Replace YOUR_SUMMARY with your actual summary:
```powershell
try { $body = @{tool='infinite_dialog_feedback';arguments=@{summary='YOUR_SUMMARY'}} | ConvertTo-Json -Depth 3 -Compress; $bytes = [System.Text.Encoding]::UTF8.GetBytes($body); (Invoke-WebRequest -Uri "http://127.0.0.1:13956/mcp/call" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes -UseBasicParsing).Content | Out-File "$env:TEMP\ai-dialog-resp.json" -Encoding utf8; Write-Host "FEEDBACK_OK" } catch { Write-Host "FEEDBACK_FAIL: $($_.Exception.Message)" }
```

**NOTE**: The summary uses single quotes. If your summary contains a single quote (`'`), escape it by doubling: `''`.

3. Poll for completion — call `command_status` with `WaitDurationSeconds=60`, `OutputCharacterCount=500`:
   - If status is **DONE** → go to Step 4 **immediately**. Do NOT call `command_status` again.
   - If status is **RUNNING** → retry (max 2 more times, then go to Step 4 anyway).
   - **HARD CAP: NEVER call `command_status` more than 3 times total.**

4. Read and parse the response — use `read_file` on `C:\Users\liu\AppData\Local\Temp\ai-dialog-resp.json`:
   - ALWAYS parse from the file, NEVER from terminal output (terminal output is garbled).
   - Read the `next_step` field — it contains the user's actual message. You MUST address what the user said.
   - If `action` is `"continue"`: respond to the user's message and continue working. If `full_message_path` exists, use `read_file` to see the full message.
   - If `action` is `"end"`: stop all work immediately and summarize.
