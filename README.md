# qtrOnline

Static Qatar Airways-style flight-status homepage concept.

## What is included

- User-provided Qatar aircraft ramp hero image
- Qatar Airways / oneworld brand assets
- **Phosphor Icons** for the interface (regular, duotone, and fill weights — no Lucide)
- **Flag Icons** for proper country flags instead of emoji glyphs
- Responsive departures / arrivals board
- Search, refresh, status icons, and the `/` search shortcut
- API-ready flight data adapter

## Run it locally

### First time only

Open PowerShell in the folder where you want the project and run:

```powershell
git clone https://github.com/Gio1112/qtrOnline.git
cd qtrOnline
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If `py` is unavailable, use:

```powershell
python -m http.server 8000
```

Keep that terminal open while you view the site. Press `Ctrl+C` to stop the server.

## The normal workflow after ChatGPT updates the repo

You only clone the repository once. After that, every time I push changes for you:

```powershell
cd path\to\qtrOnline
git pull --ff-only origin main
py -m http.server 8000
```

Then visit `http://localhost:8000` and press **Ctrl+Shift+R** to hard-refresh if the page was already open.

If the local server is already running, you do **not** need to start another one. Just run:

```powershell
git pull --ff-only origin main
```

and refresh the browser.

### Quick check before pulling

If you have been editing files yourself, run:

```powershell
git status
```

If it says the working tree is clean, pull normally.

If you want to keep your own local edits:

```powershell
git add .
git commit -m "Describe my local changes"
git pull --rebase origin main
```

## Flight API connection

Edit `config.js`:

```js
window.QTR_CONFIG = {
  apiEndpoint: "https://your-api.example.com/flights",
  airport: "DOH",
  refreshMs: 60000
};
```

The frontend calls the endpoint with:

- `?board=departures&airport=DOH`
- `?board=arrivals&airport=DOH`

It accepts either an array or `{ "flights": [...] }` / `{ "data": [...] }`.

Each row can use this shape:

```json
{
  "flight": "QR 003",
  "from": "Doha (DOH)",
  "to": "London (LHR)",
  "time": "07:55",
  "gate": "C7",
  "terminal": "T1",
  "status": "On Time"
}
```

Common aliases such as `flightNumber`, `origin`, `destination`, and `scheduledTime` are normalized automatically.

## Graphik

The CSS is ready for Graphik, but font binaries are not committed. Put your licensed files in `assets/fonts/` using the filenames documented in `assets/fonts/README.md`.
