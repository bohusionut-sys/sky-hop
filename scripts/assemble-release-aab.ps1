# Sky Hop — sync web + build signed release AAB on Windows.
# Prerequisites: Node 20+, JDK 21, Android SDK, keystore.properties present.
# Run from repo root:
#   .\scripts\assemble-release-aab.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Props = Join-Path $Root "android\keystore.properties"
if (-not (Test-Path $Props)) {
  Write-Error "Missing android\keystore.properties — run .\scripts\create-release-keystore.ps1 first."
}

if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
  $guess = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $guess) {
    $env:ANDROID_HOME = $guess
    $env:ANDROID_SDK_ROOT = $guess
    Write-Host "Using ANDROID_HOME=$guess"
  } else {
    Write-Error "ANDROID_HOME / ANDROID_SDK_ROOT not set and default SDK not found at $guess"
  }
}

# local.properties for Gradle
$LocalProps = Join-Path $Root "android\local.properties"
$SdkPath = ($env:ANDROID_HOME -replace '\\', '/')
"sdk.dir=$SdkPath" | Set-Content -Path $LocalProps -Encoding ASCII

Write-Host "== npm install =="
npm install
Write-Host "== build:web + cap sync =="
npm run cap:sync

Write-Host "== Gradle bundleRelease =="
Set-Location (Join-Path $Root "android")
if (Test-Path ".\gradlew.bat") {
  .\gradlew.bat bundleRelease --stacktrace
} else {
  Write-Error "gradlew.bat missing"
}

$Aab = Join-Path $Root "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $Aab) {
  Write-Host ""
  Write-Host "SUCCESS AAB:"
  Write-Host "  $Aab"
  Write-Host "Upload this in Play Console → Production / Testing → Create release."
} else {
  Write-Error "AAB not found at expected path: $Aab"
}
