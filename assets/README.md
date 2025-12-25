# Assets Directory

This directory contains game assets for the "All or Nothing" PWA.

## Required Assets

### Icons
- `icon-192.svg` - 192x192 app icon (SVG format - currently available)
- `icon-512.svg` - 512x512 app icon (SVG format - currently available)

**Note for Production:** While SVG icons are provided and work in most modern browsers, iOS requires PNG icons for proper PWA support. To add PNG icons:

1. Convert the SVG icons to PNG format at 192x192 and 512x512 resolutions
2. Save them as `icon-192.png` and `icon-512.png` in this directory
3. The manifest.json is configured to use SVG icons, but PNG fallbacks can be added

You can generate PNG icons using:
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- Online SVG to PNG converters
- Command line: `convert icon-192.svg icon-192.png` (requires ImageMagick)

### Sounds (Optional)
The following sound files can enhance the gaming experience:

- `sounds/dice-roll.mp3` - Sound effect when dice are rolled
- `sounds/chip-collect.mp3` - Sound effect when chips are collected
- `sounds/win.mp3` - Sound effect when a player wins
- `sounds/background.mp3` - Background music during gameplay

Free sound resources:
- [Freesound](https://freesound.org/)
- [OpenGameArt](https://opengameart.org/)
- [Zapsplat](https://www.zapsplat.com/)

## Note
The game will work without these assets, but they enhance the user experience. Audio elements are configured to fail gracefully if files are not present.
