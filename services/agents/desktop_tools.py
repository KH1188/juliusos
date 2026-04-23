"""
Tools for AI agent to interact with desktop applications.

These tools allow the AI to:
- Read and manage calendar events
- Read and manage emails
- Access file system
- Run terminal commands
"""

import requests
from typing import Optional, List
from datetime import datetime

API_BASE = "http://localhost:8000"


# ============================================================================
# CALENDAR TOOLS
# ============================================================================

def get_calendar_events(date: Optional[str] = None, year: Optional[int] = None, month: Optional[int] = None) -> dict:
    """
    Get calendar events, optionally filtered by date/year/month.

    Args:
        date: Specific date in YYYY-MM-DD format
        year: Filter by year (e.g., 2025)
        month: Filter by month (1-12, requires year)

    Returns:
        List of calendar events

    Example:
        # Get all events
        get_calendar_events()

        # Get events for specific date
        get_calendar_events(date="2025-12-25")

        # Get events for a month
        get_calendar_events(year=2025, month=12)
    """
    params = {}
    if date:
        params['date'] = date
    if year:
        params['year'] = year
    if month:
        params['month'] = month

    response = requests.get(f"{API_BASE}/calendar-events/events", params=params)
    return response.json()


def get_upcoming_events(limit: int = 10) -> dict:
    """
    Get upcoming calendar events (future and today).

    Args:
        limit: Maximum number of events to return (default 10)

    Returns:
        List of upcoming events sorted by date

    Example:
        # Get next 5 events
        get_upcoming_events(limit=5)
    """
    response = requests.get(f"{API_BASE}/calendar-events/events/upcoming", params={'limit': limit})
    return response.json()


def create_calendar_event(date: str, title: str, time: str = "") -> dict:
    """
    Create a new calendar event.

    Args:
        date: Event date in YYYY-MM-DD format
        title: Event title/description
        time: Optional time (e.g., "10:00 AM", "14:30")

    Returns:
        Created event details

    Example:
        # Create event
        create_calendar_event(
            date="2025-12-25",
            title="Christmas Celebration",
            time="10:00 AM"
        )
    """
    data = {
        'date': date,
        'title': title,
        'time': time
    }
    response = requests.post(f"{API_BASE}/calendar-events/events", json=data)
    return response.json()


def delete_calendar_event(event_id: int) -> dict:
    """
    Delete a calendar event.

    Args:
        event_id: ID of the event to delete

    Returns:
        Success confirmation

    Example:
        delete_calendar_event(event_id=123)
    """
    response = requests.delete(f"{API_BASE}/calendar-events/events/{event_id}")
    return response.json()


# ============================================================================
# EMAIL TOOLS
# ============================================================================

def get_emails(folder: Optional[str] = None, unread: Optional[bool] = None,
               search: Optional[str] = None) -> dict:
    """
    Get emails, optionally filtered.

    Args:
        folder: Filter by folder (inbox, sent, drafts, trash, starred)
        unread: Filter by unread status (True/False)
        search: Search in subject, from, to, and body

    Returns:
        List of emails

    Example:
        # Get all inbox emails
        get_emails(folder="inbox")

        # Get unread emails
        get_emails(folder="inbox", unread=True)

        # Search emails
        get_emails(search="project update")
    """
    params = {}
    if folder:
        params['folder'] = folder
    if unread is not None:
        params['unread'] = str(unread).lower()
    if search:
        params['search'] = search

    response = requests.get(f"{API_BASE}/emails/emails", params=params)
    return response.json()


def get_unread_inbox() -> dict:
    """
    Get unread emails in inbox.

    Returns:
        Count and list of unread emails

    Example:
        unread = get_unread_inbox()
        print(f"You have {unread['count']} unread emails")
    """
    response = requests.get(f"{API_BASE}/emails/emails/inbox/unread")
    return response.json()


def get_email_by_id(email_id: int) -> dict:
    """
    Get a specific email by ID.

    Args:
        email_id: ID of the email

    Returns:
        Email details

    Example:
        email = get_email_by_id(email_id=123)
    """
    response = requests.get(f"{API_BASE}/emails/emails/{email_id}")
    return response.json()


def send_email(to: str, subject: str, body: str) -> dict:
    """
    Send/create a new email.

    Note: This is a local email system. Emails are stored locally.

    Args:
        to: Recipient email address
        subject: Email subject
        body: Email body content

    Returns:
        Created email details

    Example:
        send_email(
            to="friend@julios.local",
            subject="Meeting Tomorrow",
            body="Don't forget about our meeting at 10 AM!"
        )
    """
    data = {
        'to_addr': to,
        'subject': subject,
        'body': body
    }
    response = requests.post(f"{API_BASE}/emails/emails", json=data)
    return response.json()


def mark_email_as_read(email_id: int) -> dict:
    """
    Mark an email as read.

    Args:
        email_id: ID of the email

    Returns:
        Updated email details

    Example:
        mark_email_as_read(email_id=123)
    """
    data = {'unread': False}
    response = requests.patch(f"{API_BASE}/emails/emails/{email_id}", json=data)
    return response.json()


def star_email(email_id: int) -> dict:
    """
    Star/favorite an email.

    Args:
        email_id: ID of the email

    Returns:
        Updated email details

    Example:
        star_email(email_id=123)
    """
    data = {'starred': True}
    response = requests.patch(f"{API_BASE}/emails/emails/{email_id}", json=data)
    return response.json()


def delete_email(email_id: int, permanent: bool = False) -> dict:
    """
    Delete an email (move to trash or permanently delete).

    Args:
        email_id: ID of the email
        permanent: If True, permanently delete. If False, move to trash.

    Returns:
        Deletion confirmation

    Example:
        # Move to trash
        delete_email(email_id=123)

        # Permanently delete
        delete_email(email_id=123, permanent=True)
    """
    response = requests.delete(
        f"{API_BASE}/emails/emails/{email_id}",
        params={'permanent': str(permanent).lower()}
    )
    return response.json()


def get_email_stats() -> dict:
    """
    Get email statistics (counts by folder, unread, starred).

    Returns:
        Email statistics

    Example:
        stats = get_email_stats()
        print(f"Total emails: {stats['total']}")
        print(f"Unread: {stats['unread']}")
    """
    response = requests.get(f"{API_BASE}/emails/emails/stats")
    return response.json()


# ============================================================================
# FILE SYSTEM TOOLS
# ============================================================================

def list_files(path: str = "/home/julius") -> dict:
    """
    List files and directories in a path.

    Args:
        path: Directory path to list

    Returns:
        Directory listing with files and metadata

    Example:
        files = list_files(path="/home/julius/Documents")
    """
    response = requests.get(f"{API_BASE}/files/list", params={'path': path})
    return response.json()


def read_file(path: str) -> dict:
    """
    Read contents of a text file.

    Args:
        path: Full path to the file

    Returns:
        File contents and metadata

    Example:
        content = read_file(path="/home/julius/notes.txt")
        print(content['content'])
    """
    response = requests.get(f"{API_BASE}/files/read", params={'path': path})
    return response.json()


def write_file(path: str, content: str) -> dict:
    """
    Write content to a file.

    Args:
        path: Full path to the file
        content: Content to write

    Returns:
        Success confirmation

    Example:
        write_file(
            path="/home/julius/note.txt",
            content="This is my note"
        )
    """
    data = {'path': path, 'content': content}
    response = requests.post(f"{API_BASE}/files/write", json=data)
    return response.json()


# ============================================================================
# TERMINAL TOOLS
# ============================================================================

def execute_command(command: str, cwd: Optional[str] = None) -> dict:
    """
    Execute a shell command.

    Args:
        command: Shell command to execute
        cwd: Working directory (optional)

    Returns:
        Command output (stdout, stderr, exit code)

    Example:
        result = execute_command(command="ls -la", cwd="/home/julius")
        print(result['stdout'])
    """
    data = {'command': command}
    if cwd:
        data['cwd'] = cwd

    response = requests.post(f"{API_BASE}/terminal/execute", json=data)
    return response.json()


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("=== Desktop Tools Examples ===\n")

    # Calendar examples
    print("1. Getting upcoming calendar events:")
    upcoming = get_upcoming_events(limit=5)
    print(f"   Found {len(upcoming)} upcoming events")

    print("\n2. Creating a calendar event:")
    event = create_calendar_event(
        date="2025-12-25",
        title="Christmas Celebration",
        time="10:00 AM"
    )
    print(f"   Created event: {event['title']} on {event['date']}")

    # Email examples
    print("\n3. Checking unread emails:")
    unread = get_unread_inbox()
    print(f"   You have {unread['count']} unread emails")

    print("\n4. Getting email statistics:")
    stats = get_email_stats()
    print(f"   Total emails: {stats['total']}")
    print(f"   Inbox: {stats['inbox']}, Sent: {stats['sent']}")

    # File system examples
    print("\n5. Listing home directory:")
    files = list_files(path="/home/julius")
    print(f"   Found {len(files['files'])} items in {files['current_path']}")

    print("\n=== All tools are working! ===")
