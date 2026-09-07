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
  const heroImage = document.querySelector('#hero-image');
  const HERO_PARTS = Array.from({ length: 6 }, (_, index) => `assets/hero-b64/part-${index + 1}.b64`);

  async function loadHero() {
    if (!heroImage) return;
    try {
      const parts = await Promise.all(HERO_PARTS.map(async path => {
        const response = await fetch(path, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Hero part failed: ${response.status}`);
        return (await response.text()).trim();
      }));
      heroImage.src = `data:image/webp;base64,${parts.join('')}`;
    } catch (error) {
      console.error('Could not load hero image', error);
    }
  }
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
    const s = status.toLowerCase();
    if (s.includes('boarding')) return 'status-boarding';
    if (s.includes('final')) return 'status-final-call';
    if (s.includes('delay')) return 'status-delayed';
    if (s.includes('cancel')) return 'status-cancelled';
    if (s.includes('landed')) return 'status-landed';
    if (s.includes('arriv')) return 'status-arriving';
    return 'status-on-time';
  }

  function statusIcon(status = '') {
    const s = status.toLowerCase();
    if (s.includes('boarding')) return 'ph-door-open';
    if (s.includes('final')) return 'ph-bell-ringing';
    if (s.includes('delay')) return 'ph-clock-countdown';
    if (s.includes('cancel')) return 'ph-x-circle';
    if (s.includes('landed')) return 'ph-airplane-landing';
    if (s.includes('arriv')) return 'ph-airplane-in-flight';
    return 'ph-check-circle';
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
  }

  function render() {
    const q = search.value.trim().toLowerCase();
    const list = currentFlights.filter(f => !q || [f.flight, f.from, f.to, f.time, f.gate, f.terminal, f.status]
      .some(v => String(v || '').toLowerCase().includes(q)));

    if (!list.length) {
      rows.innerHTML = `
        <div class="empty-state">
          <i class="ph-duotone ph-magnifying-glass"></i>
          <span>No flights match your search.</span>
        </div>`;
      return;
    }

    rows.innerHTML = list.map(f => `
      <div class="flight-row" role="row">
        <div class="flight-number" role="cell">
          <span class="airline-chip"><i class="ph-fill ph-airplane-tilt"></i></span>
          <span>${escapeHTML(f.flight)}</span>
        </div>
        <div class="route" role="cell">
          <span>${escapeHTML(f.from)}</span>
          <i class="ph ph-arrow-right route-arrow" aria-hidden="true"></i>
          <span>${escapeHTML(f.to)}</span>
        </div>
        <div class="muted-cell" role="cell">${escapeHTML(f.time)}</div>
        <div class="muted-cell" role="cell">${escapeHTML(f.gate)}</div>
        <div class="muted-cell" role="cell">${escapeHTML(f.terminal)}</div>
        <div role="cell">
          <span class="status-pill ${statusClass(f.status)}">
            <i class="ph ${statusIcon(f.status)}" aria-hidden="true"></i>
            <span>${escapeHTML(f.status)}</span>
          </span>
        </div>
      </div>`).join('');
  }

  async function loadFlights(showSpinner = false) {
    if (showSpinner) refresh.classList.add('loading');
    rows.classList.add('is-loading');

    try {
      currentFlights = (await fetchFlights(board)).map(normalizeFlight);
      render();
      updated.textContent = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Qatar'
      }).format(new Date()) + ' (DOH)';
    } catch (error) {
      console.error(error);
      currentFlights = MOCK_FLIGHTS[board];
      render();
      showToast('API unavailable — showing sample flights');
    } finally {
      refresh.classList.remove('loading');
      rows.classList.remove('is-loading');
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
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

  document.querySelectorAll('[data-toast]').forEach(el => {
    el.addEventListener('click', () => showToast(el.dataset.toast));
  });

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
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Qatar'
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
  if (refreshMs >= 15000) autoRefreshTimer = setInterval(() => loadFlights(false), refreshMs);
  window.addEventListener('beforeunload', () => clearInterval(autoRefreshTimer));

  loadHero();
  loadFlights();
})();
