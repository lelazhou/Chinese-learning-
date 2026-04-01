"""
One-time local script: OAuth desktop flow → refresh token for GitHub Actions.
Run on your PC (not in CI). Paste printed refresh token into repo secret GMAIL_REFRESH_TOKEN.

Prereq: Google Cloud OAuth client type "Desktop app" with the same client ID/secret
        you use for GitHub secrets GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET.
"""
from __future__ import annotations

import os
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]


def main() -> None:
    cid = os.environ.get("GMAIL_CLIENT_ID", "").strip()
    csec = os.environ.get("GMAIL_CLIENT_SECRET", "").strip()
    if not cid or not csec:
        print(
            "Set environment variables GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET, then re-run.\n"
            "Example (PowerShell):\n"
            '  $env:GMAIL_CLIENT_ID="....apps.googleusercontent.com"\n'
            '  $env:GMAIL_CLIENT_SECRET="GOCSPX-..."\n'
            "  python scripts/gh_digest/get_refresh_token.py",
            file=sys.stderr,
        )
        sys.exit(1)

    client_config = {
        "installed": {
            "client_id": cid,
            "client_secret": csec,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    if not creds.refresh_token:
        print("No refresh token returned. Try revoking app access in Google Account and run again with prompt=consent.", file=sys.stderr)
        sys.exit(1)
    print("\nAdd this to GitHub → Settings → Secrets → Actions:\n")
    print("Name:  GMAIL_REFRESH_TOKEN")
    print("Value:", creds.refresh_token)
    print()


if __name__ == "__main__":
    main()
