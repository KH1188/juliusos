#!/usr/bin/env python3
"""Create proper RGBA icons for Tauri using Pillow."""
from PIL import Image, ImageDraw
import struct
import io

def create_icon_rgba(size, filename):
    """Create a simple icon with RGBA format."""
    # Create RGBA image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Create a gradient background (blue to cyan) with full opacity
    for y in range(size):
        for x in range(size):
            r = 0
            g = int((x / size) * 255)
            b = int(180 + (y / size) * 75)
            a = 255  # Full opacity
            img.putpixel((x, y), (r, g, b, a))

    img.save(filename, 'PNG')
    print(f"✅ Created {filename} (RGBA)")

# Create PNG icons with RGBA
create_icon_rgba(32, '32x32.png')
create_icon_rgba(128, '128x128.png')
create_icon_rgba(256, '256x256.png')

# For .ico, create RGBA version
img_ico = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
for y in range(32):
    for x in range(32):
        r = 0
        g = int((x / 32) * 255)
        b = int(180 + (y / 32) * 75)
        a = 255
        img_ico.putpixel((x, y), (r, g, b, a))
img_ico.save('icon.ico', 'ICO')
print("✅ Created icon.ico (RGBA)")

# Create base image for icns
img_base = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
for y in range(512):
    for x in range(512):
        r = 0
        g = int((x / 512) * 255)
        b = int(180 + (y / 512) * 75)
        a = 255
        img_base.putpixel((x, y), (r, g, b, a))
img_base.save('icon.png', 'PNG')

# Create .icns file
def create_icns(input_png, output_icns):
    """Create an ICNS file from a PNG."""
    img = Image.open(input_png)

    # Ensure RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Resize to common icon sizes
    sizes = {
        'ic07': 128,  # 128x128
        'ic08': 256,  # 256x256
        'ic09': 512,  # 512x512
        'ic10': 1024, # 1024x1024 (retina)
    }

    icns_data = b'icns'  # Magic number
    chunks = b''

    for ostype, size in sizes.items():
        # Resize image
        resized = img.resize((size, size), Image.Resampling.LANCZOS)

        # Save as PNG to bytes
        png_bytes = io.BytesIO()
        resized.save(png_bytes, format='PNG')
        png_data = png_bytes.getvalue()

        # Create chunk
        chunk_type = ostype.encode('ascii')
        chunk_size = 8 + len(png_data)  # Header (8 bytes) + data
        chunk = chunk_type + struct.pack('>I', chunk_size) + png_data
        chunks += chunk

    # Total size
    total_size = 8 + len(chunks)  # Header + all chunks

    # Write ICNS file
    with open(output_icns, 'wb') as f:
        f.write(b'icns')
        f.write(struct.pack('>I', total_size))
        f.write(chunks)

    print(f"✅ Created {output_icns} (RGBA)")

create_icns('icon.png', 'icon.icns')

print("\n🎨 All RGBA icons created successfully!")
