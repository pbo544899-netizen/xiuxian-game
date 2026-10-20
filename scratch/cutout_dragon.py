import cv2
import numpy as np

def refine_cutout():
    img = cv2.imread('assets/dragon/dragon_head.png')
    h, w = img.shape[:2]
    
    # Load previously generated alpha or build precise mask
    # Color properties of background:
    # It is dark navy/teal with nebula:
    # Brightness (max(R,G,B)) is low, and saturation is mostly blue/cyan.
    # Meanwhile, the dragon horns/scales are green bronze or gold/cyan runes.
    
    # Let's inspect HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    H, S, V = cv2.split(hsv)
    
    # Dragon features have either high V (bright runes, pearls, teeth, jade)
    # OR distinctive bronze green (H between 35 and 90, S > 30)
    # Background has very low V (< 60) except tiny stars.
    
    # 1. Foreground mask based on Grabcut + color threshold
    rect = (60, 10, w - 120, h - 20)
    mask = np.zeros((h, w), dtype=np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 8, cv2.GC_INIT_WITH_RECT)
    fg_mask = np.where((mask == 1) | (mask == 3), 255, 0).astype('uint8')
    
    # Clean up the dark patch between left horn and ear (x: 100 to 220, y: 100 to 300)
    # If V < 55 or (img[:,:,2] < 35 and img[:,:,1] < 45 and img[:,:,0] < 60), it's background!
    is_dark_bg = (img[:, :, 2] < 35) & (img[:, :, 1] < 48) & (img[:, :, 0] < 65)
    fg_mask[is_dark_bg] = 0
    
    # Also clean corners & isolated floating debris
    # Outer margins:
    fg_mask[:10, :] = 0
    fg_mask[:, :40] = 0
    fg_mask[:, w-40:] = 0
    # Bottom corners clouds
    fg_mask[380:, :140] = 0
    fg_mask[380:, w-140:] = 0
    
    # Only keep the main connected component in the center
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg_mask)
    # Find largest component (which is the dragon head)
    # (Exclude label 0 which is background)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        main_mask = np.where(labels == largest_label, 255, 0).astype('uint8')
    else:
        main_mask = fg_mask
        
    # Morphological close to bridge small gaps within dragon body
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    main_mask = cv2.morphologyEx(main_mask, cv2.MORPH_CLOSE, kernel)
    
    # Soft feather border (anti-aliasing)
    alpha = cv2.GaussianBlur(main_mask, (5, 5), 0)
    
    # Add back glowing mouth pearls lightning which might be thin
    # Lightning has very high brightness (V > 200 or R > 150)
    lightning = (V > 180) & (main_mask > 0)
    alpha[lightning] = 255
    
    b, g, r = cv2.split(img)
    rgba = cv2.merge([b, g, r, alpha])
    
    cv2.imwrite('assets/dragon/dragon_head_alpha.png', rgba)
    print("Refined dragon_head_alpha.png saved successfully!")

if __name__ == '__main__':
    refine_cutout()
