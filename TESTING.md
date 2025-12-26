# Testing Guide

## Test Your Changes Locally

1. **Start the server:**
   ```bash
   npm start
   ```
   (If port 8080 is busy, the app might already be running!)

2. **Open in browser:**
   - Go to `http://localhost:8080`

3. **Test Room Creation:**
   - Click "New Game"
   - Enter your name (e.g., "Player 1")
   - Click "Generate Room"
   - You should see a 6-character room code appear
   - Click "📋 Copy Link" button
   - The link should be copied to your clipboard

4. **Test Room Joining:**
   - Open a new browser tab (or incognito/private window)
   - Paste the link you copied
   - The room code should automatically appear in the "Room Code" field
   - Enter a different name (e.g., "Player 2")
   - Click "Start Game"

5. **Verify URL Parameters:**
   - Check the URL bar - it should show: `http://localhost:8080?room=ABCD12`
   - The room code in the URL matches the one in the input field

## What Changed

✅ **URL-based room joining** - Share links with `?room=CODE` parameter
✅ **Copy Link button** - One-click copy of shareable room link
✅ **Auto-fill from URL** - Room code automatically populated from URL
✅ **2-player optimization** - Simplified for you and your cofounder
✅ **Deployment guide** - Ready to deploy tonight

## Quick Deployment Tonight

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions.

**Fastest option (GitHub Pages):**
1. `git add .`
2. `git commit -m "Add multiplayer improvements"`
3. `git push`
4. Enable GitHub Pages in repo settings
5. Share the link with your cofounder!
