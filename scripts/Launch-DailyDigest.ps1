# Opens this workspace in Cursor at the scheduled time (9am local = Chicago if PC clock is Central).
$workspace = Split-Path $PSScriptRoot -Parent
$cursorExe = Join-Path $env:LOCALAPPDATA "Programs\cursor\Cursor.exe"
$args = @(
    "`"$workspace`"",
    "--new-window"
)
if (Test-Path $cursorExe) {
    Start-Process -FilePath $cursorExe -ArgumentList $args
} else {
    $cmd = Join-Path $env:LOCALAPPDATA "Programs\cursor\resources\app\bin\cursor.cmd"
    if (Test-Path $cmd) {
        Start-Process -FilePath $cmd -ArgumentList $args -WorkingDirectory (Split-Path $cmd)
    }
}
