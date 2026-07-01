Pompom Birthday Quest - GitHub Pages Notes

Passwords:
- User: pudding
- Admin: admin

Upload every file/folder in this folder to your GitHub repository.
For GitHub Pages, use Settings > Pages > Deploy from branch, then select your branch and root folder.

I only patched the login/taskbar/admin/sound support. The working game code and game buttons were left alone.

Optional sound files you can add/replace in assets/:
- theme.mp3
- window-open.mp3
- victory.mp3
- hit.mp3
- ko.mp3
- round1.mp3
- round2.mp3
- round3.mp3

Small WAV fallback sounds are included, so the site still makes sounds if the MP3 files are missing.


Editable letters folder:
- Edit content/letters/letter1.txt, letter2.txt, letter3.txt, etc.
- The first line can be a title if it starts with #, example: # Letter 1.
- GitHub Pages will load these txt files automatically.

Optional sounds:
- assets/theme.mp3 = background music, auto-starts after login at 3% volume.
- assets/fireworks.mp3 = finale fireworks sound.
- Existing MP3 slots still work and fallback WAV files are included.


Sound effects added:
- assets/sfx/game-start.wav
- assets/sfx/collect.wav
- assets/sfx/bad.wav
- assets/sfx/block.wav
- assets/sfx/move.wav
- assets/sfx/tap.wav
- assets/sfx/sudoku-ok.wav / sudoku-wrong.wav
- assets/sfx/bridge-stretch.wav / bridge-release.wav / bridge-land.wav / bridge-perfect.wav / bridge-fall.wav
- assets/sfx/marble-shoot.wav / marble-pop.wav / marble-switch.wav
- assets/sfx/paper.wav
- assets/sfx/firework-pop.wav
These are tiny generated local WAV files and can be replaced later if you want different sounds. Existing MP3 slots were not removed.


FINAL SOUND POLISH
- Added generated local WAV background loops in assets/bgm/.
- Added generated local game sound effects in assets/sfx/.
- Added per-stage ambience, UI click sounds, key sounds, road traffic whooshes, catblob powerup/bark sounds, Sudoku pencil sounds, bridge wind/creak sounds, marble combo sounds, fight punch/kick/guard/power blast sounds, and finale fireworks.
- All files are local and GitHub Pages friendly. Replace any WAV/MP3 later if you want.
