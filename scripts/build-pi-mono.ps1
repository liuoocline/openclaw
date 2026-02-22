# Build pi-mono packages required by openclaw (Windows-compatible)
# Only builds: tui, ai, agent, coding-agent
# Skips: mom, web-ui, pods (not needed by openclaw, use Linux-only commands)

param(
    [switch]$SkipGenerateModels
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$piMono = Join-Path $root "pi-mono"

$packages = @(
    @{ Name = "tui";           Dir = "packages/tui";           Build = "tsgo -p tsconfig.build.json" },
    @{ Name = "ai";            Dir = "packages/ai";            Build = if ($SkipGenerateModels) { "tsgo -p tsconfig.build.json" } else { "npm run build" } },
    @{ Name = "agent";         Dir = "packages/agent";         Build = "tsgo -p tsconfig.build.json" },
    @{ Name = "coding-agent";  Dir = "packages/coding-agent";  Build = "tsgo -p tsconfig.build.json" }
)

Write-Host "Building pi-mono packages for openclaw..." -ForegroundColor Cyan

foreach ($pkg in $packages) {
    $pkgDir = Join-Path $piMono $pkg.Dir
    Write-Host "`n[$($pkg.Name)] Building..." -ForegroundColor Yellow

    Push-Location $pkgDir
    try {
        $cmd = $pkg.Build
        if ($cmd -eq "npm run build") {
            npm run build
        } else {
            npx $cmd.Split(" ")
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[$($pkg.Name)] Build FAILED" -ForegroundColor Red
            exit 1
        }
        Write-Host "[$($pkg.Name)] OK" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host "`nAll openclaw-required pi-mono packages built successfully." -ForegroundColor Green
