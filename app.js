(() => {
  const config = window.QTR_CONFIG || {};

  const MOCK_FLIGHTS = {
    departures: [
      { flight: 'QR 003', from: 'Doha (DOH)', to: 'London (LHR)', time: '07:55', gate: 'C7', terminal: 'T1', status: 'On Time' },
      { flight: 'QR 701', from: 'Doha (DOH)', to: 'New York (JFK)', time: '08:05', gate: 'A11', terminal: 'T1', status: 'Boarding' },
      { flight: 'QR 944', from: 'Doha (DOH)', to: 'Singapore (SIN)', time: '08:40', gate: 'B2', terminal: 'T1', status: 'Final Call' },
      { flight: 'QR 1002', from: 'Doha (DOH)', to: 'Dubai (DXB)', time: '09:05', gate: 'C3', terminal: 'T1', status: 'Delayed 35 min' },
      { flight: 'QR 908', from: 'Doha (DOH)', to: 'Sydney (SYD)', time: '09:30', gate: 'A8', terminal: 'T1', status: 'On Time' }
    ],
    arrivals: [
      { flight: 'QR 004', from: 'London (LHR)', to: 'Doha (DOH)', time: '08:10', gate: 'D4', terminal: 'T1', status: 'Landed' },
      { flight: 'QR 702', from: 'New York (JFK)', to: 'Doha (DOH)', time: '08:35', gate: 'C9', terminal: 'T1', status: 'Arriving' },
      { flight: 'QR 945', from: 'Singapore (SIN)', to: 'Doha (DOH)', time: '09:00', gate: 'B6', terminal: 'T1', status: 'On Time' },
      { flight: 'QR 1003', from: 'Dubai (DXB)', to: 'Doha (DOH)', time: '09:25', gate: 'A3', terminal: 'T1', status: 'Delayed 20 min' },
      { flight: 'QR 909', from: 'Sydney (SYD)', to: 'Doha (DOH)', time: '10:05', gate: 'D1', terminal: 'T1', status: 'On Time' }
    ]
  };

  const rows = document.querySelector('#flight-rows');
  const search = document.querySelector('#flight-search');
  const refresh = document.querySelector('#refresh-flights');
  const updated = document.querySelector('#last-updated');
  const dateLabel = document.querySelector('#board-date');
  const toast = document.querySelector('.toast');

  let board = 'departures';
  let currentFlights = [];
  let toastTimer;
  let autoRefreshTimer;

  function normalizeFlight(raw = {}) {
    return {
      flight: raw.flight ?? raw.flightNumber ?? raw.number ?? '—',
      from: raw.from ?? raw.origin ?? raw.departureAirport ?? '—',
      to: raw.to ?? raw.destination ?? raw.arrivalAirport ?? '—',
      time: raw.time ?? raw.scheduled ?? raw.scheduledTime ?? '—',
      gate: raw.gate ?? '—',
      terminal: raw.terminal ?? '—',
      status: raw.status ?? 'Scheduled'
    };
  }

  async function fetchFlights(type) {
    if (!config.apiEndpoint) return MOCK_FLIGHTS[type];

    const url = new URL(config.apiEndpoint, window.location.href);
    url.searchParams.set('board', type);
    url.searchParams.set('airport', config.airport || 'DOH');

    const response = await fetch(url.toString(), {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Flight API returned ${response.status}`);

    const payload = await response.json();
    const flights = Array.isArray(payload) ? payload : (payload.flights || payload.data || []);
    return flights.map(normalizeFlight);
  }

  function statusClass(status = '') {
    const value = status.toLowerCase();
    if (value.includes('boarding')) return 'status-boarding';
    if (value.includes('final')) return 'status-final-call';
    if (value.includes('delay')) return 'status-delayed';
    if (value.includes('cancel')) return 'status-cancelled';
    if (value.includes('landed')) return 'status-landed';
    if (value.includes('arriv')) return 'status-arriving';
    return 'status-on-time';
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const list = currentFlights.filter(flight => !query || [
      flight.flight,
      flight.from,
      flight.to,
      flight.time,
      flight.gate,
      flight.terminal,
      flight.status
    ].some(value => String(value || '').toLowerCase().includes(query)));

    if (!list.length) {
      rows.innerHTML = '<div class="empty-state">No flights match your search.</div>';
      return;
    }

    rows.innerHTML = list.map(flight => `
      <div class="flight-row" role="row">
        <div class="flight-number" role="cell">${escapeHTML(flight.flight)}</div>
        <div class="route" role="cell">
          <span>${escapeHTML(flight.from)}</span>
          <i class="ph ph-arrow-right route-arrow" aria-hidden="true"></i>
          <span>${escapeHTML(flight.to)}</span>
        </div>
        <div class="muted-cell" role="cell">${escapeHTML(flight.time)}</div>
        <div class="muted-cell" role="cell">${escapeHTML(flight.gate)}</div>
        <div class="muted-cell" role="cell">${escapeHTML(flight.terminal)}</div>
        <div role="cell">
          <span class="status-text ${statusClass(flight.status)}">${escapeHTML(flight.status)}</span>
        </div>
      </div>`).join('');
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  async function loadFlights(showSpinner = false) {
    if (showSpinner) refresh.classList.add('loading');
    rows.classList.add('is-loading');

    try {
      currentFlights = (await fetchFlights(board)).map(normalizeFlight);
      render();
      updated.textContent = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Qatar'
      }).format(new Date()) + ' (DOH)';
    } catch (error) {
      console.error(error);
      currentFlights = MOCK_FLIGHTS[board];
      render();
      showToast('Live data unavailable — showing sample flights');
    } finally {
      refresh.classList.remove('loading');
      rows.classList.remove('is-loading');
    }
  }

  function setBoard(nextBoard) {
    board = nextBoard;
    document.querySelectorAll('.board-tab').forEach(tab => {
      const active = tab.dataset.board === board;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    search.value = '';
    loadFlights();
  }

  document.querySelectorAll('.board-tab').forEach(tab => {
    tab.addEventListener('click', () => setBoard(tab.dataset.board));
  });

  search.addEventListener('input', render);
  refresh.addEventListener('click', () => loadFlights(true));

  document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== search) {
      event.preventDefault();
      search.focus();
    }
  });

  dateLabel.textContent = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Qatar'
  }).format(new Date());

  window.flightBoard = {
    refresh: () => loadFlights(true),
    setBoard,
    setFlights(flights) {
      currentFlights = Array.isArray(flights) ? flights.map(normalizeFlight) : [];
      render();
    },
    setEndpoint(endpoint) {
      config.apiEndpoint = endpoint;
      return loadFlights(true);
    }
  };

  const refreshMs = Number(config.refreshMs) || 0;
  if (refreshMs >= 15000) {
    autoRefreshTimer = setInterval(() => loadFlights(false), refreshMs);
  }

  window.addEventListener('beforeunload', () => clearInterval(autoRefreshTimer));
  loadFlights();
})();
