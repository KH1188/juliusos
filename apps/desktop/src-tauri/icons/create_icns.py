#!/usr/bin/env python3
"""Create a minimal valid .icns file."""
import struct
from PIL import Image
import io

def create_icns(input_png, output_icns):
    """Create an ICNS file from a PNG."""
    img = Image.open(input_png)

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

    print(f"✅ Created {output_icns}")

# Create .icns from the 512x512 PNG
create_icns('icon.png', 'icon.icns')
