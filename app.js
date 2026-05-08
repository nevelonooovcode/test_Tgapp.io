const state = {
  service:   'Маникюр',
  price:     '1 200 ₽',
  master:    'Алина',
  dateLabel: null,
  time:      null,
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
}

// ── SELECTIONS ──
function selectService(el) {
  document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.service = el.dataset.service;
  state.price   = el.dataset.price;
}

function selectMaster(el) {
  document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.master = el.dataset.master;
}

function selectDate(el) {
  document.querySelectorAll('.date-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.dateLabel = el.dataset.label;
}

function selectTime(el) {
  document.querySelectorAll('.time-slot').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.time = el.textContent;
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

    const el = document.createElement('div');
    el.className     = 'date-card' + (i === 0 ? ' selected' : '');
    el.dataset.label = label;
    el.innerHTML     = `<div class="date-day">${days[d.getDay()]}</div><div class="date-num">${d.getDate()}</div>`;
    el.onclick       = () => selectDate(el);

    if (i === 0) state.dateLabel = label;
    wrap.appendChild(el);
  }
}

// ── BOOK ──
function bookNow() {
  if (!state.time) {
    alert('Пожалуйста, выберите время');
    return;
  }

  document.getElementById('c-service').textContent = state.service;
  document.getElementById('c-master').textContent  = state.master;
  document.getElementById('c-date').textContent    = state.dateLabel || '—';
  document.getElementById('c-time').textContent    = state.time;
  document.getElementById('c-price').textContent   = state.price;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-confirm').classList.add('active');
  document.getElementById('bottomArea').style.display = 'none';
  document.getElementById('tabBar').style.display = 'none';
  document.getElementById('backBtn').style.display = 'flex';
}

function goBack() { switchTab('booking'); }
function goHome()  { switchTab('booking'); }

buildDates();
