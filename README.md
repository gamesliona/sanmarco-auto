# San Marco Generator

Mobile-first poster generator for San Marco's 1080×1350 social post layout.

## Run locally

```powershell
python -m http.server 5173 --bind 0.0.0.0
```

Open `http://localhost:5173` on the computer.

For your phone, keep the computer and phone on the same Wi-Fi, run `ipconfig`, copy the computer's IPv4 address, then open:

```text
http://YOUR-IP:5173
```

Example: `http://192.168.1.23:5173`.

## Publish With GitHub Pages

This repo is ready for GitHub Pages through `.github/workflows/pages.yml`.

1. Create an empty GitHub repository.
2. Push this folder to the repo:

```powershell
git add .
git commit -m "Initial San Marco generator"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

3. In GitHub, open the repo, then go to Settings > Pages.
4. Set Build and deployment > Source to GitHub Actions.
5. Wait for the "Deploy to GitHub Pages" action to finish.

Your phone URL will be:

```text
https://YOUR-USER.github.io/YOUR-REPO/
```

Open that URL on your phone and use Add to Home Screen.

## Phone use

- Upload from gallery or camera.
- Drag the preview to reposition the photo.
- Adjust text size for the caption.
- Move the caption up or down inside the Notes box.
- Leave Manual lines on to make Enter/newlines in the text box become real caption lines.
- Adjust zoom and offsets.
- Tap Reset or the small `0` buttons to return positioning values to neutral.
- Tap Save to download the PNG.
- Tap Share on phones that support the Web Share API.

Caption text renders in uppercase and white by default, while Markdown-emphasized text uses the highlight yellow `#ffd101`. The image fades into the black caption area, matching the social post layout.

For home-screen install as a real PWA, GitHub Pages gives you the HTTPS URL Safari and Chrome need.
