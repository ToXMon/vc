# 🚀 Quick Start - Real Multiplayer

## You and Your Cofounder - Tonight!

Your app now has **real peer-to-peer multiplayer**. Here's how to play together:

### Step 1: Deploy (2 minutes)

**GitHub Pages (Easiest)**:
```bash
# Make sure changes are committed
git add .
git commit -m "Add PeerJS real multiplayer"
git push

# Enable GitHub Pages:
# Go to: github.com/ToXMon/vc/settings/pages
# Set source to "main" branch
# Click Save
# Your URL: https://toxmon.github.io/vc
```

**OR use Netlify** (drag & drop your folder at netlify.com)

### Step 2: You Create a Room

1. Open your deployed app
2. Click **"New Game"**
3. Enter your name
4. Click **"Generate Room"**
5. Click **"📋 Copy Link"**
6. Send link to your cofounder (Slack/text/email)

### Step 3: Cofounder Joins

1. They click your link
2. Enter their name
3. Click **"Start Game"**
4. You'll both see "Player connected!" 🎉

### Step 4: Play!

- Take turns rolling dice
- Chat in real-time
- See each other's chips update
- First to 3 green chips wins!

## What's Different Now?

| Before | After (Now!) |
|--------|--------------|
| ❌ Simulation mode | ✅ Real multiplayer |
| ❌ Fake chat | ✅ Real-time chat |
| ❌ Local only | ✅ Play from anywhere |
| ❌ Single player | ✅ 2-player over internet |

## Technical Details

- **Technology**: PeerJS (WebRTC peer-to-peer)
- **Hosting**: Static files on GitHub Pages/Netlify
- **Backend**: None needed! 
- **Cost**: $0 (free forever)
- **Latency**: ~100ms typical
- **Requirements**: Modern browser (Chrome, Firefox, Safari, Edge)

## Troubleshooting

**Link doesn't work?**
- Make sure you're using the deployed URL (not localhost)
- Check that GitHub Pages is enabled
- Wait ~1 minute after enabling Pages

**Can't connect to each other?**
- Both need internet connection
- Check firewall/VPN settings
- Try from different network

**Chat not appearing?**
- Make sure both clicked "Start Game"
- Look for "Player connected!" notification
- Try refreshing both browsers

## Test It First!

Before sharing with your cofounder, test locally:

```bash
npm start

# Open in regular browser:
http://localhost:8080

# Create room and copy link

# Open link in INCOGNITO/PRIVATE window

# You're now playing with yourself! 😄
```

---

**You're ready to deploy and play!** 🎲

See [MULTIPLAYER.md](MULTIPLAYER.md) for more details about the real-time features.
