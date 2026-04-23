#!/usr/bin/env python3
"""Create proper icons for Tauri using Pillow."""
from PIL import Image, ImageDraw

def create_icon(size, filename):
    """Create a simple icon with gradient."""
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)

    # Create a gradient background (blue to cyan)
    for y in range(size):
        for x in range(size):
            r = 0
            g = int((x / size) * 255)
            b = int(180 + (y / size) * 75)
            img.putpixel((x, y), (r, g, b))

    # Draw a simple "J" for JuliOS
    if size >= 32:
        # Draw letter outline
        draw.text((size//2 - 10, size//2 - 15), "J", fill=(255, 255, 255))

    img.save(filename, 'PNG')
    print(f"✅ Created {filename}")

# Create PNG icons
create_icon(32, '32x32.png')
create_icon(128, '128x128.png')
create_icon(256, '256x256.png')

# For .ico, save as ICO format
img_ico = Image.new('RGB', (32, 32))
draw = ImageDraw.Draw(img_ico)
for y in range(32):
    for x in range(32):
        r = 0
        g = int((x / 32) * 255)
        b = int(180 + (y / 32) * 75)
        img_ico.putpixel((x, y), (r, g, b))
img_ico.save('icon.ico', 'ICO')
print("✅ Created icon.ico")

# For .icns (macOS), we'll create a simple PNG and rename it
# (Not ideal but will work for development)
img_icns = Image.new('RGB', (512, 512))
draw = ImageDraw.Draw(img_icns)
for y in range(512):
    for x in range(512):
        r = 0
        g = int((x / 512) * 255)
        b = int(180 + (y / 512) * 75)
        img_icns.putpixel((x, y), (r, g, b))
img_icns.save('icon.png', 'PNG')
print("✅ Created icon.png for icns conversion")

print("\n🎨 All icons created successfully!")
print("Note: For production, consider creating proper icons with branding.")
