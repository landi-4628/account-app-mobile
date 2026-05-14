Add-Type -AssemblyName System.Drawing

$AssetDir = Join-Path $PSScriptRoot "..\assets\images"

function New-Color($hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Set-Quality($graphics) {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
}

function Draw-Symbol($graphics, [float]$size, [bool]$withShadow, [bool]$monochrome) {
  $paperColor = if ($monochrome) { New-Color "#111111" } else { New-Color "#FFFFFF" }
  $lineColor = if ($monochrome) { New-Color "#111111" } else { New-Color "#2F8F83" }
  $shadowColor = if ($monochrome) { New-Color "#111111" } else { New-Color "#B7DDD4" }
  $accentColor = if ($monochrome) { New-Color "#111111" } else { New-Color "#FF9E7A" }

  $pageX = $size * 0.28
  $pageY = $size * 0.18
  $pageW = $size * 0.44
  $pageH = $size * 0.58
  $corner = $size * 0.075
  $fold = $size * 0.12

  if ($withShadow) {
    $shadowPath = New-RoundedRectPath ($pageX + $size * 0.018) ($pageY + $size * 0.024) $pageW $pageH $corner
    $shadowBrush = New-Object System.Drawing.SolidBrush($shadowColor)
    $graphics.FillPath($shadowBrush, $shadowPath)
    $shadowBrush.Dispose()
    $shadowPath.Dispose()
  }

  $pagePath = New-RoundedRectPath $pageX $pageY $pageW $pageH $corner
  $pageBrush = New-Object System.Drawing.SolidBrush($paperColor)
  $graphics.FillPath($pageBrush, $pagePath)
  $pageBrush.Dispose()
  $pagePath.Dispose()

  $foldPoints = New-Object 'System.Drawing.PointF[]' 3
  $foldPoints[0] = New-Object System.Drawing.PointF(($pageX + $pageW - $fold), $pageY)
  $foldPoints[1] = New-Object System.Drawing.PointF(($pageX + $pageW), $pageY)
  $foldPoints[2] = New-Object System.Drawing.PointF(($pageX + $pageW), ($pageY + $fold))
  $foldBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $graphics.FillPolygon($foldBrush, [System.Drawing.PointF[]]$foldPoints)
  $foldBrush.Dispose()

  $foldLinePen = New-Object System.Drawing.Pen($lineColor, ($size * 0.012))
  $foldLinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $foldLinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine(
    $foldLinePen,
    ($pageX + $pageW - $fold),
    $pageY,
    ($pageX + $pageW),
    ($pageY + $fold)
  )

  $strokePen = New-Object System.Drawing.Pen($lineColor, ($size * 0.04))
  $strokePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $strokePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $strokePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $curvePoints = New-Object 'System.Drawing.PointF[]' 4
  $curvePoints[0] = New-Object System.Drawing.PointF(($size * 0.37), ($size * 0.52))
  $curvePoints[1] = New-Object System.Drawing.PointF(($size * 0.44), ($size * 0.58))
  $curvePoints[2] = New-Object System.Drawing.PointF(($size * 0.52), ($size * 0.49))
  $curvePoints[3] = New-Object System.Drawing.PointF(($size * 0.60), ($size * 0.54))
  $graphics.DrawCurve($strokePen, [System.Drawing.PointF[]]$curvePoints)
  $graphics.DrawLine($strokePen, ($size * 0.39), ($size * 0.67), ($size * 0.58), ($size * 0.67))

  $dotBrush = New-Object System.Drawing.SolidBrush($accentColor)
  $dotSize = $size * 0.034
  $graphics.FillEllipse($dotBrush, ($size * 0.36), ($size * 0.36), $dotSize, $dotSize)

  $dotBrush.Dispose()
  $strokePen.Dispose()
  $foldLinePen.Dispose()
}

function Save-Png([string]$path, [int]$size, [scriptblock]$draw, [System.Drawing.Color]$background) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-Quality $graphics
  $graphics.Clear($background)
  & $draw $graphics $size
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-FullIcon([string]$path, [int]$size) {
  Save-Png $path $size {
    param($g, $s)
    $mint = New-Color "#DDF4EE"
    $bgPath = New-RoundedRectPath ($s * 0.08) ($s * 0.08) ($s * 0.84) ($s * 0.84) ($s * 0.2)
    $bgBrush = New-Object System.Drawing.SolidBrush($mint)
    $g.FillPath($bgBrush, $bgPath)
    $bgBrush.Dispose()
    $bgPath.Dispose()
    Draw-Symbol $g $s $true $false
  } ([System.Drawing.Color]::Transparent)
}

function Save-SplashSymbol([string]$path, [int]$size) {
  Save-Png $path $size {
    param($g, $s)
    Draw-Symbol $g $s $false $false
  } ([System.Drawing.Color]::Transparent)
}

function Save-AndroidBackground([string]$path, [int]$size) {
  Save-Png $path $size {
    param($g, $s)
  } (New-Color "#DDF4EE")
}

function Save-AndroidForeground([string]$path, [int]$size) {
  Save-Png $path $size {
    param($g, $s)
    Draw-Symbol $g ($s * 1.08) $true $false
  } ([System.Drawing.Color]::Transparent)
}

function Save-Monochrome([string]$path, [int]$size) {
  Save-Png $path $size {
    param($g, $s)
    Draw-Symbol $g ($s * 1.05) $false $true
  } ([System.Drawing.Color]::Transparent)
}

New-Item -ItemType Directory -Force -Path $AssetDir | Out-Null

Save-FullIcon (Join-Path $AssetDir "icon.png") 1024
Save-FullIcon (Join-Path $AssetDir "favicon.png") 256
Save-SplashSymbol (Join-Path $AssetDir "splash-icon.png") 1024
Save-AndroidBackground (Join-Path $AssetDir "android-icon-background.png") 1024
Save-AndroidForeground (Join-Path $AssetDir "android-icon-foreground.png") 1024
Save-Monochrome (Join-Path $AssetDir "android-icon-monochrome.png") 1024

Write-Output "Generated branding assets in $AssetDir"
