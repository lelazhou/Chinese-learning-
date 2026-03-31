# Registers a daily 9:00 AM task (local PC time) to open Cursor on this workspace.
# Run once: powershell -ExecutionPolicy Bypass -File .\Register-PmAiDigestTask.ps1

$taskName = "PM-AI-Inbox-Digest-9am"
$scriptPath = Join-Path $PSScriptRoot "Launch-DailyDigest.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Error "Missing Launch-DailyDigest.ps1 next to this script."
    exit 1
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At "9:00AM"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Daily 9am: open Cursor for PM+AI inbox digest workspace. See scripts\AUTOMATION-SETUP.txt for full cloud automation."

Write-Host "Registered scheduled task: $taskName (daily 9:00 AM, this PC local time)."
Write-Host "Verify: Task Scheduler app → Task Scheduler Library → $taskName"
