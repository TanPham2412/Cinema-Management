# Load .env file and export as environment variables, then run Spring Boot
$envFile = Join-Path $PSScriptRoot "..\\.env"

if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
    Write-Host ".env loaded successfully." -ForegroundColor Green
} else {
    Write-Warning ".env file not found at $envFile - Google OAuth2 may not work."
}

mvn spring-boot:run
