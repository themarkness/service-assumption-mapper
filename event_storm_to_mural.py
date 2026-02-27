#!/usr/bin/env python3
"""
event_storm_to_mural.py
=======================
Parses the Service Card Event Storm HTML and posts all sticky notes
to a MURAL board, preserving the two-row layout and colour coding.

Requirements:
    pip install requests beautifulsoup4

Setup:
    1. Go to https://app.mural.co/me/apps
       → New app → name it anything → Redirect URL: http://localhost:8080/callback
       → Save and continue → note your Client ID and Client Secret
       → Under Scopes, enable: murals:read  murals:write
    2. Create a blank mural. The mural ID is in the URL:
       https://app.mural.co/t/WORKSPACE/m/WORKSPACE/XXXXXXXXXX/...
       The long number after /m/WORKSPACE/ is your mural ID.
    3. Set CLIENT_ID, CLIENT_SECRET, and MURAL_ID below, then run:
          python event_storm_to_mural.py
       Your browser will open for a one-time login. After approving,
       the script continues automatically.
"""

import json
import time
import threading
import webbrowser
import urllib.parse
import http.server
import requests
from bs4 import BeautifulSoup, Tag

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
CLIENT_ID     = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"
MURAL_ID      = "YOUR_MURAL_ID"        # long numeric ID from the mural URL
HTML_FILE     = "service-card-event-storm-v3.html"

REDIRECT_URI  = "http://localhost:8080/callback"
AUTH_URL      = "https://app.mural.co/api/public/v1/authorization/oauth2/"
TOKEN_URL     = "https://app.mural.co/api/public/v1/authorization/oauth2/token"
API_BASE      = f"https://app.mural.co/api/public/v1/murals/{MURAL_ID}"

SCOPES        = "murals:read murals:write"

# ── LAYOUT CONSTANTS (all values in MURAL pixels) ─────────────────────────────
STEP_W        = 230     # width of one column slot
NOTE_W        = 170     # sticky note width
RM_CMD_W      = 135     # width of rm/cmd notes when side by side
GAP_H         = 10      # gap between rm and cmd notes horizontally
TOP_H         = 280     # height of top zone (actors/policies above spine)
SPINE_Y       = 280     # Y of spine row
NOTE_H        = 80      # approximate height of one sticky note
GAP_V         = 6       # vertical gap between stacked notes
SECTION_GAP   = 1100    # vertical gap between Onboarding and Home sections

# ── MURAL COLOUR MAP ──────────────────────────────────────────────────────────
# MURAL sticky notes accept hex colour values
COLOUR_MAP = {
    "act": "#FFF176",   # Actor          — yellow
    "rm":  "#A5D6A7",   # Read Model     — green
    "cmd": "#82CBF9",   # Command        — blue
    "ev":  "#FFAB40",   # Event          — orange
    "pol": "#D4B4E9",   # Policy         — purple
    "hs":  "#F48FB1",   # Hotspot        — pink
    "sys": "#B0A89E",   # System/Tool    — grey
    "dec": "#FFCC80",   # Decision       — amber
    "res": "#B2EBF2",   # Resolved       — cyan
}

UNHAPPY_PREFIX = "⚠ "

# ── OAUTH FLOW ────────────────────────────────────────────────────────────────

_auth_code = None

class _CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global _auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        if "code" in params:
            _auth_code = params["code"][0]
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h2>Authorised! You can close this tab and return to the terminal.</h2>")

    def log_message(self, *args):
        pass  # suppress HTTP log noise


def get_access_token() -> str:
    """Open browser for OAuth consent, capture code, exchange for token."""
    params = {
        "client_id":     CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "scope":         SCOPES,
        "response_type": "code",
    }
    auth_url = AUTH_URL + "?" + urllib.parse.urlencode(params)
    print(f"\nOpening browser for MURAL authorisation…\n{auth_url}\n")
    webbrowser.open(auth_url)

    # Spin up a one-shot local server to catch the redirect
    server = http.server.HTTPServer(("localhost", 8080), _CallbackHandler)
    server.timeout = 120
    print("Waiting for MURAL to redirect back (timeout 120s)…")
    server.handle_request()

    if not _auth_code:
        raise RuntimeError("No authorisation code received. Did you approve the MURAL request?")

    # Exchange code for access token
    resp = requests.post(
        TOKEN_URL,
        data={
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code":          _auth_code,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        },
    )
    resp.raise_for_status()
    token_data = resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise RuntimeError(f"Token exchange failed: {token_data}")
    print("✓ Authorised successfully.\n")
    return access_token


# ── HELPERS ───────────────────────────────────────────────────────────────────

def note_type(el: Tag) -> str:
    classes = el.get("class", [])
    for cls in COLOUR_MAP:
        if cls in classes:
            return cls
    return "sys"

def is_unhappy(el: Tag) -> bool:
    return "up" in el.get("class", [])

def extract_text(el: Tag) -> str:
    clone = BeautifulSoup(str(el), "html.parser")
    for nt in clone.select(".nt"):
        nt.decompose()
    return " ".join(clone.get_text(separator=" ").split())

def colour(cls: str) -> str:
    return COLOUR_MAP.get(cls, "#B0A89E")


# ── MURAL API CALLS ───────────────────────────────────────────────────────────

def make_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type":  "application/json",
        "Accept":        "vnd.mural.preview",
    }


def post_sticky(token: str, x: float, y: float, content: str,
                bg_color: str, width: int = NOTE_W) -> None:
    """
    MURAL sticky note widget.
    Position is the TOP-LEFT corner (unlike Miro which uses centre).
    """
    payload = {
        "x":              round(x),
        "y":              round(y),
        "width":          width,
        "height":         NOTE_H,
        "text":           content,
        "backgroundColor": bg_color,
        "shape":          "rectangle",
    }
    resp = requests.post(
        f"{API_BASE}/widgets/sticky-note",
        headers=make_headers(token),
        data=json.dumps(payload),
    )
    if resp.status_code not in (200, 201):
        print(f"  ✗ FAILED ({resp.status_code}): {content[:50]}  →  {resp.text[:120]}")
    else:
        print(f"  ✓ {bg_color}  {content[:60]}")
    time.sleep(0.3)   # ~3 req/sec — well under MURAL rate limits


def post_text_label(token: str, x: float, y: float, text: str) -> None:
    """Post a text widget as a section header."""
    payload = {
        "x":       round(x),
        "y":       round(y),
        "width":   400,
        "height":  50,
        "text":    f"<strong>{text}</strong>",
        "style":   {"fontSize": 24, "color": "#333333"},
    }
    resp = requests.post(
        f"{API_BASE}/widgets/text",
        headers=make_headers(token),
        data=json.dumps(payload),
    )
    if resp.status_code not in (200, 201):
        print(f"  ✗ Label FAILED ({resp.status_code}): {text}")
    else:
        print(f"  ✓ Label: {text}")
    time.sleep(0.3)


# ── FLOW PROCESSOR ────────────────────────────────────────────────────────────
# MURAL uses top-left origin for position, so we offset by NOTE_W/2 and NOTE_H/2
# compared to the Miro script (which used centre origin).

def tl_x(cx: float, w: int = NOTE_W) -> float:
    """Convert centre-x to top-left x."""
    return cx - w / 2

def tl_y(cy: float) -> float:
    """Convert centre-y to top-left y."""
    return cy - NOTE_H / 2


def process_flow(token: str, flow_div: Tag, x0: float, y0: float) -> None:
    col = 0
    children = [c for c in flow_div.children if isinstance(c, Tag)]

    for child in children:
        classes = child.get("class", [])

        # ── STEP GROUP (.sg) ────────────────────────────────────────────────
        if "sg" in classes:
            cx = x0 + col * STEP_W + NOTE_W / 2

            # TOP ZONE
            top_div = child.find(class_="top")
            if top_div:
                top_notes = top_div.find_all(class_="n")
                for k, note in enumerate(reversed(top_notes)):
                    cls = note_type(note)
                    txt = extract_text(note)
                    if is_unhappy(note):
                        txt = UNHAPPY_PREFIX + txt
                    cy  = y0 + SPINE_Y - (k + 1) * (NOTE_H + GAP_V)
                    post_sticky(token, tl_x(cx), tl_y(cy), txt, colour(cls))

            # SPINE ZONE
            spine_div = child.find(class_="spine")
            if spine_div:
                if "par" in spine_div.get("class", []):
                    par_rows = spine_div.find_all(class_="par-row")
                    for k, row in enumerate(par_rows):
                        for note in row.find_all(class_="n"):
                            cls = note_type(note)
                            txt = extract_text(note)
                            cy  = y0 + SPINE_Y + k * (NOTE_H + GAP_V)
                            post_sticky(token, tl_x(cx), tl_y(cy), txt, colour(cls))
                else:
                    spine_notes = spine_div.find_all(class_="n")
                    if len(spine_notes) == 1:
                        note = spine_notes[0]
                        post_sticky(token, tl_x(cx), tl_y(y0 + SPINE_Y),
                                    extract_text(note), colour(note_type(note)))
                    elif len(spine_notes) == 2:
                        rm_cx  = cx - RM_CMD_W / 2 - GAP_H / 2
                        cmd_cx = cx + RM_CMD_W / 2 + GAP_H / 2
                        rm, cmd = spine_notes[0], spine_notes[1]
                        post_sticky(token, tl_x(rm_cx,  RM_CMD_W), tl_y(y0 + SPINE_Y),
                                    extract_text(rm),  colour(note_type(rm)),  RM_CMD_W)
                        post_sticky(token, tl_x(cmd_cx, RM_CMD_W), tl_y(y0 + SPINE_Y),
                                    extract_text(cmd), colour(note_type(cmd)), RM_CMD_W)

            col += 1

        # ── EVENT NODE (.en) ────────────────────────────────────────────────
        elif "en" in classes:
            cx = x0 + col * STEP_W + NOTE_W / 2

            spine_div = child.find(class_="spine")
            n_events  = 0
            if spine_div:
                ev_notes = spine_div.find_all(class_="n")
                n_events = len(ev_notes)
                for k, note in enumerate(ev_notes):
                    cls = note_type(note)
                    txt = extract_text(note)
                    cy  = y0 + SPINE_Y + k * (NOTE_H + GAP_V)
                    post_sticky(token, tl_x(cx), tl_y(cy), txt, colour(cls))

            bot_div = child.find(class_="bot")
            if bot_div:
                bot_notes   = bot_div.find_all(class_="n")
                bot_y_start = y0 + SPINE_Y + max(n_events, 1) * (NOTE_H + GAP_V) + GAP_V * 2
                for k, note in enumerate(bot_notes):
                    cls = note_type(note)
                    txt = extract_text(note)
                    if is_unhappy(note):
                        txt = UNHAPPY_PREFIX + txt
                    cy  = bot_y_start + k * (NOTE_H + GAP_V)
                    post_sticky(token, tl_x(cx), tl_y(cy), txt, colour(cls))

            col += 1

        # ── HANDOVER DIVIDER (.hd-wrap) ──────────────────────────────────────
        elif "hd-wrap" in classes:
            badge = child.find(class_="hd-badge")
            if badge:
                cx  = x0 + col * STEP_W + NOTE_W / 2
                txt = badge.get_text(separator=" ").strip()
                post_sticky(token, tl_x(cx), tl_y(y0 + SPINE_Y), txt, "#E67E22")
            col += 1


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

def main():
    print(f"Reading {HTML_FILE} …")
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    flows = soup.find_all(class_="flow")
    if len(flows) < 2:
        print(f"Expected 2 flow divs, found {len(flows)}. Check HTML.")
        return

    token = get_access_token()

    sections = [
        ("Onboarding Team", flows[0], 0.0,  0.0),
        ("Home Team",       flows[1], 0.0,  float(SECTION_GAP)),
    ]

    for (name, flow, x0, y0) in sections:
        print(f"\n{'═'*60}")
        print(f"  Section: {name}  (origin x={x0}, y={y0})")
        print(f"{'═'*60}")
        post_text_label(token, x0 + 10, y0 + SPINE_Y - TOP_H - 60, name)
        process_flow(token, flow, x0, y0)

    print("\n\nAll done. Refresh your MURAL board to see the result.")


if __name__ == "__main__":
    main()
