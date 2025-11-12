"""
Code assistant recipe for reading, writing, and modifying code.
"""
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from ..core.context_builder import ContextBuilder
from ..core.ollama_client import OllamaClient


async def run_code_assistant(user_id: int, message: str, files: Optional[List[str]] = None, operation: Optional[str] = None) -> dict:
    """
    Run code assistant that can read and write code files.

    Args:
        user_id: User ID
        message: User's message/request
        files: Optional list of file paths to include in context
        operation: Optional operation type: "read", "write", "modify", "list"

    Returns:
        Dict with response and any code changes
    """
    if not message:
        return {"response": "What would you like me to help you with?", "files": []}

    # Base project directory
    base_dir = Path("/home/julius/juliusos")

    # If operation is list, return directory structure
    if operation == "list":
        structure = _get_directory_structure(base_dir, message)
        return {
            "response": f"Found the following files:\n{structure}",
            "files": [],
            "structure": structure
        }

    # Read specified files into context
    file_contents = {}
    if files:
        for file_path in files:
            full_path = base_dir / file_path
            if full_path.exists() and full_path.is_file():
                try:
                    with open(full_path, 'r') as f:
                        content = f.read()
                        file_contents[file_path] = content
                except Exception as e:
                    file_contents[file_path] = f"Error reading file: {str(e)}"

    # Build context
    context_builder = ContextBuilder()
    user_context = await context_builder.build_context(
        user_id=user_id,
        window_days=1,
        include_modules=[]
    )
    await context_builder.close()

    # Build prompt based on operation
    if operation == "read":
        system_prompt = """You are a code analysis assistant. Analyze the provided code files and answer the user's question.
Be concise and technical. Focus on explaining the code structure, logic, and any issues."""
    elif operation in ["write", "modify"]:
        system_prompt = """You are a code generation assistant. Generate or modify code based on the user's request.
Return ONLY valid code in your response. No explanations unless asked.
If modifying, show the complete modified section."""
    else:
        system_prompt = """You are a coding assistant with full access to the codebase.
You can read, analyze, and generate code. Be helpful and technical."""

    # Build user prompt
    files_context = ""
    if file_contents:
        files_context = "\n\nCURRENT FILES:\n"
        for path, content in file_contents.items():
            files_context += f"\n--- {path} ---\n{content}\n"

    user_prompt = f"""PROJECT: JuliOS - Life Operating System
BASE_DIR: /home/julius/juliusos

{files_context}

USER REQUEST: {message}

{"Provide analysis and explanation." if operation == "read" else ""}
{"Generate complete, working code." if operation == "write" else ""}
{"Show the modified code sections." if operation == "modify" else ""}
"""

    # Call LLM
    ollama = OllamaClient()
    result = await ollama.generate(
        model="llama3:8b",
        prompt=user_prompt,
        system=system_prompt,
        temperature=0.3 if operation in ["write", "modify"] else 0.5
    )
    await ollama.close()

    response_text = result.get("response", "")

    # If write/modify operation, try to extract code blocks
    code_blocks = []
    if operation in ["write", "modify"]:
        code_blocks = _extract_code_blocks(response_text)

    return {
        "response": response_text,
        "files": file_contents,
        "code_blocks": code_blocks,
        "operation": operation
    }


def _get_directory_structure(base_path: Path, filter_pattern: str = "") -> str:
    """Get directory structure as a string."""
    lines = []

    # Common directories to search
    search_dirs = [
        "apps/desktop/src",
        "services/api",
        "services/agents",
    ]

    for search_dir in search_dirs:
        full_path = base_path / search_dir
        if full_path.exists():
            lines.append(f"\n{search_dir}/")
            for root, dirs, files in os.walk(full_path):
                # Skip node_modules, venv, __pycache__
                dirs[:] = [d for d in dirs if d not in ['node_modules', 'venv', '__pycache__', '.git', 'dist', 'build']]

                level = root.replace(str(full_path), '').count(os.sep)
                indent = '  ' * level
                rel_root = Path(root).relative_to(base_path)

                for file in files:
                    if filter_pattern.lower() in file.lower() or not filter_pattern:
                        if file.endswith(('.py', '.tsx', '.ts', '.js', '.json', '.css')):
                            lines.append(f"{indent}{rel_root}/{file}")

    return '\n'.join(lines[:100])  # Limit to 100 files


def _extract_code_blocks(text: str) -> List[Dict[str, str]]:
    """Extract code blocks from markdown-style response."""
    import re

    # Match ```language\ncode\n``` blocks
    pattern = r'```(\w+)?\n(.*?)```'
    matches = re.findall(pattern, text, re.DOTALL)

    blocks = []
    for lang, code in matches:
        blocks.append({
            "language": lang or "text",
            "code": code.strip()
        })

    return blocks
