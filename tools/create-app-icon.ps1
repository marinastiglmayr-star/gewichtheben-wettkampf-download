$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$assets = Join-Path $root "assets"
New-Item -ItemType Directory -Path $assets -Force | Out-Null

$pngPath = Join-Path $assets "app-icon.png"
$icoPath = Join-Path $assets "app-icon.ico"

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

$blue = [System.Drawing.Color]::FromArgb(62, 104, 180)
$darkBlue = [System.Drawing.Color]::FromArgb(44, 75, 145)
$white = [System.Drawing.Color]::White

$shield = New-Object System.Drawing.Drawing2D.GraphicsPath
$shield.StartFigure()
$shield.AddBezier(62, 24, 92, 8, 164, 8, 194, 24)
$shield.AddBezier(194, 24, 207, 83, 197, 163, 183, 205)
$shield.AddBezier(183, 205, 150, 235, 105, 235, 73, 205)
$shield.AddBezier(73, 205, 57, 159, 47, 84, 62, 24)
$shield.CloseFigure()

$g.FillPath((New-Object System.Drawing.SolidBrush $white), $shield)
$g.DrawPath((New-Object System.Drawing.Pen $blue, 9), $shield)

$fontTop = New-Object System.Drawing.Font "Arial", 18, ([System.Drawing.FontStyle]::Bold)
$fontMid = New-Object System.Drawing.Font "Arial", 16, ([System.Drawing.FontStyle]::Bold)
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("STC BAVARIA 20", $fontTop, (New-Object System.Drawing.SolidBrush $blue), (New-Object System.Drawing.RectangleF 35, 40, 186, 28), $format)
$g.DrawString("LANDSHUT e.V.", $fontMid, (New-Object System.Drawing.SolidBrush $blue), (New-Object System.Drawing.RectangleF 35, 67, 186, 24), $format)

# Stylized blue lion mark for small Windows icon sizes.
$lion = New-Object System.Drawing.Drawing2D.GraphicsPath
$lion.AddEllipse(82, 125, 76, 43)
$lion.AddEllipse(141, 111, 37, 34)
$lion.AddRectangle((New-Object System.Drawing.Rectangle 92, 160, 13, 34))
$lion.AddRectangle((New-Object System.Drawing.Rectangle 132, 160, 13, 34))
$lion.AddRectangle((New-Object System.Drawing.Rectangle 158, 137, 12, 44))
$lion.AddEllipse(167, 121, 15, 15)
$lion.AddBezier(82, 136, 57, 113, 64, 97, 87, 111)
$lion.AddBezier(166, 128, 197, 91, 211, 128, 185, 151)
$lion.AddBezier(180, 151, 204, 167, 197, 190, 178, 176)
$g.FillPath((New-Object System.Drawing.SolidBrush $darkBlue), $lion)

$crownPen = New-Object System.Drawing.Pen $darkBlue, 8
$g.DrawLine($crownPen, 158, 113, 160, 93)
$g.DrawLine($crownPen, 167, 116, 181, 100)
$g.DrawLine($crownPen, 146, 114, 134, 98)

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$fs = [System.IO.File]::Create($icoPath)
$writer = New-Object System.IO.BinaryWriter $fs
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Close()
$fs.Close()

$g.Dispose()
$bmp.Dispose()

Write-Host "Icon erstellt:"
Write-Host $icoPath
