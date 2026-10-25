# يدمج style.css و game.js داخل index.html (ملف واحد للتشغيل)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

$html = Get-Content "index.html" -Raw -Encoding UTF8
$css = Get-Content "style.css" -Raw -Encoding UTF8
$js = Get-Content "game.js" -Raw -Encoding UTF8

$beforeStyle = ($html -split '(?s)<style>')[0]
$mid = ($html -split '(?s)</style>')[1]
$beforeScript = ($mid -split '(?s)<script>')[0]
$afterScript = ($mid -split '(?s)</script>\s*</body>')[1]

if (-not $afterScript) {
  Write-Error "تعذّر تحليل index.html"
  exit 1
}

$out = $beforeStyle + "<style>`r`n" + $css + "`r`n</style>" + $beforeScript + "<script>`r`n" + $js + "`r`n</script>`r`n</body>" + $afterScript
[System.IO.File]::WriteAllText("$dir\index.html", $out, [System.Text.UTF8Encoding]::new($false))
Write-Host "تم دمج index.html بنجاح."
