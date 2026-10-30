/* ══════════════════════════════════════
   personel.js — PersonelApp Mantığı
   ══════════════════════════════════════ */

/* ── VERİ ── */
let admin = {
  ad: 'Ahmet', soyad: 'Yılmaz',
  rol: 'İK Yöneticisi',
  email: 'admin@sirket.com',
  pwd: '123456'
};

let personeller = [
  { id:1, ad:'Elif',  soyad:'Demir',  email:'elif@sirket.com',  tel:'0532 111 11 11', dept:'İnsan Kaynakları',    poz:'İK Uzmanı',         tarih:'2022-03-15', izinHak:14 },
  { id:2, ad:'Burak', soyad:'Şahin',  email:'burak@sirket.com', tel:'0533 222 22 22', dept:'Yazılım Geliştirme', poz:'Senior Developer',   tarih:'2021-06-01', izinHak:20 },
  { id:3, ad:'Selin', soyad:'Arslan', email:'selin@sirket.com', tel:'0535 333 33 33', dept:'Pazarlama',           poz:'Pazarlama Uzmanı',   tarih:'2023-01-10', izinHak:14 },
];

let izinler = [
  { id:1, personelId:2, tur:'Yıllık İzin',   bas:'2025-07-01', bit:'2025-07-10', gun:8, durum:'Onaylandı',  acik:'Yaz tatili' },
  { id:2, personelId:3, tur:'Hastalık İzni',  bas:'2025-05-20', bit:'2025-05-22', gun:2, durum:'Onaylandı',  acik:'' },
  { id:3, personelId:1, tur:'Mazeret İzni',   bas:'2025-06-05', bit:'2025-06-05', gun:1, durum:'Beklemede',  acik:'Aile toplantısı' },
];

let nextPId = 4, nextIId = 4;
const refMap = {}; /* referansKodu -> izin.id */

const pageTitles = {
  dashboard:       'Genel Bakış',
  personel:        'Personel Yönetimi',
  'personel-ekle': 'Yeni Personel Ekle',
  'izin-talep':    'İzin Talebi Oluştur',
  izinler:         'İzin Talepleri',
  raporlar:        'Raporlar & Analiz'
};
const pageSubs = {
  dashboard:       'Sistem özeti',
  personel:        'Tüm çalışanlar',
  'personel-ekle': 'Sisteme yeni kayıt',
  'izin-talep':    'Talep formu',
  izinler:         'Tüm izin kayıtları',
  raporlar:        'İstatistik ve grafikler'
};

/* ── YARDIMCI ── */
function initials(p)          { return (p.ad[0]||'') + (p.soyad[0]||''); }
function getInitials(ad,soyad){ return (ad[0]||'').toUpperCase() + (soyad[0]||'').toUpperCase(); }
function calcGun(a,b)         { return Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1); }

function badgeHTML(d) {
  if (d === 'Onaylandı')  return '<span class="badge badge-green">Onaylandı</span>';
  if (d === 'Beklemede')  return '<span class="badge badge-amber">Beklemede</span>';
  if (d === 'Reddedildi') return '<span class="badge badge-red">Reddedildi</span>';
  return '<span class="badge badge-gray">' + d + '</span>';
}

function showToast(id) {
  const t = document.getElementById(id);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── ADMİN UI ── */
function updateAdminUI() {
  const full = admin.ad + ' ' + admin.soyad;
  document.getElementById('sb-avatar').textContent        = getInitials(admin.ad, admin.soyad);
  document.getElementById('sb-name').textContent          = full;
  document.getElementById('sb-role').textContent          = admin.rol;
  document.getElementById('topbar-username').textContent  = full;
}

/* ── GİRİŞ / ÇIKIŞ ── */
function doLogin() {
  const e = document.getElementById('login-email').value.trim();
  const p = document.getElementById('login-pass').value;
  if (e === admin.email && p === admin.pwd) {
    document.getElementById('login-email').value = '';
    document.getElementById('login-pass').value  = '';
    document.getElementById('login-err').style.display = 'none';
    document.getElementById('s-login').classList.remove('active');
    document.getElementById('s-main').classList.add('active');
    updateAdminUI();
    refreshDash();
    renderPersonel();
    fillPersonelSelect();
  } else {
    const err = document.getElementById('login-err');
    err.style.display = 'block';
    err.animate(
      [{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
      { duration: 300, iterations: 2 }
    );
  }
}

function doLogout() {
  document.getElementById('s-main').classList.remove('active');
  document.getElementById('s-login').classList.add('active');
}

/* ── SAYFA NAVİGASYONU ── */
function showPage(page) {
  document.querySelectorAll('.inner-screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('p-' + page)?.classList.add('active');

  const navMap = {
    dashboard:       'dashboard',
    personel:        'personel',
    'personel-ekle': 'personel',
    'izin-talep':    'izin-talep',
    izinler:         'izinler',
    raporlar:        'raporlar'
  };
  document.querySelector('[data-page="' + (navMap[page] || page) + '"]')?.classList.add('active');

  document.getElementById('topbar-title').textContent = pageTitles[page] || '';
  document.getElementById('topbar-sub').innerHTML =
    (pageSubs[page] || '') + (page === 'dashboard'
      ? ' — Hoş geldiniz, <span id="topbar-username">' + admin.ad + ' ' + admin.soyad + '</span>'
      : '');

  if (page === 'personel')    renderPersonel();
  if (page === 'izin-talep') { fillPersonelSelect(); updateKalan(); }
  if (page === 'izinler')     renderIzin();
  if (page === 'raporlar')    renderRapor();
  if (page === 'dashboard')   refreshDash();
}

/* ── PERSONEL ── */
function renderPersonel(list) {
  const data = list || personeller;
  document.getElementById('personel-count').textContent = data.length + ' kayıt';
  const tb = document.getElementById('personel-table');
  if (!data.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="7"><i class="ti ti-user-off" style="font-size:24px;display:block;margin-bottom:6px"></i>Kayıt bulunamadı.</td></tr>';
    return;
  }
  tb.innerHTML = data.map(p => {
    const used  = izinler.filter(i => i.personelId === p.id && i.tur === 'Yıllık İzin' && i.durum === 'Onaylandı').reduce((s,i) => s+i.gun, 0);
    const kalan = p.izinHak - used;
    const kalanClr = kalan < 3 ? 'var(--red)' : kalan < 6 ? 'var(--amber)' : 'var(--green)';
    return `<tr style="cursor:pointer" onclick="openPDrawer(${p.id})">
      <td class="td-primary"><span class="av">${initials(p)}</span>${p.ad} ${p.soyad}</td>
      <td>${p.dept}</td>
      <td style="color:var(--text3)">${p.poz}</td>
      <td style="color:var(--text3)">${p.tarih}</td>
      <td style="text-align:center;font-weight:700;color:${kalanClr}">${kalan} <span style="font-size:11px;color:var(--text3);font-weight:400">/ ${p.izinHak}</span></td>
      <td><span class="badge badge-green">Aktif</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openPDrawer(${p.id})"><i class="ti ti-eye" style="font-size:13px"></i></button></td>
    </tr>`;
  }).join('');
}

function filterPersonel() {
  const q = document.getElementById('s-personel').value.toLowerCase();
  renderPersonel(personeller.filter(p =>
    (p.ad + ' ' + p.soyad + p.dept + p.poz).toLowerCase().includes(q)
  ));
}

function addPersonel() {
  const ad    = document.getElementById('p-ad').value.trim();
  const soyad = document.getElementById('p-soyad').value.trim();
  if (!ad || !soyad) { alert('Ad ve soyad zorunludur.'); return; }
  personeller.push({
    id: nextPId++, ad, soyad,
    email:   document.getElementById('p-email').value,
    tel:     document.getElementById('p-tel').value,
    dept:    document.getElementById('p-dept').value,
    poz:     document.getElementById('p-poz').value,
    tarih:   document.getElementById('p-tarih').value,
    izinHak: parseInt(document.getElementById('p-izin').value) || 14
  });
  ['p-ad','p-soyad','p-email','p-tel','p-poz'].forEach(id => document.getElementById(id).value = '');
  showPage('personel');
  showToast('t-personel');
  refreshDash();
}

/* ── İZİN ── */
function fillPersonelSelect() {
  document.getElementById('it-personel').innerHTML =
    personeller.map(p => `<option value="${p.id}">${p.ad} ${p.soyad}</option>`).join('');
}

function updateKalan() {
  const id = parseInt(document.getElementById('it-personel').value);
  const p  = personeller.find(x => x.id === id);
  if (!p) { document.getElementById('it-kalan').textContent = '—'; return; }
  const used  = izinler
    .filter(i => i.personelId === id && i.tur === 'Yıllık İzin' && i.durum === 'Onaylandı')
    .reduce((s, i) => s + i.gun, 0);
  const kalan = p.izinHak - used;
  const el    = document.getElementById('it-kalan');
  el.textContent = kalan;
  el.style.color = kalan < 3 ? 'var(--red)' : kalan < 7 ? 'var(--amber)' : 'var(--green)';
}

function addIzin() {
  const pid = parseInt(document.getElementById('it-personel').value);
  const bas = document.getElementById('it-bas').value;
  const bit = document.getElementById('it-bit').value;
  if (!bas || !bit || !pid) { alert('Lütfen tüm alanları doldurun.'); return; }
  const newId = nextIId++;
  const ref   = generateRef();
  izinler.push({
    id: newId, personelId: pid,
    tur:   document.getElementById('it-tur').value,
    bas, bit,
    gun:   calcGun(bas, bit),
    durum: document.getElementById('it-durum').value,
    acik:  document.getElementById('it-acik').value,
    ref:   ref
  });
  refMap[ref] = newId;
  document.getElementById('it-acik').value = '';
  showPage('izinler');
  showToast('t-izin');
  refreshDash();
}

function renderIzin(list) {
  const data = list || izinler;
  const tb   = document.getElementById('izin-table');
  if (!data.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="8"><i class="ti ti-calendar-off" style="font-size:24px;display:block;margin-bottom:6px"></i>Kayıt bulunamadı.</td></tr>';
    return;
  }
  tb.innerHTML = data.map(i => {
    const p = i.personelId ? personeller.find(x => x.id === i.personelId) : null;
    const ad = p ? `<span class="av">${initials(p)}</span>${p.ad} ${p.soyad}` :
               i.epAd ? `<span class="av" style="background:linear-gradient(135deg,var(--amber),#fb923c)">${i.epAd.split(' ').map(w=>w[0]).join('').slice(0,2)}</span>${i.epAd} <span class="badge badge-amber" style="font-size:10px;padding:1px 6px">Harici</span>` : '—';
    const refCell = i.ref
      ? `<span class="ref-chip">${i.ref}</span>`
      : `<span class="ref-none">—</span>`;
    return `<tr>
      <td class="td-primary">${ad}</td>
      <td><span class="badge badge-blue">${i.tur}</span></td>
      <td style="color:var(--text3)">${i.bas}</td>
      <td style="color:var(--text3)">${i.bit}</td>
      <td style="text-align:center;font-weight:600;color:var(--text)">${i.gun} gün</td>
      <td>${refCell}</td>
      <td>${badgeHTML(i.durum)}</td>
      <td style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="openDrawer(${i.id})" title="Detayları görüntüle"><i class="ti ti-eye" style="font-size:13px"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="toggleDurum(${i.id})" title="Durumu değiştir"><i class="ti ti-refresh" style="font-size:12px"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function filterIzin() {
  const q = (document.getElementById('s-izin').value || '').toLowerCase();
  const f = document.getElementById('f-izin').value;
  renderIzin(izinler.filter(i => {
    const p = personeller.find(x => x.id === i.personelId);
    return (p ? p.ad + ' ' + p.soyad + i.tur : '').toLowerCase().includes(q) && (!f || i.durum === f);
  }));
}

function toggleDurum(id) {
  const i = izinler.find(x => x.id === id);
  if (!i) return;
  const cycle = ['Beklemede', 'Onaylandı', 'Reddedildi'];
  i.durum = cycle[(cycle.indexOf(i.durum) + 1) % 3];
  filterIzin();
  refreshDash();
}

/* ── PANEL ── */
function refreshDash() {
  const pending = izinler.filter(i => i.durum === 'Beklemede').length;
  document.getElementById('d-total').textContent    = personeller.length;
  document.getElementById('d-pending').textContent  = pending;
  document.getElementById('d-approved').textContent = izinler.filter(i => i.durum === 'Onaylandı').length;
  document.getElementById('d-rejected').textContent = izinler.filter(i => i.durum === 'Reddedildi').length;
  const badge = document.getElementById('badge-pending');
  badge.textContent    = pending;
  badge.style.display  = pending ? '' : 'none';

  const tb   = document.getElementById('d-table');
  const last = [...izinler].reverse().slice(0, 5);
  if (!last.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="4"><i class="ti ti-inbox" style="font-size:24px;display:block;margin-bottom:6px"></i>Henüz izin talebi yok.</td></tr>';
    return;
  }
  tb.innerHTML = last.map(i => {
    const p = personeller.find(x => x.id === i.personelId);
    return `<tr>
      <td class="td-primary">${p ? `<span class="av">${initials(p)}</span>${p.ad} ${p.soyad}` : '—'}</td>
      <td>${i.tur}</td>
      <td style="color:var(--text3)">${i.bas}</td>
      <td>${badgeHTML(i.durum)}</td>
    </tr>`;
  }).join('');
}

/* ── RAPORLAR ── */
function renderRapor() {
  const depts  = [...new Set(personeller.map(p => p.dept))];
  const clss   = ['c1','c2','c3','c4','c5'];
  const counts = depts.map(d =>
    izinler.filter(i => { const p = personeller.find(x => x.id === i.personelId); return p && p.dept === d; }).length
  );
  const maxC = Math.max(1, ...counts);

  document.getElementById('dept-bars').innerHTML = depts.length
    ? depts.map((d, i) => `
        <div class="bar-row">
          <div class="bar-label" title="${d}">${d}</div>
          <div class="bar-track"><div class="bar-fill ${clss[i % 5]}" style="width:0%" data-w="${Math.round(counts[i] / maxC * 100)}"></div></div>
          <div class="bar-val">${counts[i]}</div>
        </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;text-align:center;padding:1rem">Veri yok.</div>';

  setTimeout(() => {
    document.querySelectorAll('.bar-fill[data-w]').forEach(el => { el.style.width = el.dataset.w + '%'; });
  }, 50);

  const turler    = ['Yıllık İzin','Hastalık İzni','Mazeret İzni','Ücretsiz İzin'];
  const turColors = ['#6c8fff','#34d399','#fbbf24','#f87171'];
  const turCounts = turler.map(t => izinler.filter(i => i.tur === t).length);
  const total     = turCounts.reduce((a, b) => a + b, 0) || 1;
  let s = 0, paths = '';
  turCounts.forEach((c, i) => {
    const pct = c / total;
    if (pct === 0) return;
    const a1 = s * 2 * Math.PI - Math.PI / 2;
    const a2 = (s + pct) * 2 * Math.PI - Math.PI / 2;
    const x1 = 50 + 42 * Math.cos(a1), y1 = 50 + 42 * Math.sin(a1);
    const x2 = 50 + 42 * Math.cos(a2), y2 = 50 + 42 * Math.sin(a2);
    paths += `<path d="M50,50 L${x1.toFixed(1)},${y1.toFixed(1)} A42,42 0 ${pct > .5 ? 1 : 0},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${turColors[i]}" opacity=".9"/>`;
    s += pct;
  });
  document.getElementById('pie-svg').innerHTML =
    `<circle cx="50" cy="50" r="42" fill="#1a1e28"/>` +
    (paths || `<circle cx="50" cy="50" r="42" fill="#222739"/>`) +
    `<circle cx="50" cy="50" r="24" fill="#13161e"/>`;
  document.getElementById('pie-legend').innerHTML = turler.map((t, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${turColors[i]}"></div>
      ${t}<div class="legend-val">${turCounts[i]}</div>
    </div>`).join('');

  const tb = document.getElementById('rapor-table');
  if (!personeller.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="6">Veri yok.</td></tr>';
    return;
  }
  tb.innerHTML = personeller.map(p => {
    const used  = izinler
      .filter(i => i.personelId === p.id && i.tur === 'Yıllık İzin' && i.durum === 'Onaylandı')
      .reduce((s, i) => s + i.gun, 0);
    const kalan = p.izinHak - used;
    const pct   = Math.round(used / p.izinHak * 100);
    const bc    = pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--amber)' : 'var(--accent)';
    return `<tr>
      <td class="td-primary"><span class="av">${initials(p)}</span>${p.ad} ${p.soyad}</td>
      <td style="color:var(--text3)">${p.dept}</td>
      <td style="text-align:center;font-weight:600;color:var(--text)">${p.izinHak}</td>
      <td style="text-align:center;color:var(--amber)">${used}</td>
      <td style="text-align:center;font-weight:600;color:${kalan < 3 ? 'var(--red)' : kalan < 5 ? 'var(--amber)' : 'var(--green)'}">${kalan}</td>
      <td style="min-width:100px">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="bar-track" style="height:5px;flex:1"><div class="bar-fill" style="width:${pct}%;background:${bc}"></div></div>
          <span style="font-size:11px;color:var(--text3)">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── PROFİL MODAL ── */
function openProfileModal() {
  document.getElementById('m-ad').value    = admin.ad;
  document.getElementById('m-soyad').value = admin.soyad;
  document.getElementById('m-rol').value   = admin.rol;
  document.getElementById('m-email').value = admin.email;
  document.getElementById('m-pwd1').value  = '';
  document.getElementById('m-pwd2').value  = '';
  document.getElementById('pwd-bar').style.width      = '0';
  document.getElementById('pwd-bar').style.background = 'var(--bg4)';
  document.getElementById('pwd-hint').textContent     = '';
  updatePreview();
  document.getElementById('profile-modal').classList.add('open');
}

function closeProfileModal(e) {
  if (e && e.target !== document.getElementById('profile-modal')) return;
  document.getElementById('profile-modal').classList.remove('open');
}

function updatePreview() {
  const ad    = document.getElementById('m-ad').value    || admin.ad;
  const soyad = document.getElementById('m-soyad').value || admin.soyad;
  document.getElementById('m-preview-name').textContent  = ad + ' ' + soyad;
  document.getElementById('m-preview-role').textContent  = document.getElementById('m-rol').value   || admin.rol;
  document.getElementById('m-preview-email').textContent = document.getElementById('m-email').value || admin.email;
  document.getElementById('m-avatar').textContent        = getInitials(ad, soyad);
}

function checkPwd() {
  const v    = document.getElementById('m-pwd1').value;
  const bar  = document.getElementById('pwd-bar');
  const hint = document.getElementById('pwd-hint');
  if (!v) { bar.style.width = '0'; hint.textContent = ''; return; }
  bar.style.width = '100%';
  if (v.length < 4)      { bar.style.background = 'var(--red)';   hint.style.color = 'var(--red)';   hint.textContent = 'Çok kısa'; }
  else if (v.length < 7) { bar.style.background = 'var(--amber)'; hint.style.color = 'var(--amber)'; hint.textContent = 'Orta güçlük'; }
  else                   { bar.style.background = 'var(--green)'; hint.style.color = 'var(--green)'; hint.textContent = 'Güçlü şifre'; }
}

function saveProfile() {
  const ad    = document.getElementById('m-ad').value.trim();
  const soyad = document.getElementById('m-soyad').value.trim();
  if (!ad || !soyad) { alert('Ad ve soyad zorunludur.'); return; }
  const pwd1 = document.getElementById('m-pwd1').value;
  const pwd2 = document.getElementById('m-pwd2').value;
  if (pwd1) {
    if (pwd1.length < 6)  { alert('Şifre en az 6 karakter olmalıdır.'); return; }
    if (pwd1 !== pwd2)    { alert('Şifreler eşleşmiyor.'); return; }
    admin.pwd = pwd1;
  }
  admin.ad    = ad;
  admin.soyad = soyad;
  admin.rol   = document.getElementById('m-rol').value   || admin.rol;
  admin.email = document.getElementById('m-email').value || admin.email;
  updateAdminUI();
  document.getElementById('profile-modal').classList.remove('open');
}

/* ── BAŞLANGIÇ ── */
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('p-tarih').value = today;
  document.getElementById('it-bas').value  = today;
  document.getElementById('it-bit').value  = today;
  document.getElementById('topbar-sub').innerHTML =
    'Hoş geldiniz, <span id="topbar-username">' + admin.ad + ' ' + admin.soyad + '</span>';
});

/* ══════════════════════════════════════
   PERSONEL İZİN TALEBİ PANELİ
   ══════════════════════════════════════ */

const epTurBilgi = {
  'Yıllık İzin':   'Yıllık izin kullanımı için öncelikle yöneticinizin onayı gereklidir. Kalan izin haklarınızı İK departmanından öğrenebilirsiniz.',
  'Hastalık İzni': 'Hastalık izninde, izin süresine bağlı olarak doktor raporu ibraz etmeniz gerekebilir (genellikle 2 gün ve üzeri için).',
  'Mazeret İzni':  'Mazeret izni; resmi işlemler, sağlık kontrolü gibi zorunlu durumlar için kullanılır. Belgelendirme istenebilir.',
  'Ücretsiz İzin': 'Ücretsiz izin döneminde maaş ve yan haklar askıya alınır. Detaylar için İK ile görüşmeniz önerilir.',
  'Evlilik İzni':  'Yasal evlilik iznine hak kazanmak için nikah cüzdanı suretini İK departmanıyla paylaşmanız gerekmektedir.',
  'Doğum İzni':    'Doğum iznine ilişkin yasal süreler ve haklar için İK departmanıyla iletişime geçiniz.',
  'Yas İzni':      'Birinci derece akrabaların vefatı durumunda yas izni kullanılabilir. Belge istenebilir.',
  'Diğer':         'Seçilen izin türü için gerekli belgeler ve koşullar hakkında İK departmanından bilgi alabilirsiniz.',
};

function showEmployeeRequestPanel() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-employee').classList.add('active');
  // Adım 1'i sıfırla
  document.getElementById('ep-email').value = '';
  document.getElementById('ep-tel').value   = '';
  document.getElementById('ep-auth-result').style.display = 'none';
  document.querySelectorAll('.field-err').forEach(el => el.textContent = '');
  epGoTo(1);
}

/* showLoginScreen yukarıda tanımlandı */

/* ── KİMLİK DOĞRULAMA ── */
function epVerifyAndNext() {
  const email = document.getElementById('ep-email').value.trim().toLowerCase();
  const tel   = document.getElementById('ep-tel').value.trim().replace(/\s/g,'');

  document.getElementById('err-ep-email').textContent = '';
  document.getElementById('err-ep-tel').textContent   = '';

  if (!email) { document.getElementById('err-ep-email').textContent = 'E-posta zorunludur.'; return; }
  if (!tel)   { document.getElementById('err-ep-tel').textContent   = 'Telefon zorunludur.'; return; }

  // Personel listesinde ara
  const found = personeller.find(p =>
    p.email.toLowerCase() === email &&
    p.tel.replace(/\s/g,'') === tel
  );

  const resultEl = document.getElementById('ep-auth-result');
  resultEl.style.display = 'block';

  if (!found) {
    resultEl.innerHTML = `
      <div class="ep-fail-card">
        <i class="ti ti-alert-circle"></i>
        <div>
          <strong>Bilgiler Eşleşmedi</strong><br>
          Girdiğiniz e-posta ve telefon sistemde kayıtlı bir personele ait değil. 
          Bilgilerinizi kontrol edin veya İK ile iletişime geçin.
        </div>
      </div>`;
    // Gizli alanları temizle
    document.getElementById('ep-ad').value    = '';
    document.getElementById('ep-soyad').value = '';
    return;
  }

  // Gizli alanlara doldur
  document.getElementById('ep-ad').value    = found.ad;
  document.getElementById('ep-soyad').value = found.soyad;
  document.getElementById('ep-dept').value  = found.dept;
  document.getElementById('ep-poz').value   = found.poz;

  // Kalan izin
  const used  = izinler.filter(i => i.personelId === found.id && i.tur === 'Yıllık İzin' && i.durum === 'Onaylandı').reduce((s,i) => s+i.gun, 0);
  const kalan = found.izinHak - used;
  const kalanClr = kalan < 3 ? 'var(--red)' : kalan < 6 ? 'var(--amber)' : 'var(--green)';

  resultEl.innerHTML = `
    <div class="ep-verified-card">
      <div class="ep-verified-av">${initials(found)}</div>
      <div>
        <div class="ep-verified-name">${found.ad} ${found.soyad}</div>
        <div class="ep-verified-meta">${found.dept} · ${found.poz}</div>
        <div class="ep-verified-meta" style="margin-top:3px;color:var(--accent)">${found.email}</div>
      </div>
      <div class="ep-verified-badge">
        <span class="badge badge-green"><i class="ti ti-check"></i> Doğrulandı</span>
        <span style="font-size:11px;color:${kalanClr};margin-top:4px">${kalan} gün kalan izin</span>
      </div>
    </div>`;

  // Kısa gecikme sonrası adım 2'ye geç
  setTimeout(() => { epGoTo(2); document.querySelector('.ep-card').scrollIntoView({behavior:'smooth',block:'start'}); }, 800);
}

/* Adım geçişleri */
function epGoTo(step) {
  document.querySelectorAll('.ep-step-content').forEach(c => c.classList.remove('active'));
  document.getElementById('ep-step-' + step)?.classList.add('active');

  document.querySelectorAll('.ep-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < step)  el.classList.add('done');
    if (i + 1 === step) el.classList.add('active');
  });
  document.querySelectorAll('.ep-step-line').forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });
}

function epNext(current) {
  if (!epValidate(current)) return;
  if (current === 2) buildEpSummary();
  epGoTo(current + 1);
  document.querySelector('.ep-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function epPrev(current) {
  epGoTo(current - 1);
  document.querySelector('.ep-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Validasyon */
function epClearErr(id) { document.getElementById('err-' + id).textContent = ''; }
function epSetErr(id, msg) { document.getElementById('err-' + id).textContent = msg; }

function epValidate(step) {
  let ok = true;
  if (step === 1) {
    // Step 1 doğrulaması epVerifyAndNext içinde yapılır
    ok = !!document.getElementById('ep-ad').value; // hidden alan doluysa geçti
    if (!ok) { epSetErr('ep-email', 'Lütfen önce kimlik doğrulaması yapın.'); }
  }
  if (step === 2) {
    const tur   = document.getElementById('ep-tur').value;
    const bas   = document.getElementById('ep-bas').value;
    const bit   = document.getElementById('ep-bit').value;
    const sebep = document.getElementById('ep-sebep').value.trim();
    epClearErr('ep-tur'); epClearErr('ep-bas'); epClearErr('ep-bit'); epClearErr('ep-sebep');
    if (!tur)   { epSetErr('ep-tur',   'İzin türü seçiniz.');           ok = false; }
    if (!bas)   { epSetErr('ep-bas',   'Başlangıç tarihi zorunludur.'); ok = false; }
    if (!bit)   { epSetErr('ep-bit',   'Bitiş tarihi zorunludur.');     ok = false; }
    if (bas && bit && bit < bas)
                { epSetErr('ep-bit',   'Bitiş tarihi başlangıçtan önce olamaz.'); ok = false; }
    if (!sebep) { epSetErr('ep-sebep', 'İzin sebebi zorunludur.');      ok = false; }
    if (sebep.length > 500) { epSetErr('ep-sebep', 'En fazla 500 karakter girebilirsiniz.'); ok = false; }
  }
  return ok;
}

/* İzin türü bilgi kutusu */
function updateEpTurInfo() {
  const tur  = document.getElementById('ep-tur').value;
  const box  = document.getElementById('ep-tur-info');
  if (tur && epTurBilgi[tur]) {
    box.innerHTML = `<i class="ti ti-info-circle"></i> ${epTurBilgi[tur]}`;
    box.style.display = 'flex';
  } else {
    box.style.display = 'none';
  }
}

/* Gün hesabı */
function calcEpGun() {
  const bas = document.getElementById('ep-bas').value;
  const bit = document.getElementById('ep-bit').value;
  if (!bas || !bit) return;
  const gun = Math.max(0, Math.round((new Date(bit) - new Date(bas)) / 86400000) + 1);
  const box = document.getElementById('ep-gun-box');
  if (gun > 0) {
    document.getElementById('ep-gun-val').textContent = gun;
    box.style.display = 'flex';
  } else {
    box.style.display = 'none';
  }
}

/* Sebep karakter sayacı */
document.addEventListener('DOMContentLoaded', () => {
  const sebep = document.getElementById('ep-sebep');
  if (sebep) {
    sebep.addEventListener('input', () => {
      document.getElementById('ep-sebep-count').textContent = sebep.value.length;
    });
  }
  const today = new Date().toISOString().split('T')[0];
  const epBas = document.getElementById('ep-bas');
  const epBit = document.getElementById('ep-bit');
  if (epBas) epBas.value = today;
  if (epBit) epBit.value = today;
});

/* Özet oluştur */
function buildEpSummary() {
  const ad       = document.getElementById('ep-ad').value.trim();
  const soyad    = document.getElementById('ep-soyad').value.trim();
  const email    = document.getElementById('ep-email').value.trim();
  const tel      = document.getElementById('ep-tel').value.trim();
  const dept     = document.getElementById('ep-dept').value;
  const poz      = document.getElementById('ep-poz').value.trim();
  const yonetici = document.getElementById('ep-yonetici').value.trim();
  const sirket   = document.getElementById('ep-sirket').value.trim();
  const tur      = document.getElementById('ep-tur').value;
  const aciliyet = document.getElementById('ep-aciliyet').value;
  const bas      = document.getElementById('ep-bas').value;
  const bit      = document.getElementById('ep-bit').value;
  const sebep    = document.getElementById('ep-sebep').value.trim();
  const vekil    = document.getElementById('ep-vekil').value.trim();
  const not_     = document.getElementById('ep-not').value.trim();
  const gun      = bas && bit ? Math.max(1, Math.round((new Date(bit) - new Date(bas)) / 86400000) + 1) : '—';

  const aciliyetColor = aciliyet === 'Acil' ? 'color:var(--red)' : aciliyet === 'Planlanmış' ? 'color:var(--green)' : '';

  document.getElementById('ep-summary').innerHTML = `
    <div class="ep-summary-section">
      <div class="ep-summary-section-title"><i class="ti ti-user"></i> Kişisel Bilgiler</div>
      <div class="ep-summary-grid">
        <div class="ep-summary-row"><div class="ep-summary-key">Ad Soyad</div><div class="ep-summary-val">${ad} ${soyad}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">E-posta</div><div class="ep-summary-val">${email}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Telefon</div><div class="ep-summary-val">${tel || '—'}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Departman</div><div class="ep-summary-val">${dept}</div></div>
        ${poz      ? `<div class="ep-summary-row"><div class="ep-summary-key">Pozisyon</div><div class="ep-summary-val">${poz}</div></div>` : ''}
        ${yonetici ? `<div class="ep-summary-row"><div class="ep-summary-key">Yönetici</div><div class="ep-summary-val">${yonetici}</div></div>` : ''}
        ${sirket   ? `<div class="ep-summary-row"><div class="ep-summary-key">Birim</div><div class="ep-summary-val">${sirket}</div></div>` : ''}
      </div>
    </div>
    <div class="ep-summary-section">
      <div class="ep-summary-section-title"><i class="ti ti-calendar"></i> İzin Detayları</div>
      <div class="ep-summary-grid">
        <div class="ep-summary-row"><div class="ep-summary-key">İzin Türü</div><div class="ep-summary-val accent">${tur}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Aciliyet</div><div class="ep-summary-val" style="${aciliyetColor}">${aciliyet}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Başlangıç</div><div class="ep-summary-val">${bas}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Bitiş</div><div class="ep-summary-val">${bit}</div></div>
        <div class="ep-summary-row"><div class="ep-summary-key">Toplam Süre</div><div class="ep-summary-val green">${gun} gün</div></div>
        ${vekil ? `<div class="ep-summary-row"><div class="ep-summary-key">Vekil</div><div class="ep-summary-val">${vekil}</div></div>` : ''}
      </div>
    </div>
    <div class="ep-summary-section">
      <div class="ep-summary-section-title"><i class="ti ti-notes"></i> Açıklamalar</div>
      <div class="ep-summary-grid">
        <div class="ep-summary-row full"><div class="ep-summary-key">İzin Sebebi</div><div class="ep-summary-val" style="line-height:1.6">${sebep}</div></div>
        ${not_ ? `<div class="ep-summary-row full"><div class="ep-summary-key">Ek Not</div><div class="ep-summary-val" style="line-height:1.6">${not_}</div></div>` : ''}
      </div>
    </div>`;
}

/* ── UNIQUE REFERANS KODU ── */
function generateRef() {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışıklık yaratan 0/O/1/I çıkarıldı
  const seg1   = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const seg2   = Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  const candidate = 'EP-' + seg1 + '-' + seg2;
  return Object.values(refMap).includes(candidate) ? generateRef() : candidate; // çakışma yoksa döndür
}

/* ── DURUM SORGULAMA ── */
function showStatusPanel() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-status').classList.add('active');
  resetStatusQuery();
}

function showLoginScreen() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-login').classList.add('active');
}

function goToStatusFromSuccess() {
  const ref = document.getElementById('ep-ref-no').textContent;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s-status').classList.add('active');
  document.getElementById('st-ref-input').value = ref;
  document.getElementById('status-form-area').style.display = 'block';
  document.getElementById('status-result').style.display = 'none';
  document.getElementById('st-err').textContent = '';
  queryStatus();
}

function resetStatusQuery() {
  document.getElementById('st-ref-input').value = '';
  document.getElementById('st-err').textContent = '';
  document.getElementById('status-form-area').style.display = 'block';
  document.getElementById('status-result').style.display    = 'none';
}

function queryStatus() {
  const raw = document.getElementById('st-ref-input').value.trim().toUpperCase();
  document.getElementById('st-err').textContent = '';
  if (!raw) { document.getElementById('st-err').textContent = 'Lütfen referans kodu giriniz.'; return; }

  const izinId = refMap[raw];
  const izin   = izinId != null ? izinler.find(i => i.id === izinId) : null;

  document.getElementById('status-form-area').style.display = 'none';
  document.getElementById('status-result').style.display    = 'block';

  if (!izin) {
    document.getElementById('st-result-inner').innerHTML = `
      <div class="st-not-found">
        <div class="st-not-found-icon"><i class="ti ti-search-off"></i></div>
        <h4>Talep Bulunamadı</h4>
        <p><strong style="color:var(--text2)">${raw}</strong> referans koduna ait bir izin talebi sistemde kayıtlı değil.</p>
        <p>Kodu doğru girdiğinizden emin olun veya yeni sorgu yapın.</p>
      </div>`;
    return;
  }

  const ad = izin.epAd || (()=>{
    const p = personeller.find(x => x.id === izin.personelId);
    return p ? p.ad + ' ' + p.soyad : '—';
  })();
  const dept = (()=>{
    const p = personeller.find(x => x.id === izin.personelId);
    return p ? p.dept : '—';
  })();
  const avInit = ad.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();

  const durumConfig = {
    'Beklemede':  { cls:'badge-amber', icon:'ti-clock',        iconBg:'var(--amber-bg)',  iconClr:'var(--amber)', label:'İnceleme Bekleniyor' },
    'Onaylandı':  { cls:'badge-green', icon:'ti-circle-check', iconBg:'var(--green-bg)', iconClr:'var(--green)',  label:'Onaylandı' },
    'Reddedildi': { cls:'badge-red',   icon:'ti-circle-x',     iconBg:'var(--red-bg)',   iconClr:'var(--red)',    label:'Reddedildi' },
  };
  const dc = durumConfig[izin.durum] || durumConfig['Beklemede'];

  document.getElementById('st-result-inner').innerHTML = `
    <div class="st-result-header">
      <div class="st-result-avatar">${avInit}</div>
      <div>
        <div class="st-result-name">${ad}</div>
        <div class="st-result-dept">${dept !== '—' ? dept : izin.tur}</div>
        <div class="st-result-ref">${raw}</div>
      </div>
      <span class="badge ${dc.cls}" style="margin-left:auto">${izin.durum}</span>
    </div>
    <div class="st-result-body">
      <div class="st-status-banner">
        <div class="st-status-icon" style="background:${dc.iconBg}">
          <i class="ti ${dc.icon}" style="color:${dc.iconClr}"></i>
        </div>
        <div>
          <div class="st-status-label">Talep Durumu</div>
          <div class="st-status-val" style="color:${dc.iconClr}">${dc.label}</div>
        </div>
      </div>
      <div class="st-details-grid">
        <div class="st-detail-cell"><div class="st-detail-key">İzin Türü</div><div class="st-detail-val">${izin.tur}</div></div>
        <div class="st-detail-cell"><div class="st-detail-key">Süre</div><div class="st-detail-val">${izin.gun} gün</div></div>
        <div class="st-detail-cell"><div class="st-detail-key">Başlangıç</div><div class="st-detail-val">${izin.bas}</div></div>
        <div class="st-detail-cell"><div class="st-detail-key">Bitiş</div><div class="st-detail-val">${izin.bit}</div></div>
      </div>
      ${izin.acik ? `<div class="st-acik-cell"><div class="st-detail-key">Açıklama</div><div class="st-detail-val">${izin.acik}</div></div>` : ''}
    </div>`;
}

/* Gönder */
function submitEpRequest() {
  const confirmed = document.getElementById('ep-confirm').checked;
  document.getElementById('err-ep-confirm').textContent = '';
  if (!confirmed) {
    document.getElementById('err-ep-confirm').textContent = 'Lütfen onay kutucuğunu işaretleyiniz.';
    return;
  }

  /* Admin paneline de ekle — doğrulanmış kişiyi eşleştir */
  const pid = personeller.find(p =>
    p.email.toLowerCase() === document.getElementById('ep-email').value.trim().toLowerCase() &&
    p.tel.replace(/\s/g,'') === document.getElementById('ep-tel').value.trim().replace(/\s/g,'')
  );
  const bas = document.getElementById('ep-bas').value;
  const bit = document.getElementById('ep-bit').value;
  izinler.push({
    id: nextIId++,
    personelId: pid ? pid.id : null,
    epAd:  document.getElementById('ep-ad').value.trim() + ' ' + document.getElementById('ep-soyad').value.trim(),
    tur:   document.getElementById('ep-tur').value,
    bas, bit,
    gun:   Math.max(1, Math.round((new Date(bit) - new Date(bas)) / 86400000) + 1),
    durum: 'Beklemede',
    acik:  document.getElementById('ep-sebep').value.trim(),
  });

  const ref = generateRef();
  refMap[ref] = izinler[izinler.length - 1].id;
  document.getElementById('ep-ref-no').textContent = ref;

  /* Adım noktalarını done yap */
  document.querySelectorAll('.ep-step').forEach(el => { el.classList.add('done'); el.classList.remove('active'); });
  document.querySelectorAll('.ep-step-line').forEach(el => el.classList.add('done'));

  document.querySelectorAll('.ep-step-content').forEach(c => c.classList.remove('active'));
  document.getElementById('ep-success').classList.add('active');
}

/* Sıfırla */
function epReset() {
  ['ep-ad','ep-soyad','ep-email','ep-tel','ep-poz','ep-yonetici','ep-sirket',
   'ep-vekil','ep-not','ep-sebep'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  ['ep-dept','ep-tur'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  document.getElementById('ep-aciliyet').value = 'Normal';
  document.getElementById('ep-confirm').checked = false;
  document.getElementById('ep-sebep-count').textContent = '0';
  document.getElementById('ep-tur-info').style.display = 'none';
  document.getElementById('ep-gun-box').style.display  = 'none';
  document.querySelectorAll('.field-err').forEach(el => el.textContent = '');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('ep-bas').value = today;
  document.getElementById('ep-bit').value = today;
  epGoTo(1);
}


/* ══════════════════════════════════════
   İZİN DETAY DRAWER
   ══════════════════════════════════════ */

function openDrawer(izinId) {
  const i = izinler.find(x => x.id === izinId);
  if (!i) return;

  const p    = i.personelId ? personeller.find(x => x.id === i.personelId) : null;
  const ad   = p ? p.ad + ' ' + p.soyad : (i.epAd || '—');
  const dept = p ? p.dept : '—';
  const poz  = p ? p.poz  : '—';
  const tel  = p ? p.tel  : '—';
  const email= p ? p.email: '—';

  // Ref kodu
  document.getElementById('dr-ref-label').textContent = i.ref || 'Referans kodu yok';

  // Durum config
  const dc = {
    'Beklemede':  { cls:'',        bg:'var(--amber-bg)',  clr:'var(--amber)', brd:'rgba(251,191,36,.25)',  icon:'ti-clock',        label:'İnceleme Bekleniyor' },
    'Onaylandı':  { cls:'green',   bg:'var(--green-bg)',  clr:'var(--green)', brd:'rgba(52,211,153,.25)',  icon:'ti-circle-check', label:'Onaylandı' },
    'Reddedildi': { cls:'red',     bg:'var(--red-bg)',    clr:'var(--red)',   brd:'rgba(248,113,113,.25)', icon:'ti-circle-x',     label:'Reddedildi' },
  }[i.durum] || { bg:'var(--glass)', clr:'var(--text2)', brd:'var(--glass-border)', icon:'ti-help', label:i.durum };

  const isHarici = !i.personelId && i.epAd;

  document.getElementById('drawer-body').innerHTML = `
    <div class="dr-status-box" style="background:${dc.bg};border-color:${dc.brd}">
      <div class="dr-status-icon" style="color:${dc.clr}"><i class="ti ${dc.icon}"></i></div>
      <div>
        <div style="font-size:10px;color:${dc.clr};text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:2px">Talep Durumu</div>
        <div style="font-family:'Syne',sans-serif;font-size:17px;font-weight:700;color:${dc.clr}">${dc.label}</div>
      </div>
    </div>

    <div class="dr-ref-box">
      <i class="ti ti-barcode" style="color:var(--accent);font-size:20px;flex-shrink:0"></i>
      ${i.ref
        ? `<div class="dr-ref-code">${i.ref}</div>
           <button class="btn btn-ghost btn-sm" onclick="regenRef(${i.id})" title="Yeni kod üret" style="flex-shrink:0">
             <i class="ti ti-refresh"></i> Yenile
           </button>`
        : `<div class="dr-ref-none">Bu talep için referans kodu yok</div>
           <button class="btn btn-accent btn-sm" onclick="regenRef(${i.id})" style="flex-shrink:0">
             <i class="ti ti-plus"></i> Kod Oluştur
           </button>`
      }
    </div>

    <div class="dr-section">
      <div class="dr-section-title"><i class="ti ti-user"></i> Personel Bilgileri ${isHarici ? '<span class="badge badge-amber" style="font-size:10px">Harici Talep</span>' : ''}</div>
      <div class="dr-grid">
        <div class="dr-field full"><div class="dr-key">Ad Soyad</div><div class="dr-val">${ad}</div></div>
        <div class="dr-field"><div class="dr-key">Departman</div><div class="dr-val muted">${dept}</div></div>
        <div class="dr-field"><div class="dr-key">Pozisyon</div><div class="dr-val muted">${poz}</div></div>
        <div class="dr-field"><div class="dr-key">E-posta</div><div class="dr-val muted">${email}</div></div>
        <div class="dr-field"><div class="dr-key">Telefon</div><div class="dr-val muted">${tel}</div></div>
      </div>
    </div>

    <div class="dr-divider"></div>

    <div class="dr-section">
      <div class="dr-section-title"><i class="ti ti-calendar"></i> İzin Bilgileri</div>
      <div class="dr-grid">
        <div class="dr-field full"><div class="dr-key">İzin Türü</div><div class="dr-val accent">${i.tur}</div></div>
        <div class="dr-field"><div class="dr-key">Başlangıç</div><div class="dr-val">${i.bas}</div></div>
        <div class="dr-field"><div class="dr-key">Bitiş</div><div class="dr-val">${i.bit}</div></div>
        <div class="dr-field"><div class="dr-key">Toplam Süre</div><div class="dr-val green">${i.gun} gün</div></div>
        <div class="dr-field"><div class="dr-key">Talep No</div><div class="dr-val muted">#${i.id}</div></div>
        ${i.aciliyet ? `<div class="dr-field"><div class="dr-key">Aciliyet</div><div class="dr-val ${i.aciliyet==='Acil'?'red':i.aciliyet==='Planlanmış'?'green':''}">${i.aciliyet}</div></div>` : ''}
        ${i.vekil    ? `<div class="dr-field full"><div class="dr-key">Görev Vekili</div><div class="dr-val muted">${i.vekil}</div></div>` : ''}
      </div>
    </div>

    ${i.acik ? `
    <div class="dr-divider"></div>
    <div class="dr-section">
      <div class="dr-section-title"><i class="ti ti-notes"></i> Açıklama & Notlar</div>
      <div class="dr-grid">
        <div class="dr-field full"><div class="dr-key">İzin Sebebi</div><div class="dr-val muted">${i.acik}</div></div>
        ${i.not_ ? `<div class="dr-field full"><div class="dr-key">Ek Not</div><div class="dr-val muted">${i.not_}</div></div>` : ''}
      </div>
    </div>` : ''}
  `;

  // Aksiyon butonları
  document.getElementById('drawer-body').insertAdjacentHTML('afterend', '');
  const actionsEl = document.querySelector('.drawer-actions');
  if (actionsEl) actionsEl.remove();
  document.getElementById('izin-drawer').insertAdjacentHTML('beforeend', `
    <div class="drawer-actions">
      <button class="btn btn-ghost btn-sm" onclick="toggleDurumDrawer(${i.id})">
        <i class="ti ti-refresh"></i> Durumu Değiştir
      </button>
      <button class="btn btn-ghost btn-sm" onclick="closeDrawer()" style="margin-left:auto">
        <i class="ti ti-x"></i> Kapat
      </button>
    </div>`);

  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('izin-drawer').classList.add('open');
  // Aktif drawer id kaydet
  document.getElementById('izin-drawer').dataset.activeId = izinId;
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('izin-drawer').classList.remove('open');
}

function toggleDurumDrawer(id) {
  toggleDurum(id);
  openDrawer(id); // drawer'ı güncelle
}

function regenRef(izinId) {
  const i = izinler.find(x => x.id === izinId);
  if (!i) return;
  // Eski kodu haritadan sil
  if (i.ref) delete refMap[i.ref];
  const newRef = generateRef();
  i.ref = newRef;
  refMap[newRef] = izinId;
  // Drawer'ı güncelle
  openDrawer(izinId);
  // Tabloyu güncelle
  filterIzin();
}


/* ══════════════════════════════════════
   PERSONEL DETAY DRAWER
   ══════════════════════════════════════ */

function openPDrawer(pId) {
  const p = personeller.find(x => x.id === pId);
  if (!p) return;

  document.getElementById('pdr-sub').textContent = p.dept + ' · ' + p.poz;

  // İzin istatistikleri
  const pIzinler   = izinler.filter(i => i.personelId === pId);
  const usedYillik = pIzinler.filter(i => i.tur === 'Yıllık İzin' && i.durum === 'Onaylandı').reduce((s,i)=>s+i.gun,0);
  const kalan      = p.izinHak - usedYillik;
  const bekleyen   = pIzinler.filter(i => i.durum === 'Beklemede').length;
  const kalanClr   = kalan < 3 ? 'var(--red)' : kalan < 6 ? 'var(--amber)' : 'var(--green)';

  // Geçmiş izin satırları
  const gecmisRows = pIzinler.length
    ? pIzinler.slice().reverse().map(i => `
        <div class="pdr-izin-row">
          <span class="badge badge-blue" style="flex-shrink:0">${i.tur}</span>
          <div class="pdr-izin-row-tur">${i.bas} → ${i.bit}</div>
          <div class="pdr-izin-row-gun">${i.gun} gün</div>
          ${(() => {
            if (i.ref) return `<span class="ref-chip" style="font-size:10px">${i.ref}</span>`;
            return '';
          })()}
          ${badgeHTML(i.durum)}
        </div>`).join('')
    : '<div style="color:var(--text3);font-size:13px;text-align:center;padding:1rem">Henüz izin talebi yok.</div>';

  document.getElementById('pdr-body').innerHTML = `
    <div class="pdr-hero">
      <div class="pdr-av">${initials(p)}</div>
      <div>
        <div class="pdr-name">${p.ad} ${p.soyad}</div>
        <div class="pdr-dept">${p.dept} · ${p.poz}</div>
        <div class="pdr-email">${p.email}</div>
      </div>
    </div>

    <div class="pdr-izin-strip">
      <div class="pdr-izin-cell">
        <div class="pdr-izin-num" style="color:var(--accent)">${p.izinHak}</div>
        <div class="pdr-izin-lbl">Toplam Hak</div>
      </div>
      <div class="pdr-izin-cell">
        <div class="pdr-izin-num" style="color:${kalanClr}">${kalan}</div>
        <div class="pdr-izin-lbl">Kalan Gün</div>
      </div>
      <div class="pdr-izin-cell">
        <div class="pdr-izin-num" style="color:var(--amber)">${bekleyen}</div>
        <div class="pdr-izin-lbl">Bekleyen</div>
      </div>
    </div>

    <div class="dr-section">
      <div class="dr-section-title"><i class="ti ti-id-badge"></i> Kişisel Bilgiler</div>
      <div class="dr-grid">
        <div class="dr-field"><div class="dr-key">Telefon</div><div class="dr-val muted">${p.tel || '—'}</div></div>
        <div class="dr-field"><div class="dr-key">Giriş Tarihi</div><div class="dr-val muted">${p.tarih}</div></div>
        <div class="dr-field full"><div class="dr-key">E-posta</div><div class="dr-val accent">${p.email}</div></div>
      </div>
    </div>

    <div class="dr-divider"></div>

    <div class="dr-section">
      <div class="dr-section-title"><i class="ti ti-calendar-stats"></i> İzin Geçmişi</div>
      ${gecmisRows}
    </div>
  `;

  document.getElementById('pdr-actions').innerHTML = `
    <button class="btn btn-accent btn-sm" onclick="closePDrawer();showPage('izin-talep');prefillIzinForPersonel(${p.id})">
      <i class="ti ti-calendar-plus"></i> İzin Talebi Oluştur
    </button>
    <button class="btn btn-ghost btn-sm" onclick="closePDrawer()" style="margin-left:auto">
      <i class="ti ti-x"></i> Kapat
    </button>
  `;

  document.getElementById('pdrawer-overlay').classList.add('open');
  document.getElementById('personel-drawer').classList.add('open');
}

function closePDrawer() {
  document.getElementById('pdrawer-overlay').classList.remove('open');
  document.getElementById('personel-drawer').classList.remove('open');
}

function prefillIzinForPersonel(pId) {
  fillPersonelSelect();
  const sel = document.getElementById('it-personel');
  for (let i = 0; i < sel.options.length; i++) {
    if (parseInt(sel.options[i].value) === pId) { sel.selectedIndex = i; break; }
  }
  updateKalan();
}
