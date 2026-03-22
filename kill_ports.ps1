$ports = @(8000, 8001)
foreach ($port in $ports) {
    $pids = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
    foreach ($p in $pids) {
        Write-Host "Killing PID $p on port $port"
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "Done"
