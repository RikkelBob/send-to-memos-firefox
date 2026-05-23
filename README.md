# Save to Memos — Firefox Extension

A Firefox extension that lets you save selected text, images, videos, audio, links, and full pages to your self-hosted [Memos](https://usememos.com/) instance via the right-click context menu.

## Features

- **Text** — highlight any text and save it as a note
- **Images, video, audio** — right-click media to save a link to it
- **Links** — save any hyperlink with its anchor text
- **Pages** — save the current page title and URL
- Each note includes the source URL and a timestamp, and is tagged `#browser-extension`

## Setup

1. Load the extension in Firefox:
   - Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**
   - Select `manifest.json` from this directory
2. Click the extension icon in the toolbar to open **Settings**
3. Enter your **Memos URL** (e.g. `https://memos.yourserver.com`) and an **API Token**
   - Generate a token in Memos under **Settings → API Tokens**
4. Click **Save Settings** or **Test Connection** to verify

## Usage

Right-click on any of the following to save it to Memos:

| Context | Menu item |
|---|---|
| Selected text | Save to Memos |
| Image | Save image to Memos |
| Video | Save video to Memos |
| Audio | Save audio to Memos |
| Link | Save link to Memos |
| Page (blank area) | Save page to Memos |

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest (Manifest V2) |
| `background.js` | Context menu registration and Memos API calls |
| `options.html/js` | Settings page UI |
| `icons/` | Extension icons |

## Requirements

- Firefox with support for the `browser` WebExtension API
- A running [Memos](https://usememos.com/) instance with API access
