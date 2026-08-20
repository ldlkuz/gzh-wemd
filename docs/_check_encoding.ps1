$bytes = [System.IO.File]::ReadAllBytes("e:\11自动工作流\wd\docs\test.html")
$strict = New-Object System.Text.UTF8Encoding($false, $true)
try {
  $null = $strict.GetString($bytes)
  Write-Output "UTF-8 STRICT VALID"
} catch {
  Write-Output "NOT STRICT UTF-8: $($_.Exception.Message)"
}