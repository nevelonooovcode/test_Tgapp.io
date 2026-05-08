const API = 'http://127.0.0.1:8000/api';

// Telegram WebApp helper
const tg = window.Telegram?.WebApp;
const initData = tg?.initData || '';

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
  };
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { ...apiHeaders(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── STATE ──
const state = {
  serviceId:  null,
  service:    'Маникюр',
  price:      '1 200 ₽',
  masterId:   null,
  master:     'Алина',
  dateLabel:  null,
  dateISO:    null,
  time:       null,
};

// ── TABS ──
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('bottomArea').style.display = name === 'booking' ? 'block' : 'none';
  document.getElementById('backBtn').style.display = 'none';
  document.getElementById('tabBar').style.display = 'flex';

  if (name === 'bookings') loadBookings();
  if (name === 'profile')  loadProfile();
}

// ── LOAD SERVICES FROM API ──
async function loadServices() {
  try {
    const services = await apiFetch('/services/');
    const wrap = document.querySelector('.services-list') || document.getElementById('servicesList');
    if (!wrap) return;
    wrap.innerHTML = '';
    services.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = 'service-card' + (i === 0 ? ' selected' : '');
      el.dataset.service = s.name;
      el.dataset.serviceId = s.id;
      el.dataset.price = formatPrice(s.price);
      el.innerHTML = `
        <div class="service-icon">${s.icon}</div>
        <div class="service-info">
          <div class="service-name">${s.name}</div>
          <div class="service-meta">${s.duration} мин · ${formatPrice(s.price)}</div>
        </div>`;
      el.onclick = () => selectService(el);
      if (i === 0) {
        state.service = s.name;
        state.serviceId = s.id;
        state.price = formatPrice(s.price);
        loadMasters(s.id);
      }
      wrap.appendChild(el);
    });
  } catch (e) {
    console.error('Failed to load services', e);
  }
}

// ── LOAD MASTERS FROM API ──
async function loadMasters(serviceId) {
  try {
    const masters = await apiFetch(`/masters/?service=${serviceId}`);
    const wrap = document.querySelector('.masters-list') || document.getElementById('mastersList');
    if (!wrap) return;
    wrap.innerHTML = '';
    masters.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'master-card' + (i === 0 ? ' selected' : '');
      el.dataset.master = m.name;
      el.dataset.masterId = m.id;
      el.innerHTML = `
        <div class="master-avatar">${m.avatar}</div>
        <div class="master-name">${m.name}</div>
        <div class="master-spec">${m.specialty}</div>
        <div class="master-rating">★ ${m.rating}</div>`;
      el.onclick = () => selectMaster(el);
      if (i === 0) {
        state.master = m.name;
        state.masterId = m.id;
        loadSlots();
      }
      wrap.appendChild(el);
    });
  } catch (e) {
    console.error('Failed to load masters', e);
  }
}

// ── LOAD AVAILABLE SLOTS ──
async function loadSlots() {
  if (!state.masterId || !state.dateISO) return;
  try {
    const data = await apiFetch(`/masters/${state.masterId}/availability/?date=${state.dateISO}`);
    document.querySelectorAll('.time-slot').forEach(el => {
      const available = data.slots.includes(el.textContent.trim());
      el.classList.toggle('disabled', !available);
      el.style.opacity = available ? '1' : '0.35';
      el.style.pointerEvents = available ? 'auto' : 'none';
      if (el.classList.contains('selected') && !available) {
        el.classList.remove('selected');
        state.time = null;
      }
    });
  } catch (e) {
    console.error('Failed to load slots', e);
  }
}

// ── SELECTIONS ──
function selectService(el) {
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.service = el.dataset.service;
  state.serviceId = +el.dataset.serviceId;
  state.price = el.dataset.price;
  loadMasters(state.serviceId);
}

function selectMaster(el) {
  document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.master = el.dataset.master;
  state.masterId = +el.dataset.masterId;
  loadSlots();
}

function selectDate(el) {
  document.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.dateLabel = el.dataset.label;
  state.dateISO = el.dataset.iso;
  loadSlots();
}

function selectTime(el) {
  if (el.classList.contains('disabled')) return;
  document.querySelectorAll('.time-slot').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.time = el.textContent.trim();
}

// ── BUILD DATE STRIP ──
function buildDates() {
  const days   = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  const months = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  const wrap   = document.getElementById('dateScroll');
  const today  = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = `${d.getDate()} ${months[d.getMonth()]}`;
    const iso = d.toISOString().slice(0, 10);

    const el = document.createElement('div');
    el.className     = 'date-card' + (i === 0 ? ' selected' : '');
    el.dataset.label = label;
    el.dataset.iso   = iso;
    el.innerHTML     = `<div class="date-day">${days[d.getDay()]}</div><div class="date-num">${d.getDate()}</div>`;
    el.onclick       = () => selectDate(el);

    if (i === 0) {
      state.dateLabel = label;
      state.dateISO = iso;
    }
    wrap.appendChild(el);
  }
}

// ── BOOK ──
async function bookNow() {
  if (!state.time) {
    alert('Пожалуйста, выберите время');
    return;
  }
  if (!initData && !state.masterId) {
    // Dev fallback: show confirmation without API
    showConfirmation({ service: { name: state.service }, master: { name: state.master },
      date: state.dateLabel, time: state.time, status_display: 'Подтверждено' });
    return;
  }

  const btn = document.getElementById('bookBtn');
  btn.disabled = true;
  btn.textContent = 'Загрузка...';

  try {
    const booking = await apiFetch('/bookings/', {
      method: 'POST',
      body: JSON.stringify({
        service: state.serviceId,
        master: state.masterId,
        date: state.dateISO,
        time: state.time + ':00',
      }),
    });
    showConfirmation(booking);
    loadSlots(); // refresh availability
  } catch (e) {
    alert('Ошибка: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Записаться →';
  }
}

function showConfirmation(booking) {
  document.getElementById('c-service').textContent = booking.service?.name || state.service;
  document.getElementById('c-master').textContent  = booking.master?.name || state.master;
  document.getElementById('c-date').textContent    = booking.date || state.dateLabel || '—';
  document.getElementById('c-time').textContent    = booking.time || state.time;
  document.getElementById('c-price').textContent   = state.price;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-confirm').classList.add('active');
  document.getElementById('bottomArea').style.display = 'none';
  document.getElementById('tabBar').style.display = 'none';
  document.getElementById('backBtn').style.display = 'flex';
}

// ── MY BOOKINGS ──
async function loadBookings() {
  const wrap = document.getElementById('bookingsList');
  if (!wrap) return;
  if (!initData) return; // need auth

  wrap.innerHTML = '<p style="text-align:center;opacity:.5">Загрузка...</p>';
  try {
    const bookings = await apiFetch('/bookings/');
    if (!bookings.length) {
      wrap.innerHTML = '<p style="text-align:center;opacity:.5">Записей пока нет</p>';
      return;
    }
    wrap.innerHTML = bookings.map(b => `
      <div class="booking-card" data-id="${b.id}">
        <div class="booking-header">
          <span class="booking-service">${b.service.icon || ''} ${b.service.name}</span>
          <span class="booking-status status-${b.status}">${b.status_display}</span>
        </div>
        <div class="booking-meta">Мастер: ${b.master.name}</div>
        <div class="booking-meta">${b.date} · ${b.time?.slice(0,5)} · ${b.service.duration} мин</div>
        ${b.status === 'confirmed' ? `
          <div class="booking-actions">
            <button onclick="cancelBooking(${b.id})" class="btn-cancel">Отменить</button>
          </div>` : ''}
      </div>`).join('');
  } catch (e) {
    wrap.innerHTML = `<p style="text-align:center;color:#ef4444">${e.message}</p>`;
  }
}

async function cancelBooking(id) {
  if (!confirm('Отменить запись?')) return;
  try {
    await apiFetch(`/bookings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });
    loadBookings();
  } catch (e) {
    alert('Ошибка: ' + e.message);
  }
}

// ── PROFILE ──
async function loadProfile() {
  if (!initData) return;
  try {
    const p = await apiFetch('/profile/');
    const nameEl = document.querySelector('.profile-name');
    const statsEl = document.querySelector('.profile-stats');
    const pointsEl = document.querySelector('.loyalty-points');
    if (nameEl) nameEl.textContent = `${p.first_name} ${p.last_name}`.trim();
    if (statsEl) statsEl.textContent = `${p.total_visits} посещений`;
    if (pointsEl) pointsEl.textContent = `${p.loyalty_points} баллов`;
  } catch (e) {
    console.error('Profile load failed', e);
  }
}

// ── HELPERS ──
function formatPrice(rubles) {
  return rubles.toLocaleString('ru-RU') + ' ₽';
}

function goBack() { switchTab('booking'); }
function goHome()  { switchTab('booking'); }

// ── INIT ──
buildDates();
loadServices();
if (tg) tg.ready();
