Add-Type -AssemblyName System.Drawing

# 1. 聚宝天机
function Draw-SlotsIcon($path) {
    $bmp = [System.Drawing.Bitmap]::new(128, 128)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $penGold = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0), 4)
    $g.DrawEllipse($penGold, 10, 10, 108, 108)

    $brushGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0))
    $g.FillEllipse($brushGold, 60, 4, 8, 8)
    $g.FillEllipse($brushGold, 60, 116, 8, 8)
    $g.FillEllipse($brushGold, 4, 60, 8, 8)
    $g.FillEllipse($brushGold, 116, 60, 8, 8)

    $brushDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 14, 20, 32))
    $g.FillEllipse($brushDark, 18, 18, 92, 92)

    $g.FillPie($brushGold, 18, 18, 92, 92, -90, 180)
    $g.FillEllipse($brushGold, 41, 18, 46, 46)
    $g.FillEllipse($brushDark, 41, 64, 46, 46)

    $g.FillEllipse($brushDark, 59, 36, 10, 10)
    $g.FillEllipse($brushGold, 59, 82, 10, 10)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# 2. 角色修真 (仙家乾坤储物囊)
function Draw-CharacterIcon($path) {
    $bmp = [System.Drawing.Bitmap]::new(128, 128)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $brushSilk = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 120, 40, 190))
    $penGold = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0), 3.5)

    # 荷叶形袋口
    $g.FillEllipse($brushSilk, 44, 20, 40, 22)
    $g.DrawEllipse($penGold, 44, 20, 40, 22)

    # 饱满囊身
    $g.FillEllipse($brushSilk, 24, 38, 80, 76)
    $g.DrawEllipse($penGold, 24, 38, 80, 76)

    # 金绳系带
    $penCord = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 230, 120), 4)
    $g.DrawArc($penCord, 44, 34, 40, 16, 0, 180)

    # 飘逸金绳与流苏
    $brushGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0))
    $g.DrawLine($penGold, 50, 42, 36, 68)
    $g.DrawLine($penGold, 78, 42, 92, 68)
    $g.FillEllipse($brushGold, 32, 66, 8, 8)
    $g.FillEllipse($brushGold, 88, 66, 8, 8)

    # 中央温润青玉璧挂饰
    $brushJade = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $g.FillEllipse($brushJade, 52, 66, 24, 24)
    $g.DrawEllipse($penGold, 52, 66, 24, 24)
    $brushInner = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 46, 16, 101))
    $g.FillEllipse($brushInner, 60, 74, 8, 8)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# 3. 洞天灵脉 (浮空仙山与灵泉祥云)
function Draw-CaveIcon($path) {
    $bmp = [System.Drawing.Bitmap]::new(128, 128)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # 远山背影
    $brushBackPeak = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 3, 105, 161))
    $ptsBack = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(36, 72),
        [System.Drawing.Point]::new(56, 36),
        [System.Drawing.Point]::new(72, 72)
    )
    $g.FillPolygon($brushBackPeak, $ptsBack)

    $ptsBack2 = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(64, 72),
        [System.Drawing.Point]::new(84, 32),
        [System.Drawing.Point]::new(104, 76)
    )
    $g.FillPolygon($brushBackPeak, $ptsBack2)

    # 主仙峰
    $brushMainPeak = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 2, 132, 199))
    $penCyan = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248), 2.5)
    $ptsMain = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(64, 20),
        [System.Drawing.Point]::new(92, 76),
        [System.Drawing.Point]::new(76, 96),
        [System.Drawing.Point]::new(52, 96),
        [System.Drawing.Point]::new(36, 76)
    )
    $g.FillPolygon($brushMainPeak, $ptsMain)
    $g.DrawPolygon($penCyan, $ptsMain)

    # 洞天灵门 (金光仙洞)
    $brushGoldCave = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0))
    $g.FillEllipse($brushGoldCave, 58, 66, 12, 18)
    $brushWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillEllipse($brushWhite, 61, 70, 6, 10)

    # 祥云环绕仙山底座
    $brushCloud = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 224, 242, 254))
    $g.FillEllipse($brushCloud, 20, 88, 36, 20)
    $g.FillEllipse($brushCloud, 44, 82, 40, 24)
    $g.FillEllipse($brushCloud, 72, 88, 36, 20)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Draw-SlotsIcon "E:\my games\slots_rpg\assets\ui\tab_slots.png"
Draw-CharacterIcon "E:\my games\slots_rpg\assets\ui\tab_character.png"
Draw-CaveIcon "E:\my games\slots_rpg\assets\ui\tab_cave.png"
Write-Host "All 3 PNG icons successfully rendered!"
