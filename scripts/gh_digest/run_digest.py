"""
Scheduled PM + AI Gmail digest for GitHub Actions.
Uses Chicago calendar day, Gmail API, OpenAI for HTML body, sends via Gmail.
"""
from __future__ import annotations

import base64
import email.mime.multipart
import email.mime.text
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta
from email.message import EmailMessage
from pathlib import Path
from zoneinfo import ZoneInfo

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from openai import OpenAI

CHICAGO = ZoneInfo("America/Chicago")
REPO_ROOT = Path(__file__).resolve().parents[2]
PROMPT_PATH = REPO_ROOT / "scripts" / "pm-ai-digest-prompt.txt"

# Broad inbox filter; tighten in repo if needed.
GMAIL_QUERY_EXTRA = (
    "(newsletter OR substack OR lenny OR stratechery OR tldr OR pragmatic OR "
    '"product management" OR PM OR AI OR LLM OR agent OR inference OR benchmark)'
)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]

MAX_MESSAGES = int(os.environ.get("DIGEST_MAX_MESSAGES", "35"))
BODY_CHARS_PER_MSG = int(os.environ.get("DIGEST_BODY_CHARS", "12000"))
SLEEP_BETWEEN_FETCH = float(os.environ.get("DIGEST_FETCH_SLEEP", "0.25"))


def chicago_today_window() -> tuple[datetime, datetime, str, str]:
    """Start/end (Chicago) for 'today', plus Gmail after/before date strings."""
    now = datetime.now(CHICAGO)
    force = os.environ.get("DIGEST_FORCE_RUN", "").lower() in ("1", "true", "yes")
    if not force and now.hour != 9:
        print(f"Skip: Chicago local hour is {now.hour}, not 9 (workflow fires at 14/15 UTC).")
        sys.exit(0)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    after = start.strftime("%Y/%m/%d")
    before = end.strftime("%Y/%m/%d")
    return start, end, after, before


def gmail_service():
    cid = os.environ.get("GMAIL_CLIENT_ID", "").strip()
    csec = os.environ.get("GMAIL_CLIENT_SECRET", "").strip()
    rt = os.environ.get("GMAIL_REFRESH_TOKEN", "").strip()
    missing = [k for k, v in [("GMAIL_CLIENT_ID", cid), ("GMAIL_CLIENT_SECRET", csec), ("GMAIL_REFRESH_TOKEN", rt)] if not v]
    if missing:
        print("Missing secrets:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)
    creds = Credentials(
        token=None,
        refresh_token=rt,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cid,
        client_secret=csec,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return build("gmail", "v1", credentials=creds, cache_discovery=False)


def decode_body_data(data: str) -> str:
    if not data:
        return ""
    raw = base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))
    return raw.decode("utf-8", errors="replace")


def extract_text_from_payload(payload: dict) -> str:
    """Prefer text/plain; fall back to stripped text/html."""
    mime = payload.get("mimeType", "")
    body = payload.get("body", {})
    if body.get("data"):
        text = decode_body_data(body["data"])
        if mime == "text/html":
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"\s+", " ", text).strip()
        return text[:BODY_CHARS_PER_MSG]
    parts = payload.get("parts") or []
    plain, html = "", ""
    for p in parts:
        m = p.get("mimeType", "")
        sub = extract_text_from_payload(p)
        if m == "text/plain" and sub:
            plain = sub or plain
        elif m == "text/html" and sub:
            html = sub or html
    return (plain or html)[:BODY_CHARS_PER_MSG]


def list_message_ids(service, query: str) -> list[str]:
    ids: list[str] = []
    page_token = None
    while True:
        resp = (
            service.users()
            .messages()
            .list(userId="me", q=query, pageToken=page_token, maxResults=100)
            .execute()
        )
        for m in resp.get("messages", []):
            ids.append(m["id"])
            if len(ids) >= MAX_MESSAGES:
                return ids
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return ids


def fetch_messages_payload(service, ids: list[str]) -> list[dict]:
    out: list[dict] = []
    for mid in ids:
        try:
            msg = service.users().messages().get(userId="me", id=mid, format="full").execute()
        except Exception as e:
            print(f"warn: skip {mid}: {e}", file=sys.stderr)
            continue
        pl = msg.get("payload", {})
        headers = {h["name"].lower(): h["value"] for h in pl.get("headers", [])}
        subject = headers.get("subject", "(no subject)")
        frm = headers.get("from", "")
        date_h = headers.get("date", "")
        body = extract_text_from_payload(pl)
        thread_id = msg.get("threadId", "")
        gmail_link = f"https://mail.google.com/mail/u/0/#all/{mid}"
        out.append(
            {
                "id": mid,
                "threadId": thread_id,
                "subject": subject,
                "from": frm,
                "date": date_h,
                "body_excerpt": body,
                "gmail_link": gmail_link,
            }
        )
        time.sleep(SLEEP_BETWEEN_FETCH)
    return out


def build_user_prompt(chicago_date: datetime, items: list[dict]) -> str:
    lines = [
        f"Chicago calendar date for this digest: {chicago_date.strftime('%A %B %d, %Y')}.",
        "Below is JSON of messages (id, subject, from, date, body_excerpt, gmail_link).",
        "Produce the HTML email body per the system instructions.",
        "",
        json.dumps(items, ensure_ascii=False),
    ]
    return "\n".join(lines)


def load_system_prompt() -> str:
    if PROMPT_PATH.is_file():
        return PROMPT_PATH.read_text(encoding="utf-8")
    raise FileNotFoundError(f"Missing prompt file: {PROMPT_PATH}")


def generate_html(system_prompt: str, user_prompt: str) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("Missing OPENAI_API_KEY", file=sys.stderr)
        sys.exit(1)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    text = (resp.choices[0].message.content or "").strip()
    # Allow model to wrap in markdown code fence
    m = re.match(r"^```(?:html)?\s*([\s\S]*?)```\s*$", text)
    if m:
        text = m.group(1).strip()
    return text


def send_html_email(service, to_addr: str, subject: str, html_body: str) -> None:
    msg = EmailMessage()
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.set_content("This message requires an HTML-capable mail client.")
    msg.add_alternative(html_body, subtype="html")
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode().rstrip("=")
    service.users().messages().send(userId="me", body={"raw": raw}).execute()


def main() -> None:
    dry = os.environ.get("DIGEST_DRY_RUN", "").lower() in ("1", "true", "yes")
    start, _end, after, before = chicago_today_window()
    query = f"{GMAIL_QUERY_EXTRA} after:{after} before:{before}"
    print("Gmail query:", query)

    service = gmail_service()
    ids = list_message_ids(service, query)
    if not ids:
        print("No messages matched; exiting without sending.")
        sys.exit(0)

    items = fetch_messages_payload(service, ids)
    if not items:
        print("No message bodies fetched; exiting.")
        sys.exit(0)

    system_prompt = load_system_prompt()
    user_prompt = build_user_prompt(start, items)
    html_body = generate_html(system_prompt, user_prompt)

    subj_date = f"{start.strftime('%b')} {start.day}, {start.year}"
    subject = f"PM + AI digest — {subj_date}"
    to_addr = os.environ.get("DIGEST_TO_EMAIL", "lela.zhou818@gmail.com").strip()

    if dry:
        print("--- DIGEST_DRY_RUN: not sending ---")
        print("Subject:", subject)
        print(html_body[:8000])
        if len(html_body) > 8000:
            print(f"\n... ({len(html_body)} chars total)")
        return

    send_html_email(service, to_addr, subject, html_body)
    print("Sent digest to", to_addr)


if __name__ == "__main__":
    main()
