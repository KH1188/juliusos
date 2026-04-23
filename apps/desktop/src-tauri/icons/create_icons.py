#!/usr/bin/env python3
"""Create simple placeholder icons for Tauri."""
import struct

def create_png(width, height, filename):
    """Create a simple solid color PNG."""
    # PNG signature
    png_sig = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk (width, height, bit depth, color type, etc.)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = 0x45BC6357  # Pre-calculated CRC for this IHDR
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)

    # Create image data (simple blue gradient)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type (none)
        for x in range(width):
            # RGB: gradient from blue to cyan
            r = 0
            g = int((x / width) * 255)
            b = int(200 + (y / height) * 55)
            raw_data += bytes([r, g, b])

    # Compress image data
    import zlib
    compressed = zlib.compress(raw_data, 9)

    # IDAT chunk
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)

    # IEND chunk
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', 0xAE426082)

    # Write PNG file
    with open(filename, 'wb') as f:
        f.write(png_sig + ihdr + idat + iend)

def create_ico(filename):
    """Create a simple ICO file."""
    # ICO header
    ico_header = struct.pack('<HHH', 0, 1, 1)  # Reserved, Type (1=ICO), Count

    # ICO directory entry for 32x32 icon
    width, height = 32, 32
    ico_dir = struct.pack('<BBBBHHII',
        width, height,  # Width, Height
        0,              # Color palette
        0,              # Reserved
        1,              # Color planes
        32,             # Bits per pixel
        0,              # Image size (we'll update this)
        22              # Offset to image data
    )

    # Create a simple 32x32 RGBA bitmap
    pixels = b''
    for y in range(height):
        for x in range(width):
            r, g, b = 0, int((x / width) * 255), 200
            a = 255
            pixels += bytes([b, g, r, a])  # BGRA format for ICO

    # BMP header for ICO
    bmp_header = struct.pack('<IIIHHIIIIII',
        40,              # Header size
        width, height*2, # Width, Height (doubled for ICO)
        1, 32,           # Planes, Bits per pixel
        0,               # Compression
        len(pixels),     # Image size
        0, 0, 0, 0       # Resolution, colors
    )

    # Update image size in directory
    image_data = bmp_header + pixels
    ico_dir = ico_dir[:8] + struct.pack('<I', len(image_data)) + ico_dir[12:]

    with open(filename, 'wb') as f:
        f.write(ico_header + ico_dir + image_data)

# Create PNG icons
print("Creating 32x32.png...")
create_png(32, 32, '32x32.png')
print("Creating 128x128.png...")
create_png(128, 128, '128x128.png')
print("Creating icon.ico...")
create_ico('icon.ico')

# For macOS .icns, just create a placeholder file
print("Creating icon.icns (placeholder)...")
with open('icon.icns', 'wb') as f:
    f.write(b'icns\x00\x00\x00\x08')  # Minimal ICNS header

print("✅ All icons created!")
