"""Terminal command execution router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import subprocess
import os
import shlex

router = APIRouter()

class CommandRequest(BaseModel):
    command: str
    cwd: Optional[str] = None

class CommandResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    cwd: str

# Dangerous commands that should be blocked
BLOCKED_COMMANDS = ['rm -rf /', 'dd', 'mkfs', 'format', ':(){:|:&};:']

def is_command_safe(command: str) -> bool:
    """Check if command is safe to execute."""
    command_lower = command.lower().strip()

    # Block dangerous patterns
    for blocked in BLOCKED_COMMANDS:
        if blocked in command_lower:
            return False

    # Block commands that could harm the system
    dangerous_patterns = ['rm -rf /', '> /dev/sda', 'dd if=', 'mkfs.']
    for pattern in dangerous_patterns:
        if pattern in command_lower:
            return False

    return True

@router.post("/execute", response_model=CommandResponse)
async def execute_command(request: CommandRequest):
    """Execute a shell command and return the output."""

    if not is_command_safe(request.command):
        raise HTTPException(status_code=403, detail="Command blocked for safety reasons")

    # Default to home directory
    cwd = request.cwd or os.path.expanduser('~')

    if not os.path.isdir(cwd):
        raise HTTPException(status_code=400, detail="Invalid working directory")

    try:
        # Execute command
        result = subprocess.run(
            request.command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=30  # 30 second timeout
        )

        return CommandResponse(
            stdout=result.stdout,
            stderr=result.stderr,
            exit_code=result.returncode,
            cwd=cwd
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Command timed out after 30 seconds")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cwd")
async def get_cwd():
    """Get current working directory."""
    return {"cwd": os.getcwd()}
