Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$pdfDir = Join-Path $root 'pdf_images'
$outDir = Join-Path $root 'assets\images\products'

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$seedJson = node --input-type=module -e "import('./products-data.js').then(m=>process.stdout.write(JSON.stringify(m.seedProducts)))"
$seedProducts = $seedJson | ConvertFrom-Json

$sectionVisuals = @{
  hot = @(
    @{ page = 38; layout = 'grid9'; count = 9 },
    @{ page = 39; layout = 'layout5'; count = 5 },
    @{ page = 40; layout = 'grid9'; count = 8 }
  )
  cold = @(
    @{ page = 46; layout = 'layout8'; count = 8 },
    @{ page = 41; layout = 'layout2'; count = 2 }
  )
  specialty = @(@{ page = 42; layout = 'grid9'; count = 9 })
  frappe = @(@{ page = 47; layout = 'layout5'; count = 5 })
  milkshake = @(
    @{ page = 37; layout = 'grid9'; count = 9 },
    @{ page = 43; layout = 'layout2'; count = 2 }
  )
  matcha = @(@{ page = 52; layout = 'layout4'; count = 4 })
  smoothie = @(@{ page = 49; layout = 'grid9'; count = 9 })
  mohito = @(@{ page = 51; layout = 'layout8'; count = 8 })
  juice = @(@{ page = 48; layout = 'layout5'; count = 5 })
  'iced-tea' = @(@{ page = 53; layout = 'layout7'; count = 7 })
  tea = @(@{ page = 45; layout = 'layout3'; count = 3 })
  special = @(@{ page = 50; layout = 'layout2'; count = 2 })
  sweets = @(@{ page = 44; layout = 'grid9'; count = 9 })
}

$layoutBoxes = @{
  grid9 = @(
    @(40, 380, 325, 780), @(410, 380, 695, 780), @(780, 380, 1065, 780),
    @(40, 1120, 325, 1520), @(410, 1120, 695, 1520), @(780, 1120, 1065, 1520),
    @(40, 1860, 325, 2260), @(410, 1860, 695, 2260), @(780, 1860, 1065, 2260)
  )
  layout8 = @(
    @(40, 420, 325, 900), @(410, 420, 695, 900), @(780, 420, 1065, 900),
    @(40, 1180, 325, 1660), @(410, 1180, 695, 1660), @(780, 1180, 1065, 1660),
    @(40, 1940, 325, 2360), @(410, 1940, 695, 2360)
  )
  layout7 = @(
    @(40, 420, 325, 900), @(410, 420, 695, 900), @(780, 420, 1065, 900),
    @(40, 1180, 325, 1660), @(410, 1180, 695, 1660), @(780, 1180, 1065, 1660),
    @(220, 1940, 900, 2380)
  )
  layout5 = @(
    @(50, 320, 450, 930), @(730, 320, 1120, 930),
    @(50, 1060, 450, 1670), @(730, 1060, 1120, 1670),
    @(350, 1750, 830, 2360)
  )
  layout4 = @(
    @(40, 420, 540, 1180), @(620, 420, 1120, 1180),
    @(40, 1240, 540, 2200), @(620, 1240, 1120, 2200)
  )
  layout3 = @(
    @(40, 720, 480, 1760), @(360, 610, 845, 1510), @(730, 720, 1130, 1760)
  )
  layout2 = @(
    @(50, 720, 530, 1860), @(640, 720, 1120, 1860)
  )
}

$donutSource = Get-ChildItem $pdfDir -File | Where-Object { $_.Extension -eq '.jpg' -and $_.Length -eq 74879 } | Select-Object -First 1
$croissantSource = Get-ChildItem $pdfDir -File | Where-Object { $_.Extension -eq '.jpg' -and $_.Length -eq 955468 } | Select-Object -First 1

$specialSources = @{
  'sweets-4' = $donutSource.FullName
  'sweets-3' = $croissantSource.FullName
  'sweets-5' = Join-Path $pdfDir 'images.jpg'
  'sweets-9' = Join-Path $pdfDir '55d4ff8353b93bb4ae52b9f08725ce4aacb8cc94.jpg'
}

function Get-SectionIndex {
  param(
    [Parameter(Mandatory=$true)][string]$Section,
    [Parameter(Mandatory=$true)][int]$Index
  )

  $offset = $Index
  foreach ($group in $sectionVisuals[$Section]) {
    if ($offset -lt $group.count) {
      return @{
        page = $group.page
        layout = $group.layout
        index = $offset
      }
    }
    $offset -= $group.count
  }

  $fallback = $sectionVisuals[$Section][-1]
  return @{
    page = $fallback.page
    layout = $fallback.layout
    index = 0
  }
}

function Get-SourcePath {
  param(
    [Parameter(Mandatory=$true)]$Product,
    [Parameter(Mandatory=$true)][int]$Index
  )

  if ($specialSources.ContainsKey($Product.id)) {
    return $specialSources[$Product.id]
  }

  $meta = Get-SectionIndex -Section $Product.section -Index $Index
  return Join-Path $pdfDir ("obj-{0}.jpg" -f $meta.page)
}

function Get-CropRect {
  param(
    [Parameter(Mandatory=$true)][int[]]$Box,
    [Parameter(Mandatory=$true)][int]$ImageWidth,
    [Parameter(Mandatory=$true)][int]$ImageHeight
  )

  $boxX1 = [int]$Box[0]
  $boxY1 = [int]$Box[1]
  $boxX2 = [int]$Box[2]
  $boxY2 = [int]$Box[3]
  $boxW = $boxX2 - $boxX1
  $boxH = $boxY2 - $boxY1
  $cropW = [int][Math]::Round([Math]::Min($ImageWidth, $boxW * 1.55))
  $cropH = [int][Math]::Round([Math]::Min($ImageHeight, $boxH * 1.25))
  $centerX = ($boxX1 + $boxX2) / 2
  $cropX = [int][Math]::Round($centerX - ($cropW / 2))
  if ($cropX -lt 0) { $cropX = 0 }
  if ($cropX + $cropW -gt $ImageWidth) { $cropX = [Math]::Max(0, $ImageWidth - $cropW) }
  $cropY = $boxY1 + 10
  if ($cropY + $cropH -gt $ImageHeight) { $cropY = [Math]::Max(0, $ImageHeight - $cropH) }
  return [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
}

function Save-ContainedSquare {
  param(
    [Parameter(Mandatory=$true)][System.Drawing.Bitmap]$SourceBitmap,
    [Parameter(Mandatory=$true)][string]$DestinationPath
  )

  $canvas = New-Object System.Drawing.Bitmap 1200, 1200
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::FromArgb(247, 239, 232))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $fit = 1020
  $ratio = [Math]::Min($fit / $SourceBitmap.Width, $fit / $SourceBitmap.Height)
  $drawW = [int][Math]::Round($SourceBitmap.Width * $ratio)
  $drawH = [int][Math]::Round($SourceBitmap.Height * $ratio)
  $drawX = [int][Math]::Round(($canvas.Width - $drawW) / 2)
  $drawY = [int][Math]::Round(($canvas.Height - $drawH) / 2)
  $graphics.DrawImage($SourceBitmap, $drawX, $drawY, $drawW, $drawH)
  $canvas.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $graphics.Dispose()
  $canvas.Dispose()
}

function Copy-SquareSource {
  param(
    [Parameter(Mandatory=$true)][string]$SourcePath,
    [Parameter(Mandatory=$true)][string]$DestinationPath
  )

  $img = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $bitmap = New-Object System.Drawing.Bitmap $img.Width, $img.Height
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
    $g.Dispose()
    Save-ContainedSquare -SourceBitmap $bitmap -DestinationPath $DestinationPath
    $bitmap.Dispose()
  } finally {
    $img.Dispose()
  }
}

function Crop-SourceImage {
  param(
    [Parameter(Mandatory=$true)][string]$SourcePath,
    [Parameter(Mandatory=$true)][int[]]$Box,
    [Parameter(Mandatory=$true)][string]$DestinationPath
  )

  $img = [System.Drawing.Image]::FromFile($SourcePath)
  try {
    $rect = Get-CropRect -Box $Box -ImageWidth $img.Width -ImageHeight $img.Height
    $crop = New-Object System.Drawing.Bitmap $rect.Width, $rect.Height
    $graphics = [System.Drawing.Graphics]::FromImage($crop)
    $graphics.DrawImage(
      $img,
      (New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)),
      $rect,
      [System.Drawing.GraphicsUnit]::Pixel
    )
    $graphics.Dispose()
    Save-ContainedSquare -SourceBitmap $crop -DestinationPath $DestinationPath
    $crop.Dispose()
  } finally {
    $img.Dispose()
  }
}

$sectionCounts = @{}
foreach ($product in $seedProducts) {
  if (-not $sectionCounts.ContainsKey($product.section)) {
    $sectionCounts[$product.section] = 0
  }
  $index = [int]$sectionCounts[$product.section]
  $sectionCounts[$product.section] = $index + 1

  $sourcePath = Get-SourcePath -Product $product -Index $index
  $destinationPath = Join-Path $outDir ($product.id + '.jpg')

  if ($specialSources.ContainsKey($product.id)) {
    Copy-SquareSource -SourcePath $sourcePath -DestinationPath $destinationPath
    continue
  }

  $meta = Get-SectionIndex -Section $product.section -Index $index
  $boxes = $layoutBoxes[$meta.layout]
  $box = [int[]]$boxes[[Math]::Min($meta.index, $boxes.Count - 1)]
  Crop-SourceImage -SourcePath $sourcePath -Box $box -DestinationPath $destinationPath
}

Write-Host "Refreshed product images in $outDir"
