# qtrOnline

Static Qatar Airways-style flight-status homepage concept.

## What is included

- User-provided Qatar aircraft ramp hero image
- Qatar Airways / oneworld brand assets
- Phosphor Icons (regular + duotone) from jsDelivr
- Responsive departures / arrivals board
- Search, refresh, statuses, keyboard `/` shortcut
- API-ready flight data adapter

## Run it locally

### First time

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

### Every time ChatGPT updates the repo

From the `qtrOnline` folder:

```powershell
git pull
py -m http.server 8000
```

If a server is already running, you only need `git pull`, then hard-refresh the browser with `Ctrl+Shift+R`.

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
