"""File system operations router."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from pathlib import Path
from datetime import datetime

router = APIRouter()

# Base directory for file operations (limit to user's home and juliusos directories)
HOME_DIR = str(Path.home())
JULIOS_DIR = "/home/julius/juliusos"
ALLOWED_DIRS = [HOME_DIR, JULIOS_DIR]

class FileInfo(BaseModel):
    name: str
    path: str
    type: str  # 'file' or 'folder'
    size: str
    size_bytes: int
    modified: str
    permissions: str
    is_hidden: bool

class DirectoryListing(BaseModel):
    current_path: str
    parent_path: Optional[str]
    files: List[FileInfo]
    total_size: str

class FileOperation(BaseModel):
    source: str
    destination: Optional[str] = None

class NewFolder(BaseModel):
    path: str
    name: str

def is_path_allowed(path: str) -> bool:
    """Check if path is within allowed directories."""
    abs_path = os.path.abspath(path)
    return any(abs_path.startswith(allowed) for allowed in ALLOWED_DIRS)

def format_size(bytes_size: int) -> str:
    """Format bytes to human readable size."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"

def get_file_info(path: str) -> FileInfo:
    """Get information about a file or directory."""
    stat = os.stat(path)
    is_dir = os.path.isdir(path)

    return FileInfo(
        name=os.path.basename(path),
        path=path,
        type='folder' if is_dir else 'file',
        size='--' if is_dir else format_size(stat.st_size),
        size_bytes=stat.st_size,
        modified=datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M'),
        permissions=oct(stat.st_mode)[-3:],
        is_hidden=os.path.basename(path).startswith('.')
    )

@router.get("/list", response_model=DirectoryListing)
async def list_directory(path: str = HOME_DIR):
    """List files and directories in the specified path."""
    if not is_path_allowed(path):
        raise HTTPException(status_code=403, detail="Access denied to this directory")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Directory not found")

    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    try:
        files = []
        total_size = 0

        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            try:
                file_info = get_file_info(item_path)
                files.append(file_info)
                if file_info.type == 'file':
                    total_size += file_info.size_bytes
            except (PermissionError, OSError):
                # Skip files we can't access
                continue

        # Sort: folders first, then files, alphabetically
        files.sort(key=lambda x: (x.type != 'folder', x.name.lower()))

        parent_path = str(Path(path).parent) if path != '/' else None

        return DirectoryListing(
            current_path=path,
            parent_path=parent_path,
            files=files,
            total_size=format_size(total_size)
        )
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-folder")
async def create_folder(folder: NewFolder):
    """Create a new folder."""
    new_path = os.path.join(folder.path, folder.name)

    if not is_path_allowed(new_path):
        raise HTTPException(status_code=403, detail="Access denied to this location")

    if os.path.exists(new_path):
        raise HTTPException(status_code=400, detail="Folder already exists")

    try:
        os.makedirs(new_path)
        return {"success": True, "path": new_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/delete")
async def delete_file(operation: FileOperation):
    """Delete a file or directory."""
    if not is_path_allowed(operation.source):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(operation.source):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        if os.path.isdir(operation.source):
            shutil.rmtree(operation.source)
        else:
            os.remove(operation.source)
        return {"success": True}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rename")
async def rename_file(operation: FileOperation):
    """Rename a file or directory."""
    if not operation.destination:
        raise HTTPException(status_code=400, detail="Destination name required")

    if not is_path_allowed(operation.source):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(operation.source):
        raise HTTPException(status_code=404, detail="File not found")

    # Create full destination path
    dest_dir = os.path.dirname(operation.source)
    dest_path = os.path.join(dest_dir, operation.destination)

    if os.path.exists(dest_path):
        raise HTTPException(status_code=400, detail="A file with that name already exists")

    try:
        os.rename(operation.source, dest_path)
        return {"success": True, "new_path": dest_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/copy")
async def copy_file(operation: FileOperation):
    """Copy a file or directory."""
    if not operation.destination:
        raise HTTPException(status_code=400, detail="Destination required")

    if not is_path_allowed(operation.source) or not is_path_allowed(operation.destination):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(operation.source):
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        if os.path.isdir(operation.source):
            shutil.copytree(operation.source, operation.destination)
        else:
            shutil.copy2(operation.source, operation.destination)
        return {"success": True, "destination": operation.destination}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/move")
async def move_file(operation: FileOperation):
    """Move a file or directory."""
    if not operation.destination:
        raise HTTPException(status_code=400, detail="Destination required")

    if not is_path_allowed(operation.source) or not is_path_allowed(operation.destination):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(operation.source):
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        shutil.move(operation.source, operation.destination)
        return {"success": True, "destination": operation.destination}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download")
async def download_file(path: str):
    """Download a file."""
    if not is_path_allowed(path):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    return FileResponse(path, filename=os.path.basename(path))

@router.post("/upload")
async def upload_file(path: str, file: UploadFile = File(...)):
    """Upload a file to the specified directory."""
    if not is_path_allowed(path):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    file_path = os.path.join(path, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"success": True, "path": file_path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info")
async def get_info(path: str):
    """Get detailed information about a file or directory."""
    if not is_path_allowed(path):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Path not found")

    try:
        return get_file_info(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/read")
async def read_file(path: str):
    """Read the contents of a text file."""
    if not is_path_allowed(path):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return {"content": content, "path": path}
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not a text file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class WriteFileRequest(BaseModel):
    path: str
    content: str

@router.post("/write")
async def write_file(request: WriteFileRequest):
    """Write content to a file."""
    if not is_path_allowed(request.path):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Create parent directory if it doesn't exist
        parent_dir = os.path.dirname(request.path)
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir)

        with open(request.path, 'w', encoding='utf-8') as f:
            f.write(request.content)

        return {"success": True, "path": request.path}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
