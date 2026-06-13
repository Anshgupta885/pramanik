/* ============================================================
   PRAMAANIK — Wallet Page Logic (UI-enhanced, logic unchanged)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('walletGrid')) {
    loadWalletFromStorage();
  }
});

let walletCertificates = [];

/* ── Load from Storage ───────────────────────────────────────── */
async function loadWalletFromStorage() {
  const token = localStorage.getItem('pramaanik-token');
  const localSaved = localStorage.getItem('pramaanikWallet');
  const fallbackWallet = localSaved ? JSON.parse(localSaved) : [];

  if (!token) {
    walletCertificates = fallbackWallet;
    renderWallet();
    return;
  }

  try {
    const response = await fetch('/certificates', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      walletCertificates = fallbackWallet;
      renderWallet();
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const certificates = await response.json();
    walletCertificates = certificates.map((certificate) => ({
      student_name: certificate.studentName || 'Unknown',
      roll_no: certificate.certificateId || 'N/A',
      status: certificate.status || 'Pending',
      savedAt: certificate.createdAt || certificate.uploadedAt || new Date().toISOString(),
      course: certificate.course || '',
      extractedText: certificate.extractedText || '',
      originalName: certificate.originalName || '',
      mimeType: certificate.mimeType || '',
      size: certificate.size || 0,
    }));

    localStorage.setItem('pramaanikWallet', JSON.stringify(walletCertificates));
    renderWallet();
  } catch (error) {
    console.error('Failed to load wallet from server:', error);
    walletCertificates = fallbackWallet;
    renderWallet();
  }
}

/* ── Render Wallet ───────────────────────────────────────────── */
function renderWallet() {
  const grid = document.getElementById('walletGrid');
  const emptyState = document.getElementById('walletEmptyState');
  const statsRow = document.getElementById('walletStatsRow');
  if (!grid) return;

  grid.innerHTML = '';

  if (walletCertificates.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (statsRow) statsRow.style.display = 'none';
    return;
  }

  // Hide empty state
  if (emptyState) emptyState.style.display = 'none';

  // Show and populate stats
  if (statsRow) {
    statsRow.style.display = 'grid';
    const total = walletCertificates.length;
    const verified = walletCertificates.filter(c => c.status === 'Verified ✅').length;
    const suspicious = total - verified;
    const elTotal = document.getElementById('wStat-total');
    const elVerified = document.getElementById('wStat-verified');
    const elSuspicious = document.getElementById('wStat-suspicious');
    if (elTotal) elTotal.textContent = total;
    if (elVerified) elVerified.textContent = verified;
    if (elSuspicious) elSuspicious.textContent = suspicious;
  }

  // Render cards
  walletCertificates.forEach((cert, idx) => {
    const isVerified = cert.status === 'Verified ✅';
    const savedDate = cert.savedAt ? new Date(cert.savedAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) : 'Unknown';

    const card = document.createElement('div');
    card.className = 'certificate-card';
    card.style.animationDelay = `${idx * 60}ms`;
    card.style.animation = `pageIn 0.4s cubic-bezier(0.22,1,0.36,1) ${idx * 60}ms both`;
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `Certificate for ${cert.student_name || 'Unknown'}`);

    card.innerHTML = `
      <div class="cert-card-header">
        <div class="cert-card-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        <div>
          <div class="cert-card-title">${escHtmlW(cert.student_name || 'Unknown Student')}</div>
          <div class="cert-card-subtitle">Certificate of Completion</div>
        </div>
      </div>
      <div class="cert-card-body">
        <div class="cert-card-row">
          <span class="cert-card-key">Certificate ID</span>
          <span class="cert-card-val" style="font-family:monospace;font-size:0.82rem;">${escHtmlW(cert.roll_no || 'N/A')}</span>
        </div>
        <div class="cert-card-row">
          <span class="cert-card-key">Verified On</span>
          <span class="cert-card-val">${savedDate}</span>
        </div>
      </div>
      <div class="cert-card-footer">
        <span class="badge ${isVerified ? 'verified' : 'pending'}">
          ${isVerified
            ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20,6 9,17 4,12"/></svg> Verified`
            : `⚠ Suspicious`
          }
        </span>
        <button class="secondary-btn" style="padding:0.375rem 0.75rem;font-size:0.78rem;"
          onclick="removeFromWallet(${idx})" aria-label="Remove certificate from vault">
          Remove
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ── Remove from Wallet ──────────────────────────────────────── */
function removeFromWallet(idx) {
  walletCertificates.splice(idx, 1);
  localStorage.setItem('pramaanikWallet', JSON.stringify(walletCertificates));
  renderWallet();
  window.__toast && window.__toast('Certificate removed from vault.', 'info');
}

/* ── Utility ─────────────────────────────────────────────────── */
function escHtmlW(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
