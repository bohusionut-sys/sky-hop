# Sky Hop — create Play upload keystore on Windows (requires JDK keytool).
# Run from repo root in PowerShell:
#   .\scripts\create-release-keystore.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AppDir = Join-Path $Root "android\app"
$OutKeystore = Join-Path $AppDir "skyhop-release.keystore"
$PropsPath = Join-Path $Root "android\keystore.properties"
$Alias = "skyhop"

$Keytool = $null
foreach ($c in @(
  "keytool",
  "$env:JAVA_HOME\bin\keytool.exe",
  "${env:ProgramFiles}\Android\Android Studio\jbr\bin\keytool.exe",
  "${env:LocalAppData}\Programs\Android\Android Studio\jbr\bin\keytool.exe"
)) {
  if ($c -eq "keytool") {
    $cmd = Get-Command keytool -ErrorAction SilentlyContinue
    if ($cmd) { $Keytool = $cmd.Source; break }
  } elseif (Test-Path $c) { $Keytool = $c; break }
}
if (-not $Keytool) {
  Write-Error "keytool not found. Install JDK 21 or Android Studio, then re-run."
}

if (Test-Path $OutKeystore) {
  Write-Error "Keystore already exists: $OutKeystore — refusing to overwrite."
}

Write-Host "Using keytool: $Keytool"
Write-Host "Will write: $OutKeystore"
$SecureStore = Read-Host -AsSecureString "Keystore password (min 6 chars)"
$SecureKey = Read-Host -AsSecureString "Key password (Enter to reuse store password)"
$BSTR1 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureStore)
$StorePass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR1)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR1)
$BSTR2 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureKey)
$KeyPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2)
if ([string]::IsNullOrWhiteSpace($KeyPass)) { $KeyPass = $StorePass }
if ($StorePass.Length -lt 6) { Write-Error "Password too short" }

& $Keytool -genkeypair -v `
  -keystore $OutKeystore `
  -alias $Alias `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass $StorePass -keypass $KeyPass `
  -dname "CN=Sky Hop, OU=Mobile, O=bohusionut-sys, L=London, ST=England, C=GB"

@"
storeFile=skyhop-release.keystore
storePassword=$StorePass
keyAlias=$Alias
keyPassword=$KeyPass
"@ | Set-Content -Path $PropsPath -Encoding ASCII

Write-Host ""
Write-Host "Created:"
Write-Host "  $OutKeystore"
Write-Host "  $PropsPath  (gitignored)"
Write-Host "BACK UP the keystore + passwords offline. Never commit them."
Write-Host "Next: .\scripts\assemble-release-aab.ps1"
