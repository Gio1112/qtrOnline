# qtrOnline

Static Qatar Airways-style flight-status homepage concept.

## What is included

- User-provided Qatar aircraft ramp hero image
- Qatar Airways / oneworld brand assets
- Phosphor Icons (regular, duotone, and fill) from jsDelivr
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

Then open `http://localhost:8000` in your browser.

If `py` is unavailable, use:

```powershell
python -m http.server 8000
```

Keep that terminal open while you view the site. Press `Ctrl+C` to stop the local server.

### Every time ChatGPT updates the repo

You do **not** clone it again. Open PowerShell in your existing `qtrOnline` folder and run:

```powershell
git pull --ff-only
```

If your local server is still running, hard-refresh the browser with `Ctrl+Shift+R`.

If the server is not running, start it again:

```powershell
py -m http.server 8000
```

and visit `http://localhost:8000`.

### If you edit files locally

Before pulling, check what changed:

```powershell
git status
```

If you want to keep those edits, commit them first:

```powershell
git add .
git commit -m "Describe my changes"
git pull --rebase
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
