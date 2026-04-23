"""Email management router for AI agent integration."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from pathlib import Path

router = APIRouter()

# Store emails in a JSON file
DATA_DIR = Path.home() / ".julios" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
EMAILS_FILE = DATA_DIR / "emails.json"

class Email(BaseModel):
    id: int
    from_addr: str
    to_addr: str
    subject: str
    body: str
    timestamp: int
    folder: str  # inbox, sent, drafts, trash
    unread: bool
    starred: bool

class EmailCreate(BaseModel):
    from_addr: str = "me@julios.local"
    to_addr: str
    subject: str
    body: str
    folder: str = "sent"

class EmailUpdate(BaseModel):
    folder: Optional[str] = None
    unread: Optional[bool] = None
    starred: Optional[bool] = None

def load_emails() -> List[dict]:
    """Load emails from JSON file."""
    if not EMAILS_FILE.exists():
        return []
    try:
        with open(EMAILS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_emails(emails: List[dict]):
    """Save emails to JSON file."""
    with open(EMAILS_FILE, 'w') as f:
        json.dump(emails, f, indent=2)

@router.get("/emails", response_model=List[Email])
async def get_all_emails(
    folder: Optional[str] = None,
    unread: Optional[bool] = None,
    starred: Optional[bool] = None,
    search: Optional[str] = None
):
    """
    Get all emails, optionally filtered.

    - folder: Filter by folder (inbox, sent, drafts, trash)
    - unread: Filter by unread status
    - starred: Filter by starred status
    - search: Search in subject, from, to, and body
    """
    emails = load_emails()

    if folder:
        # Special case for starred - show starred emails from all folders except trash
        if folder == 'starred':
            emails = [e for e in emails if e.get('starred', False) and e.get('folder') != 'trash']
        else:
            emails = [e for e in emails if e.get('folder') == folder]

    if unread is not None:
        emails = [e for e in emails if e.get('unread', False) == unread]

    if starred is not None:
        emails = [e for e in emails if e.get('starred', False) == starred]

    if search:
        search_lower = search.lower()
        emails = [e for e in emails if
                  search_lower in e.get('subject', '').lower() or
                  search_lower in e.get('from_addr', '').lower() or
                  search_lower in e.get('to_addr', '').lower() or
                  search_lower in e.get('body', '').lower()]

    # Sort by timestamp (newest first)
    emails.sort(key=lambda e: e.get('timestamp', 0), reverse=True)

    return emails

@router.get("/emails/inbox/unread")
async def get_unread_inbox():
    """Get unread emails in inbox."""
    emails = load_emails()
    unread = [e for e in emails if e.get('folder') == 'inbox' and e.get('unread', False)]
    unread.sort(key=lambda e: e.get('timestamp', 0), reverse=True)

    return {
        "count": len(unread),
        "emails": unread
    }

@router.get("/emails/{email_id}", response_model=Email)
async def get_email(email_id: int):
    """Get a specific email by ID."""
    emails = load_emails()
    email = next((e for e in emails if e['id'] == email_id), None)

    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    return email

@router.post("/emails", response_model=Email)
async def create_email(email: EmailCreate):
    """
    Create/send a new email.

    Note: This is a local email system, so emails are just stored locally.
    """
    emails = load_emails()

    # Generate new ID
    new_id = max([e['id'] for e in emails], default=0) + 1

    new_email = {
        'id': new_id,
        'from_addr': email.from_addr,
        'to_addr': email.to_addr,
        'subject': email.subject,
        'body': email.body,
        'timestamp': int(datetime.now().timestamp() * 1000),
        'folder': email.folder,
        'unread': False,
        'starred': False
    }

    emails.append(new_email)
    save_emails(emails)

    return new_email

@router.patch("/emails/{email_id}", response_model=Email)
async def update_email(email_id: int, update: EmailUpdate):
    """
    Update email properties (folder, unread, starred).

    Common use cases:
    - Move to trash: folder="trash"
    - Mark as read: unread=false
    - Star email: starred=true
    """
    emails = load_emails()

    email_index = next((i for i, e in enumerate(emails) if e['id'] == email_id), None)
    if email_index is None:
        raise HTTPException(status_code=404, detail="Email not found")

    email = emails[email_index]

    # Update only provided fields
    if update.folder is not None:
        email['folder'] = update.folder
    if update.unread is not None:
        email['unread'] = update.unread
    if update.starred is not None:
        email['starred'] = update.starred

    save_emails(emails)

    return email

@router.delete("/emails/{email_id}")
async def delete_email(email_id: int, permanent: bool = False):
    """
    Delete an email.

    - If permanent=false and email is not in trash: move to trash
    - If permanent=true or email is in trash: permanently delete
    """
    emails = load_emails()

    email = next((e for e in emails if e['id'] == email_id), None)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    if permanent or email.get('folder') == 'trash':
        # Permanently delete
        emails = [e for e in emails if e['id'] != email_id]
        save_emails(emails)
        return {"success": True, "deleted_id": email_id, "permanent": True}
    else:
        # Move to trash
        email['folder'] = 'trash'
        save_emails(emails)
        return {"success": True, "moved_to_trash": email_id, "permanent": False}

@router.post("/emails/sync")
async def sync_with_frontend(emails_data: List[Email]):
    """
    Sync emails from frontend localStorage to backend.
    This allows the desktop app to push its localStorage data to the API.
    """
    emails = [e.dict() for e in emails_data]
    save_emails(emails)

    return {"success": True, "synced_count": len(emails)}

@router.get("/emails/stats")
async def get_email_stats():
    """Get email statistics."""
    emails = load_emails()

    return {
        "total": len(emails),
        "inbox": len([e for e in emails if e.get('folder') == 'inbox']),
        "sent": len([e for e in emails if e.get('folder') == 'sent']),
        "drafts": len([e for e in emails if e.get('folder') == 'drafts']),
        "trash": len([e for e in emails if e.get('folder') == 'trash']),
        "unread": len([e for e in emails if e.get('unread', False)]),
        "starred": len([e for e in emails if e.get('starred', False)])
    }
