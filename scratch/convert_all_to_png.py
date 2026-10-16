# convert_all_to_png.py - 批量将所有装备与符号资产转为统一的高清 PNG
import os
import glob
from PIL import Image
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QImage, QPainter, QColor
from PyQt6.QtSvg import QSvgRenderer
from PyQt6.QtCore import QSize

# 确保 QApplication 存在用于渲染
app = QApplication([])

def convert_jpg_to_png(jpg_path, png_path=None):
    if not png_path:
        png_path = os.path.splitext(jpg_path)[0] + '.png'
    with Image.open(jpg_path) as im:
        im.save(png_path, 'PNG', optimize=True)
    print(f"Converted JPG -> PNG: {png_path}")
    return png_path

def convert_svg_to_png(svg_path, png_path=None, size=1024):
    if not png_path:
        png_path = os.path.splitext(svg_path)[0] + '.png'
    renderer = QSvgRenderer(svg_path)
    image = QImage(size, size, QImage.Format.Format_ARGB32)
    image.fill(QColor(0, 0, 0, 0)) # 透明底
    painter = QPainter(image)
    renderer.render(painter)
    painter.end()
    image.save(png_path, "PNG")
    print(f"Rendered SVG -> PNG (1024x1024): {png_path}")
    return png_path

equipment_dir = r"E:\my games\slots_rpg\assets\equipment"

# 1. 转换 assets/equipment 下的全部 JPG 和 SVG
print("=== 转换 assets/equipment ===")
for jpg_file in glob.glob(os.path.join(equipment_dir, "*.jpg")):
    convert_jpg_to_png(jpg_file)

for svg_file in glob.glob(os.path.join(equipment_dir, "*.svg")):
    convert_svg_to_png(svg_file)

# 2. 转换 assets/ascension 下的 shard_*.svg
ascension_dir = r"E:\my games\slots_rpg\assets\ascension"
print("\n=== 转换 assets/ascension ===")
for svg_file in glob.glob(os.path.join(ascension_dir, "*.svg")):
    convert_svg_to_png(svg_file, size=512)

# 3. 转换 assets/boss 下的 boss_*.svg
boss_dir = r"E:\my games\slots_rpg\assets\boss"
print("\n=== 转换 assets/boss ===")
for svg_file in glob.glob(os.path.join(boss_dir, "*.svg")):
    convert_svg_to_png(svg_file, size=512)

# 4. 转换 assets/monsters 下的 monster_*.svg
monsters_dir = r"E:\my games\slots_rpg\assets\monsters"
print("\n=== 转换 assets/monsters ===")
for svg_file in glob.glob(os.path.join(monsters_dir, "*.svg")):
    convert_svg_to_png(svg_file, size=512)

# 5. 转换 assets/character 下的 hero_cultivator.svg
char_dir = r"E:\my games\slots_rpg\assets\character"
print("\n=== 转换 assets/character ===")
for svg_file in glob.glob(os.path.join(char_dir, "*.svg")):
    convert_svg_to_png(svg_file, size=512)

# 6. 转换 assets/ui 下的 tab_*.svg
ui_dir = r"E:\my games\slots_rpg\assets\ui"
print("\n=== 转换 assets/ui ===")
for svg_file in glob.glob(os.path.join(ui_dir, "*.svg")):
    convert_svg_to_png(svg_file, size=256)

print("\n🎉 全部资源格式转换完成！")
