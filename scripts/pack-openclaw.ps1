# Pack openclaw for deployment with modified pi-mono packages.
#
# Problem: npm pack + npm install -g downloads original pi-mono from npm registry,
# losing our local modifications (repairRoleOrdering, jsonrepair, detectCompat, etc.).
#
# Solution: Two-file deployment:
#   1. openclaw-VERSION.tgz       - standard npm pack (pi-mono deps = registry versions)
#   2. pi-mono-patch.tar.gz       - overlay archive with our modified pi-mono dist/ files
#
# Installation on target:
#   sudo npm install -g /tmp/openclaw-VERSION.tgz --ignore-scripts
#   sudo tar -xzf /tmp/pi-mono-patch.tar.gz -C /usr/lib/node_modules/openclaw/node_modules/
#   hash -r && openclaw --version

param(
    [switch]$SkipBuild  # Skip pi-mono + openclaw build (use if already built)
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$piMonoPackages = @(
    @{ Name = "@mariozechner/pi-agent-core"; NmPath = "@mariozechner/pi-agent-core"; Dir = "pi-mono/packages/agent" },
    @{ Name = "@mariozechner/pi-ai"; NmPath = "@mariozechner/pi-ai"; Dir = "pi-mono/packages/ai" },
    @{ Name = "@mariozechner/pi-coding-agent"; NmPath = "@mariozechner/pi-coding-agent"; Dir = "pi-mono/packages/coding-agent" },
    @{ Name = "@mariozechner/pi-tui"; NmPath = "@mariozechner/pi-tui"; Dir = "pi-mono/packages/tui" }
)

Push-Location $root
try {
    $piVersion = (Get-Content (Join-Path $root "pi-mono/packages/ai/package.json") | ConvertFrom-Json).version
    Write-Host "pi-mono version: $piVersion" -ForegroundColor Cyan

    # --- Step 1: Standard npm pack for openclaw ---
    Write-Host "`n[1/3] Packing openclaw (standard npm pack)..." -ForegroundColor Cyan
    Copy-Item "package.json" "package.json.bak" -Force

    # Change file: references to registry version numbers
    $pkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    foreach ($pkg in $piMonoPackages) {
        $depName = $pkg.Name
        if ($pkgJson.dependencies.PSObject.Properties[$depName]) {
            $pkgJson.dependencies.$depName = $piVersion
        }
    }
    $pkgJson | ConvertTo-Json -Depth 20 | Set-Content "package.json" -Encoding UTF8

    Remove-Item "openclaw-*.tgz" -ErrorAction SilentlyContinue
    cmd /c "npm pack --ignore-scripts 2>&1" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm pack failed" }

    # Restore package.json
    Move-Item "package.json.bak" "package.json" -Force

    $tgzFile = Get-Item "openclaw-*.tgz"
    Write-Host "  Created: $($tgzFile.Name) ($([math]::Round($tgzFile.Length / 1MB, 1)) MB)" -ForegroundColor Green

    # --- Step 2: Create pi-mono patch overlay ---
    Write-Host "`n[2/3] Creating pi-mono-patch.tar.gz overlay..." -ForegroundColor Cyan
    $patchDir = Join-Path $root "_pi-mono-patch"
    if (Test-Path $patchDir) { Remove-Item $patchDir -Recurse -Force }

    foreach ($pkg in $piMonoPackages) {
        $srcDir = Join-Path $root $pkg.Dir
        # Create the same directory structure as node_modules/@mariozechner/pkg-name/
        $nmRelPath = $pkg.NmPath -replace "/", [IO.Path]::DirectorySeparatorChar
        $destDir = Join-Path $patchDir $nmRelPath

        New-Item -ItemType Directory -Path $destDir -Force | Out-Null

        # Copy dist/ (the compiled output with our modifications)
        $distSrc = Join-Path $srcDir "dist"
        if (Test-Path $distSrc) {
            Copy-Item $distSrc (Join-Path $destDir "dist") -Recurse -Force
        }

        # Copy src/ if present (some packages export from src)
        $srcSrcDir = Join-Path $srcDir "src"
        if (Test-Path $srcSrcDir) {
            Copy-Item $srcSrcDir (Join-Path $destDir "src") -Recurse -Force
        }

        Write-Host "  Staged $($pkg.Name)" -ForegroundColor Green
    }

    # Create the tar.gz using tar
    $patchTgz = Join-Path $root "pi-mono-patch.tar.gz"
    Remove-Item $patchTgz -ErrorAction SilentlyContinue
    Push-Location $patchDir
    try {
        tar -czf "$patchTgz" "./@mariozechner"
        if ($LASTEXITCODE -ne 0) { throw "tar failed for pi-mono-patch" }
    }
    finally {
        Pop-Location
    }

    $patchFile = Get-Item $patchTgz
    Write-Host "  Created: $($patchFile.Name) ($([math]::Round($patchFile.Length / 1MB, 1)) MB)" -ForegroundColor Green

    # --- Step 3: Clean up ---
    Write-Host "`n[3/3] Cleaning up..." -ForegroundColor Cyan
    Remove-Item $patchDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Done" -ForegroundColor Green

    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "Pack complete!" -ForegroundColor Green
    Write-Host "  1. $($tgzFile.Name) ($([math]::Round($tgzFile.Length / 1MB, 1)) MB)" -ForegroundColor Green
    Write-Host "  2. $($patchFile.Name) ($([math]::Round($patchFile.Length / 1MB, 1)) MB)" -ForegroundColor Green
    Write-Host "`nInstall on target:" -ForegroundColor Yellow
    Write-Host "  sudo npm install -g /tmp/$($tgzFile.Name) --ignore-scripts" -ForegroundColor Yellow
    Write-Host "  sudo tar -xzf /tmp/$($patchFile.Name) -C /usr/lib/node_modules/openclaw/node_modules/" -ForegroundColor Yellow
    Write-Host "  hash -r && openclaw --version" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan

}
catch {
    if (Test-Path "package.json.bak") {
        Move-Item "package.json.bak" "package.json" -Force
    }
    $patchDir = Join-Path $root "_pi-mono-patch"
    Remove-Item $patchDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Error: $_" -ForegroundColor Red
    throw
}
finally {
    Pop-Location
}
