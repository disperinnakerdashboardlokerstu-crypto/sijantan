/**
 * SI JANTAN - Front-end Logic (Progressive Disclosure Quick Replies)
 */

const WORKER_URL = "https://sijantan.disperinnakerdashboardlokerstu.workers.dev/";

let nikToken = null;
let chatToken = null;
let chatHistory = [];
let lastSelectedKey = null;

// Tracking Sub-Menu Inner yang sedang aktif & yang sudah diklik
let currentInnerOptions = [];
let clickedInnerIds = new Set();

// 1. DATABASE QUICK REPLIES (DIPERBARUI SECARA DINAMIS DARI WORKER, DENGAN FALLBACK LOKAL)
let QUICK_REPLIES_DATA = {
  jkk: {
    label: "1. Syarat & Cara Klaim JKK",
    skema: `**SKEMA PERLINDUNGAN JAMINAN KECELAKAAN KERJA (JKK):**

JKK memberikan perlindungan atas risiko kecelakaan saat berangkat, bekerja, hingga kembali ke rumah, serta penyakit akibat kerja. meliputi seluruh biaya pengobatan yang diperlukan dan transportasi medis.
- **STMB**: Santunan **Sementara Tidak Mampu Bekerja** (1 juta rupiah/bulan untuk 12 bulan pertama, 500 ribu/bulan berikutnya hingga dinyatakan **sembuh/cacat/meninggal** oleh dokter).
- **Cacat total/sebagian:** Santunan hingga **Rp56.000.000,-** (tergantung keparahan) + **STMB**
- **Meninggal Dunia:** Santunan **Rp70.000.000,-** + **Hak Beasiswa Anak**.`,
    inner: [
      {
        id: "jkk_dokumen",
        label: "📄 Syarat Dokumen JKK",
        text: `**PERSYARATAN DOKUMEN JKK:**
- Asli & Fotocopy E-KTP dan Kartu Keluarga (KK) Pekerja
- Kartu BPJS Ketenagakerjaan (dapat dicetak di kantor BPJS Ketenagakerjaan dengan E-KTP)
- Formulir Laporan Kecelakaan Kerja (LKK Tahap I & II)
- Kronologis Kejadian + Fotocopy E-KTP 2 orang saksi (contoh Kronologis bisa dilihat di Web Ini halaman Formulir Klaim)
- Surat Keterangan Dokter / RS yang merawat
- Laporan Kepolisian (khusus kecelakaan lalu lintas)
- Kwitansi Pengobatan & Perawatan RS (jika menggunakan biaya mandiri)`
      },
      {
        id: "jkk_alur",
        label: "🔄 Tata Cara / Alur JKK",
        text: `**TATA CARA / ALUR PENGAJUAN JKK:**
1. **Lapor Cepat (Wajib < 2x24 Jam):** Pekerja/Ahli Waris wajib melapor ke kantor BPJS Ketenagakerjaan setempat.
2. **Pengisian Form:** Lengkapi formulir LKK dan lampirkan bukti kronologis kecelakaan.
3. **Verifikasi:** Petugas BPJS akan memverifikasi keabsahan dokumen dan lokasi kejadian.
4. **Pencairan:** Santunan tunai/penggantian biaya medis ditransfer langsung ke rekening peserta atau ahli waris.`
      }
    ]
  },
  jkm: {
    label: "2. Syarat & Cara Klaim JKM",
    skema: `**SKEMA PERLINDUNGAN JAMINAN KEMATIAN (JKM):**

Diberikan kepada ahli waris peserta yang meninggal dunia bukan akibat kecelakaan kerja.
- **Masa Kepesertaan < 90 hari:** Biaya Pemakaman Rp10.000.000,-
- **Masa Kepesertaan >= 90 hari:** Total manfaat **Rp42.000.000,-**.
- **Beasiswa Anak:** Berhak diajukan jika masa kepesertaan/iur peserta minimal **3 tahun**.`,
    inner: [
      {
        id: "jkm_dokumen",
        label: "📄 Syarat Dokumen JKM",
        text: `**PERSYARATAN DOKUMEN JKM:**
- Asli & Fotocopy E-KTP dan Kartu Keluarga (KK) Pekerja & Ahli Waris
- Kartu BPJS Ketenagakerjaan asli
- Akte Kematian dari Disdukcapil / Surat Keterangan Kematian dari Kelurahan/Desa
- Surat Keterangan Ahli Waris dari Desa/Kelurahan setempat
- Buku Tabungan Ahli Waris`
      },
      {
        id: "jkm_alur",
        label: "🔄 Tata Cara / Alur JKM",
        text: `**TATA CARA / ALUR PENGAJUAN JKM:**
1. **Persiapan:** Ahli Waris mengurus Surat Keterangan Ahli Waris dan Akte Kematian.
2. **Penyerahan Berkas:** Datang ke Kantor BPJS Ketenagakerjaan membawa dokumen fisik asli dan fotocopy.
3. **Verifikasi Data:** Petugas melakukan wawancara dan pengecekan keabsahan ahli waris.
4. **Pencairan Manfaat:** Dana santunan Rp42 Juta ditransfer ke rekening ahli waris.`
      }
    ]
  },
  beasiswa: {
    label: "3. Syarat & Cara Klaim Beasiswa",
    skema: `**SKEMA BEASISWA ANAK:**

Bantuan pendidikan diberikan maksimal untuk **2 orang anak** hingga jenjang perguruan tinggi (total akumulasi hingga **Rp174 Juta**). Beasiswa diberikan jika orang tua (peserta) mengalami salah satu kondisi:
1. Peserta Meninggal Dunia akibat Kecelakaan Kerja (JKK).
2. Peserta Mengalami Cacat Total Tetap akibat Kecelakaan Kerja (JKK).
3. Peserta Meninggal Dunia Biasa (JKM) dengan masa iur minimal **3 tahun**.

**Besaran Beasiswa:**
- **TK-SD:** Rp1.500.000,-/tahun (maksimal 8 tahun)
- **SMP:** Rp2.000.000,-/tahun (maksimal 3 tahun)
- **SMA/SMK:** Rp3.000.000,-/tahun (maksimal 3 tahun)
- **Perguruan Tinggi (D3/S1):** Rp12.000.000,-/tahun (maksimal 5 tahun)

**Kriteria Anak Penerima:**
Berusia sekolah, belum menikah, belum bekerja, dan berusia di bawah 23 tahun.`,
    inner: [
      {
        id: "beasiswa_dokumen",
        label: "📄 Syarat Dokumen Beasiswa",
        text: `**PERSYARATAN DOKUMEN BEASISWA:**
- Formulir Pengajuan Beasiswa (disediakan di kantor BPJS Ketenagakerjaan)
- Surat Keterangan Masih Aktif Sekolah / Perguruan Tinggi dari lembaga pendidikan
- E-KTP Anak / Kartu Pelajar & Akte Kelahiran Anak
- Kartu Keluarga (KK) & Rapor / Kartu Hasil Studi (KHS) semester terakhir`
      },
      {
        id: "beasiswa_alur",
        label: "🔄 Tata Cara / Alur Beasiswa",
        text: `**TATA CARA / ALUR PENGAJUAN BEASISWA:**
1. **Verifikasi Kelayakan:** Pastikan status klaim JKK (cacat total/meninggal) atau JKM (masa iur 3 tahun) dari orang tua telah disetujui.
2. **Pengajuan Dokumen:** Serahkan berkas persyaratan anak ke kantor BPJS Ketenagakerjaan.
3. **Pencairan Tahunan:** Bantuan pendidikan diajukan dan dibayarkan secara berkala setiap tahun sesuai dengan jenjang pendidikan anak yang sedang ditempuh.`
      }
    ]
  }
};

// Turnstile Callbacks Global
window.onNikSuccess = function(token) { nikToken = token; };
window.onNikExpired = function() { nikToken = null; };
window.onChatSuccess = function(token) { chatToken = token; };
window.onChatExpired = function() { chatToken = null; };

// INISIALISASI EVENT LISTENER
document.addEventListener('DOMContentLoaded', () => {
  const btnCek = document.getElementById('btnCek');
  if (btnCek) btnCek.addEventListener('click', prosesCek);

  const nikInput = document.getElementById('nikInput');
  if (nikInput) {
    nikInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    nikInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') prosesCek();
    });
  }

  const btnToggleChatFloating = document.getElementById('btnToggleChatFloating');
  if (btnToggleChatFloating) btnToggleChatFloating.addEventListener('click', toggleChat);

  const btnCloseModal = document.getElementById('btnCloseModal');
  if (btnCloseModal) btnCloseModal.addEventListener('click', toggleChat);

  const btnKirimChat = document.getElementById('btnKirimChat');
  if (btnKirimChat) btnKirimChat.addEventListener('click', kirimChat);

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') kirimChat();
    });
  }

  loadManfaat();
  loadSocialLinks();
  loadQuickReplies();
});

function resetTurnstile(widgetId) {
  if (window.turnstile) {
    try {
      const elem = document.getElementById(widgetId);
      if (elem) window.turnstile.reset(elem);
    } catch (e) {
      window.turnstile.reset();
    }
  }
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseMarkdown(text) {
  if (!text) return '';
  let str = escapeHtml(text);
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');

  const lines = str.split('\n');
  let formattedHtml = '';
  let inList = false;

  lines.forEach(line => {
    let trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        formattedHtml += '<ul>';
        inList = true;
      }
      formattedHtml += `<li>${trimmed.substring(2)}</li>`;
    } else {
      if (inList) {
        formattedHtml += '</ul>';
        inList = false;
      }
      if (trimmed !== '') {
        formattedHtml += `<p>${line}</p>`;
      }
    }
  });

  if (inList) formattedHtml += '</ul>';
  return formattedHtml;
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const toastClass = type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : 'toast-info';
  toast.className = `toast-item ${toastClass}`;
  toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// MANFAAT DINAMIS
async function loadManfaat() {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_manfaat" })
    });
    const result = await res.json();
    let list = [];
    if (result.success && result.data) {
      list = Array.isArray(result.data) ? result.data.filter(Boolean) : Object.values(result.data);
    }
    renderManfaat(list);
  } catch (err) {
    renderManfaat([
      { judul: "Jaminan Kecelakaan Kerja (JKK)", deskripsi: "Perlindungan penuh atas risiko kecelakaan kerja.", icon: "jkk.svg" },
      { judul: "Jaminan Kematian (JKM)", deskripsi: "Santunan tunai duka cita sebesar Rp 42 Juta.", icon: "jkm.svg" },
      { judul: "Beasiswa Anak", deskripsi: "Bantuan beasiswa pendidikan untuk anak peserta.", icon: "beasiswa.svg" },
      { judul: "Subsidi Premi", deskripsi: "Bantuan subsidi iuran perlindungan kerja.", icon: "subsidi.svg" }
    ]);
  }
}

function getManfaatIcon(judul) {
  const title = (judul || '').toLowerCase();
  if (title.includes('jkk') || title.includes('kecelakaan')) return 'img/jkk.svg';
  if (title.includes('jkm') || title.includes('kematian')) return 'img/jkm.svg';
  if (title.includes('beasiswa')) return 'img/beasiswa.svg';
  if (title.includes('subsidi')) return 'img/subsidi.svg';
  return 'img/bullet_manfaat.svg';
}

function renderManfaat(list) {
  const container = document.getElementById('manfaatContainer');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<p class="loading-text">Belum ada data manfaat.</p>`;
    return;
  }

  let html = '<div class="manfaat-list">';
  list.forEach(item => {
    const iconPath = item.icon ? `img/${item.icon}` : getManfaatIcon(item.judul);
    html += `
      <div class="manfaat-item">
        <h4 class="manfaat-head">
          <img src="img/bullet_manfaat.svg" alt="Bullet" class="manfaat-bullet">
          <img src="${iconPath}" alt="Icon" class="manfaat-icon">
          <span>${escapeHtml(item.judul || '')}</span>
        </h4>
        <p class="manfaat-desc">${escapeHtml(item.deskripsi || '')}</p>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// LINK SOSIAL MEDIA, CS, & GOOGLE DRIVE FORMULIR DARI WORKER
async function loadSocialLinks() {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_links" })
    });
    const result = await res.json();
    if (result.success && result.data) {
      const links = result.data;
      const linkIg = document.getElementById('linkIg');
      const linkFb = document.getElementById('linkFb');
      const linkWa = document.getElementById('linkWa');
      const linkDrive = document.getElementById('linkDrive');

      if (linkIg && links.instagram) linkIg.href = links.instagram;
      if (linkFb && links.facebook) linkFb.href = links.facebook;
      if (linkWa && links.whatsapp) linkWa.href = links.whatsapp;
      if (linkDrive && links.drive) linkDrive.href = links.drive;
    }
  } catch (err) {
    console.error("Gagal memuat link dari worker:", err);
  }
}

// MEMUAT DATABASE QUICK REPLIES DARI WORKER
async function loadQuickReplies() {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_quick_replies" })
    });
    const result = await res.json();
    if (result.success && result.data && typeof result.data === 'object') {
      QUICK_REPLIES_DATA = result.data;
    }
  } catch (err) {
    console.error("Gagal memuat quick replies dari worker:", err);
  }
}

// PROSES CEK NIK
async function prosesCek() {
  const nikInput = document.getElementById('nikInput');
  const nik = nikInput ? nikInput.value.trim() : '';
  const hasilBox = document.getElementById('hasilBox');
  const btnCek = document.getElementById('btnCek');

  if (!nik || nik.length !== 16) {
    showToast("Silakan masukkan NIK KTP yang valid (16 Digit).", "error");
    return;
  }

  let token = nikToken;
  if (!token && window.turnstile) {
    token = window.turnstile.getResponse('#turnstileNikWidget');
  }

  if (!token) {
    showToast("Selesaikan verifikasi Turnstile terlebih dahulu!", "error");
    return;
  }

  btnCek.disabled = true;
  btnCek.innerHTML = '<span>Memeriksa Keamanan...</span>';
  hasilBox.classList.add('hidden');

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cek_nik",
        turnstileToken: token,
        nik: nik
      })
    });

    const result = await res.json();

    if (!result.success) {
      showToast(result.error || "Gagal memverifikasi.", "error");
      return;
    }

    hasilBox.classList.remove('hidden');
    const d = result.data;

    if (d) {
      hasilBox.innerHTML = `
        <div class="hasil-success-box">
          <div class="hasil-success-head">
            <span class="hasil-status">${escapeHtml(d.status || 'TERDAFTAR')}</span>
            <span class="hasil-badge">${escapeHtml(d.segment || 'Pekerja Rentan')}</span>
          </div>
          <p>Nama Pekerja: <strong>${escapeHtml(d.nama || '-')}</strong></p>
          <p>NIK: <strong>${escapeHtml(d.nik || '-')}</strong></p>
          <p>Segment Pekerjaan: <strong>${escapeHtml(d.segment || '-')}</strong></p>
          <p>Alamat Domisili: <span>${escapeHtml(d.alamat || '-')}</span></p>
        </div>
      `;
    } else {
      hasilBox.innerHTML = `
        <div class="hasil-empty-box">
          <strong>Informasi Status:</strong><br>NIK tersebut belum terdaftar pada program periode ini.
        </div>
      `;
    }

  } catch (err) {
    showToast("Terjadi gangguan koneksi ke server.", "error");
  } finally {
    btnCek.disabled = false;
    btnCek.innerHTML = '<span>Periksa Status Kepesertaan</span>';
    nikToken = null;
    resetTurnstile('turnstileNikWidget');
  }
}

// TOGGLE CHAT MODAL
function toggleChat() {
  const modal = document.getElementById('chatModal');
  if (!modal) return;

  const isHidden = modal.classList.contains('hidden');
  
  if (isHidden) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      renderQuickReplies();
    }, 50);
  } else {
    modal.classList.add('hidden');
  }
}

// ANIMASI TYPEWRITER (Kursor Dikunci - Tanpa Auto-Scroll Ke Bawah)
function typeWriterEffect(element, htmlContent, speed = 8) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  element.innerHTML = '';
  
  let index = 0;
  return new Promise((resolve) => {
    function type() {
      if (index < textContent.length) {
        element.textContent += textContent.charAt(index);
        index++;
        setTimeout(type, speed);
      } else {
        element.innerHTML = htmlContent;
        resolve();
      }
    }
    type();
  });
}

// RENDER QUICK REPLIES (INNER & OUTER)
function renderQuickReplies(activeInnerOptions = []) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  let box = document.getElementById("quickRepliesBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "quickRepliesBox";
    chatMessages.appendChild(box);
  }

  box.innerHTML = "";

  const container = document.createElement("div");
  container.className = "quick-replies-wrapper";

  // A. Inner Quick Replies (Sub-Menu)
  if (activeInnerOptions && activeInnerOptions.length > 0) {
    const innerBox = document.createElement("div");
    innerBox.className = "inner-replies-group";
    
    activeInnerOptions.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-quick-reply btn-inner-reply";
      btn.innerText = opt.label;
      btn.onclick = () => handleInnerClick(opt);
      innerBox.appendChild(btn);
    });

    container.appendChild(innerBox);
  }

  // B. Outer Quick Replies (Menu Utama Rolling)
  const activeKeys = Object.keys(QUICK_REPLIES_DATA).filter(
    key => key !== lastSelectedKey
  );

  const outerBox = document.createElement("div");
  outerBox.className = "outer-replies-group";

  activeKeys.forEach(key => {
    const btn = document.createElement("button");
    btn.className = "btn-quick-reply";
    btn.innerText = QUICK_REPLIES_DATA[key].label;
    btn.onclick = () => handleMainQuickReplyClick(key);
    outerBox.appendChild(btn);
  });

  container.appendChild(outerBox);
  box.appendChild(container);
}

// Handler Klik Menu Utama (JKK / JKM / Beasiswa)
async function handleMainQuickReplyClick(key) {
  lastSelectedKey = key;
  const program = QUICK_REPLIES_DATA[key];

  // Reset tracking sub-menu untuk topik baru ini
  clickedInnerIds.clear();
  currentInnerOptions = program.inner || [];

  removeQuickRepliesBox();
  appendUserBubble(program.label);
  await appendAiBubble(program.skema);

  // Tampilkan sub-menu milik program ini + outer reply sisanya
  renderQuickReplies(currentInnerOptions);
}

// Handler Klik Sub-Menu (Dokumen / Alur)
async function handleInnerClick(innerOpt) {
  removeQuickRepliesBox();
  appendUserBubble(innerOpt.label);

  // Tandai ID sub-menu ini sudah diklik
  clickedInnerIds.add(innerOpt.id);

  await appendAiBubble(innerOpt.text);

  // Saring sub-menu yang BELUM diklik untuk ditampilkan kembali
  const remainingInner = currentInnerOptions.filter(
    opt => !clickedInnerIds.has(opt.id)
  );

  renderQuickReplies(remainingInner);
}

// Helper UI Elements & Positioning
function removeQuickRepliesBox() {
  const box = document.getElementById("quickRepliesBox");
  if (box) box.remove();
}

function appendUserBubble(text) {
  const messages = document.getElementById("chatMessages");
  const userRow = document.createElement("div");
  userRow.className = "chat-row-right";
  userRow.innerHTML = `<div class="chat-bubble-user">${escapeHtml(text)}</div>`;
  messages.appendChild(userRow);
  messages.scrollTop = messages.scrollHeight;
}

async function appendAiBubble(text) {
  const messages = document.getElementById("chatMessages");
  const responseBubbleId = 'ai-res-' + Date.now();
  const aiRow = document.createElement("div");
  aiRow.className = "chat-row-left";
  aiRow.innerHTML = `<div class="chat-body chat-bubble-ai" id="${responseBubbleId}"></div>`;
  messages.appendChild(aiRow);

  // POSISI KURSOR: Scroll halus mengunci posisi ke AWAL gelembung AI ini!
  aiRow.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const targetBubble = document.getElementById(responseBubbleId);
  const parsedHtml = parseMarkdown(text);
  await typeWriterEffect(targetBubble, parsedHtml, 8);
}

// KIRIM CHAT MANUAL
async function kirimChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const btnKirim = document.getElementById('btnKirimChat');
  const text = input ? input.value.trim() : '';

  if (!text) return;

  let token = chatToken;
  if (!token && window.turnstile) {
    token = window.turnstile.getResponse('#turnstileChatWidget');
  }

  if (!token) {
    showToast("Selesaikan verifikasi Captcha/Turnstile terlebih dahulu!", "error");
    return;
  }

  const box = document.getElementById("quickRepliesBox");
  if (box) box.innerHTML = "";

  appendUserBubble(text);
  input.value = '';

  const typingIndicatorId = 'typing-' + Date.now();
  messages.innerHTML += `
    <div class="chat-row-left" id="${typingIndicatorId}">
      <div class="chat-body chat-bubble-ai typing-indicator">
        <span class="typing-text">CS SI JANTAN sedang mengetik</span>
        <span class="typing-dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;

  btnKirim.disabled = true;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "chat",
        turnstileToken: token,
        prompt: text,
        history: chatHistory
      })
    });

    const data = await res.json();

    const typingElem = document.getElementById(typingIndicatorId);
    if (typingElem) typingElem.remove();

    if (data.success && data.reply) {
      chatHistory.push({ role: "user", text: text });
      chatHistory.push({ role: "model", text: data.reply });
      if (chatHistory.length > 6) { 
        chatHistory = chatHistory.slice(-6);
      }

      await appendAiBubble(data.reply);

    } else {
      showToast(data.error || "Gagal memproses permintaan.", "error");
    }

  } catch (error) {
    const typingElem = document.getElementById(typingIndicatorId);
    if (typingElem) typingElem.remove();
    showToast("Terjadi kesalahan jaringan ke server AI.", "error");
  } finally {
    chatToken = null;
    resetTurnstile('turnstileChatWidget');
    btnKirim.disabled = false;
  }
}