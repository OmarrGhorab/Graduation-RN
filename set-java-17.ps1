# Script to set JAVA_HOME to OpenJDK 17 for this project
# Run this script before building: .\set-java-17.ps1

$java17Path = "C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot"

if (Test-Path $java17Path) {
    $env:JAVA_HOME = $java17Path
    Write-Host "[OK] JAVA_HOME set to OpenJDK 17: $env:JAVA_HOME" -ForegroundColor Green
    Write-Host "Java version:" -ForegroundColor Cyan
    java -version
} else {
    Write-Host "[ERROR] OpenJDK 17 not found at: $java17Path" -ForegroundColor Red
    Write-Host "Please install OpenJDK 17 or update the path in this script." -ForegroundColor Yellow
    exit 1
}

