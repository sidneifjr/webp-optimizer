# Otimizador WebP

An Electron (Node.js) app that runs in the background, watches your **Downloads** folder and
converts every new image to **WebP**, saving it to `Downloads\Otimizadas` with a **hash appended
to the file name** (before the extension):

```
foto.png  ->  Downloads\Otimizadas\foto_3f9a1c07b2.webp
```

The hash (SHA-256, 10 characters) is computed from the generated WebP content. Identical images
produce the same name, so duplicates are skipped.

## Getting started

Requires 64-bit Windows 10 or later and Node.js 22.22+ on the machine that runs `npm install`
(chokidar 6 declares that minimum; the app itself runs on the Node.js bundled with Electron).

```bash
npm install
npm start
```

Since Electron 42, the Electron binary is downloaded on the first `npm start`, not during
`npm install`, so the first launch needs an internet connection and takes a bit longer.

## Lossless conversion

The converter **always tries lossless mode first**, preserving pixels exactly, including
transparency and the color profile.

When lossless would produce a file **larger than the original** (common with JPEG and AVIF,
which are already lossy formats), the app falls back to lossy mode (quality 80 by default) so the
file doesn't grow. Those images show a **com perdas** ("lossy") tag in the history.

In `config.js`, under `webp`:

- `lossless: false` turns lossless off and always uses lossy mode;
- `allowLossyFallback: false` always keeps lossless, even if the file gets larger;
- `quality` and `effort` tune the lossy mode and the compression effort.

Note: `maxWidth` (resizing) means the result is no longer lossless relative to the original.
It is disabled (`null`) by default.

## Interface

- **Alt + X** opens/collapses the panel (from any program).
- The panel shows the status, the **Desativar** (Disable) button while active or **Ativar**
  (Enable) while disabled, and the **history** as a table with the columns **Arquivo** (file),
  **Original**, **Otimizado** (optimized) and **Economia** (percentage of space saved). Newest
  entries are at the top.
  - Hover over a row to see the final file name (with hash) and the date/time.
  - Green savings = smaller file; red = file larger than the original.
  - **Limpar histórico** (Clear history) clears the list only, never the files.
- The history is stored in `%APPDATA%\otimizador-webp\history.json` (up to `historyLimit` items,
  200 by default) and survives restarts.
- When collapsed, the app shows as an **arrow** on the right edge of the screen (green = active,
  gray = disabled). Click it to open the panel.
- An arrow icon in the system tray with a menu: open/collapse, enable/disable, open the folder
  with the optimized images, and quit. The panel also has a "Sair do app" (Quit) link, and the
  Esc key collapses it.

## Configuration

Everything lives in `config.js`: conversion mode, maximum width, hash length, keeping or deleting
the original (`deleteOriginal`), watched folders, accepted extensions and history size.

To also optimize Windows screenshots (Win + PrintScreen), add the `Pictures\Screenshots` folder
to `watchDirs`.

## Notes

- Only **new** images are processed; whatever was already in the folder is ignored. Files that
  arrive while the app is disabled are not processed later either.
- Temporary browser download files (`.crdownload`, `.part`, `.tmp`) are ignored, and the app
  waits for the file to finish being written before converting it.
- Alt + X is a global shortcut: if another program already uses it, the app warns you through the
  tray and stays reachable via its icon. You can change it in `config.js` (`hotkey`).
- Only one instance runs at a time.
