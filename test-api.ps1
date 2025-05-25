# Test Battle API endpoints

Write-Host "Testing Battle API Endpoints..."

# Test 1: Battle Simulation
Write-Host "`n=== Testing Battle Simulation ==="
$simulateBody = @{
    attackerArmy = @{
        soldier = 10
        worker = 5
    }
    defenderArmy = @{
        soldier = 8
        guard = 3
    }
    battleConditions = @{
        terrain = "forest"
        attackerFormation = "aggressive"
        defenderFormation = "defensive"
    }
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/battles/simulate" -Method POST -Body $simulateBody -ContentType "application/json"
    Write-Host "✅ Battle simulation successful!"
    Write-Host "Outcome: $($response.battle.result.outcome)"
    Write-Host "Victor: $($response.battle.result.victor)"
} catch {
    Write-Host "❌ Battle simulation failed: $($_.Exception.Message)"
}

# Test 2: Get Battle Targets
Write-Host "`n=== Testing Battle Targets ==="
try {
    $targets = Invoke-RestMethod -Uri "http://localhost:3001/api/battles/targets/player_colony_1" -Method GET
    Write-Host "✅ Targets retrieved successfully!"
    Write-Host "Available targets: $($targets.targets.Count)"
    if ($targets.targets.Count -gt 0) {
        Write-Host "First target: $($targets.targets[0].name) (Difficulty: $($targets.targets[0].difficulty))"
    }
} catch {
    Write-Host "❌ Get targets failed: $($_.Exception.Message)"
}

# Test 3: Battle Stats
Write-Host "`n=== Testing Battle Stats ==="
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3001/api/battles/stats/player_colony_1" -Method GET
    Write-Host "✅ Battle stats retrieved successfully!"
    Write-Host "Total battles: $($stats.stats.totalBattles)"
    Write-Host "Win rate: $($stats.stats.winRate * 100)%"
} catch {
    Write-Host "❌ Get stats failed: $($_.Exception.Message)"
}

# Test 4: Battle History
Write-Host "`n=== Testing Battle History ==="
try {
    $history = Invoke-RestMethod -Uri "http://localhost:3001/api/battles/history/player_colony_1" -Method GET
    Write-Host "✅ Battle history retrieved successfully!"
    Write-Host "History entries: $($history.history.Count)"
} catch {
    Write-Host "❌ Get history failed: $($_.Exception.Message)"
}

Write-Host "`n🎉 API Testing Complete!" 