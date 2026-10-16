#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修仙大妖与角色立绘自动透明通道扣图脚本 (Alpha Matting & Background Removal Tool)
功能：针对 AI 生成的高对比度纯色背景（如纯黑/纯白背景），通过角点泛洪填充 (Corner Floodfill) 
与边缘抗锯齿羽化 (Edge Feathering) 自动提取抗锯齿透明通道 (RGBA)，保留角色内部黑色发饰、阴影。
"""

import sys
import os
import argparse
from PIL import Image, ImageFilter
import numpy as np

def remove_background(
    input_path: str,
    output_path: str = None,
    bg_mode: str = 'black',       # 'black', 'white', or 'corner'
    threshold: int = 25,          # 容差阈值 (0-255)
    feather_radius: float = 1.2,  # 边缘羽化半径 (像素)
    keep_internals: bool = True   # 是否使用角点泛洪避免误扣角色内部暗部 (如黑发)
) -> str:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    if output_path is None:
        base, _ = os.path.splitext(input_path)
        output_path = f"{base}_transparent.png"

    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    data = np.array(img, dtype=np.uint8)
    rgb = data[:, :, :3].astype(np.float32)

    # 确定目标背景颜色
    if bg_mode == 'black':
        target_color = np.array([0.0, 0.0, 0.0], dtype=np.float32)
    elif bg_mode == 'white':
        target_color = np.array([255.0, 255.0, 255.0], dtype=np.float32)
    else: # 'corner' 采样四角平均值
        corners = [
            rgb[0, 0], rgb[0, -1],
            rgb[-1, 0], rgb[-1, -1]
        ]
        target_color = np.mean(corners, axis=0)

    # 计算欧氏距离
    diff = np.sqrt(np.sum((rgb - target_color) ** 2, axis=2))

    if keep_internals:
        try:
            import scipy.ndimage as ndi
            candidate_bg = diff < threshold
            labeled, num_features = ndi.label(candidate_bg)
            border_labels = set(labeled[0, :]) | set(labeled[-1, :]) | set(labeled[:, 0]) | set(labeled[:, -1])
            border_labels.discard(0)
            is_bg = np.isin(labeled, list(border_labels))
        except ImportError:
            # Fallback to PIL ImageDraw.floodfill on a writable image copy
            from PIL import ImageDraw
            mask_candidate = (diff < threshold).astype(np.uint8) * 255
            mask_img = Image.fromarray(mask_candidate, mode='L').copy()
            seed_points = [
                (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
                (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)
            ]
            for pt in seed_points:
                try:
                    if mask_img.getpixel(pt) == 255:
                        ImageDraw.floodfill(mask_img, pt, 128)
                except Exception:
                    pass
            filled_arr = np.array(mask_img)
            is_bg = (filled_arr == 128)
    else:
        is_bg = (diff < threshold)

    # 构建 Alpha 遮罩
    # 背景为 0，前景为 255，边界进行平滑过渡 (Anti-aliasing)
    alpha_mask = np.ones((h, w), dtype=np.float32) * 255.0
    alpha_mask[is_bg] = 0.0

    # 针对边缘进行微弱羽化抗锯齿
    if feather_radius > 0:
        alpha_pil = Image.fromarray(alpha_mask.astype(np.uint8), mode='L')
        alpha_pil = alpha_pil.filter(ImageFilter.GaussianBlur(radius=feather_radius))
        alpha_feathered = np.array(alpha_pil, dtype=np.float32)
    else:
        alpha_feathered = alpha_mask

    # 组装最终 RGBA 图像
    final_data = np.copy(data)
    final_data[:, :, 3] = np.clip(alpha_feathered, 0, 255).astype(np.uint8)

    # 消除被扣背景边缘杂色（De-fringing）
    # 保持原图色彩边缘自然过渡，避免除以 alpha 造成边缘发白过曝


    result_img = Image.fromarray(final_data, mode='RGBA')
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    result_img.save(output_path, "PNG", optimize=True)
    print(f"[OK] Saved transparent image: {output_path} ({w}x{h})")
    return output_path

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="修仙立绘背景自动透明扣除工具")
    parser.add_argument("input", help="输入图像路径")
    parser.add_argument("-o", "--output", help="输出 PNG 图像路径 (默认自动加 _transparent.png)")
    parser.add_argument("--mode", choices=['black', 'white', 'corner'], default='black', help="背景模式 (默认 black)")
    parser.add_argument("--threshold", type=int, default=28, help="容差阈值 (默认 28)")
    parser.add_argument("--feather", type=float, default=1.0, help="边缘羽化半径 (默认 1.0)")
    parser.add_argument("--no-floodfill", action="store_true", help="关闭漫水填充保护 (默认开启)")

    args = parser.parse_args()
    remove_background(
        input_path=args.input,
        output_path=args.output,
        bg_mode=args.mode,
        threshold=args.threshold,
        feather_radius=args.feather,
        keep_internals=not args.no_floodfill
    )
