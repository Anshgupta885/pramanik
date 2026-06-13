/* ============================================================
   PRAMAANIK — Verify Page Logic (UI-enhanced, logic unchanged)
   ============================================================ */

// Single source of truth for auth
if (typeof window.isAuthenticated !== 'function') {
  window.isAuthenticated = function() {
    return Boolean(localStorage.getItem('pramaanik-token'));
  };
}

/* ── File Upload Initialiser ─────────────────────────────────── */
function initializeFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  if (!uploadArea || !fileInput) return;

  // Cleanup old listeners if any (by replacing the element or using a flag)
  if (uploadArea.getAttribute('data-init') === 'true') return;
  uploadArea.setAttribute('data-init', 'true');

  // Click to upload
  uploadArea.addEventListener('click', (e) => {
    // Only trigger if clicking the area or its decorative elements, 
    // but not if it's already in a loading or result state
    if (uploadArea.querySelector('.loading-container') || uploadArea.querySelector('[class^="result-"]')) {
      return;
    }

    // Check specifically for elements that should trigger the file browser
    const isTargetValid = e.target === uploadArea || 
                          e.target.closest('.upload-icon') || 
                          e.target.closest('h3') || 
                          e.target.closest('p') || 
                          e.target.closest('.upload-formats') || 
                          e.target.closest('.upload-btn');

    if (isTargetValid) {
      e.preventDefault();
      e.stopPropagation();
      
      if (!window.isAuthenticated()) {
        promptLoginForUpload();
        return;
      }
      fileInput.click();
    }
  });

  // Keyboard activation
  uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File selected via input
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      if (!window.isAuthenticated()) {
        promptLoginForUpload();
        return;
      }
      handleFileVerification(e.target.files[0]);
    }
  });

  // Drag and drop handling
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleFileVerification(e.dataTransfer.files[0]);
    }
  });
}

function promptLoginForUpload() {
  window.alert('Please sign in first to upload a certificate.');
  window.location.href = 'login.html';
}

/* ── Animated Loading State ──────────────────────────────────── */
function showLoadingState(fileName) {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;

  uploadArea.innerHTML = `
    <div class="loading-container">
      <div class="loading-shield" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div class="loading-text" style="text-align:center;">
        <h3>Verifying Certificate…</h3>
        <p style="font-size:0.85rem;margin-top:0.25rem;">${escHtml(fileName)}</p>
      </div>
      <div class="loading-steps" role="status" aria-live="polite">
        <div class="loading-step active" id="lstep-1">
          <div class="step-dot"></div> Extracting document text via OCR
        </div>
        <div class="loading-step" id="lstep-2">
          <div class="step-dot"></div> Locating Certificate ID
        </div>
        <div class="loading-step" id="lstep-3">
          <div class="step-dot"></div> Cross-referencing database records
        </div>
        <div class="loading-step" id="lstep-4">
          <div class="step-dot"></div> Preparing your result
        </div>
      </div>
    </div>
  `;

  // Animate steps
  const steps = [1, 2, 3, 4];
  steps.forEach((n, i) => {
    setTimeout(() => {
      const prev = document.getElementById(`lstep-${n - 1}`);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      const cur = document.getElementById(`lstep-${n}`);
      if (cur) cur.classList.add('active');
    }, i * 900);
  });
}

/* ── Main Verification Handler ───────────────────────────────── */
async function handleFileVerification(file) {
  if (!window.isAuthenticated()) {
    promptLoginForUpload();
    return;
  }

  showLoadingState(file.name);

  const formData = new FormData();
  formData.append('certificate', file);
  const apiUrl = '/verify';
  const token = localStorage.getItem('pramaanik-token');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('pramaanik-token');
      sessionStorage.removeItem('loggedIn');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'Verified ✅') {
      saveToWallet(result);
      window.__toast && window.__toast('Certificate saved to your Vault!', 'success');
    }
    displayVerificationResult(result);
  } catch (error) {
    console.error('Verification failed:', error);
    displayVerificationResult({
      status: 'Error',
      message: error.message || 'Could not connect to the verification server.',
      student_name: 'N/A',
      roll_no: 'N/A',
    });
  }
}

// Make it globally accessible
window.handleFileVerification = handleFileVerification;
window.initializeFileUpload = initializeFileUpload;

/* ── Display Result ──────────────────────────────────────────── */
function displayVerificationResult(result) {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;

  const isVerified = result.status === 'Verified ✅';
  const isError = result.status === 'Error';
  const ringClass = isVerified ? 'success' : (isError ? 'error' : 'warning');

  const iconSvg = isVerified
    ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`
    : isError
    ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  const titleText = isVerified ? 'Certificate Verified' : isError ? 'Verification Error' : 'Suspicious Document';
  const titleColor = isVerified ? 'var(--emerald)' : isError ? 'var(--rose)' : 'var(--amber)';

  uploadArea.innerHTML = `
    <div class="result-${isVerified ? 'verified' : 'suspicious'}">
      <div class="result-header">
        <div class="result-icon-ring ${ringClass}" aria-hidden="true">${iconSvg}</div>
        <h3 style="color:${titleColor};margin:0;">${escHtml(titleText)}</h3>
        <p style="font-size:0.875rem;margin:0;">${escHtml(result.message || '')}</p>
      </div>

      ${!isError ? `
      <div class="result-details" role="list">
        <div class="result-row" role="listitem">
          <span class="result-row-label">Student</span>
          <span class="result-row-value">${escHtml(result.student_name || 'N/A')}</span>
        </div>
        <div class="result-row" role="listitem">
          <span class="result-row-label">Certificate ID</span>
          <span class="result-row-value" style="font-family:monospace;font-size:0.85rem;">${escHtml(result.roll_no || 'N/A')}</span>
        </div>
        <div class="result-row" role="listitem">
          <span class="result-row-label">Status</span>
          <span class="badge ${isVerified ? 'verified' : 'pending'}">${escHtml(result.status)}</span>
        </div>
      </div>
      ` : ''}

      <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;margin-top:1rem;">
        <button class="primary-btn" onclick="resetUploadArea()" type="button">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Verify Another
        </button>
        ${isVerified ? `
        <button class="secondary-btn" onclick="window.__navigate && window.__navigate('wallet')" type="button">
          View My Vault →
        </button>
        ` : ''}
      </div>
    </div>
  `;
}

/* ── Save to Wallet ──────────────────────────────────────────── */
function saveToWallet(certificate) {
  let wallet = JSON.parse(localStorage.getItem('pramaanikWallet') || '[]');
  // Avoid duplicates by roll_no
  const exists = wallet.some(c => c.roll_no === certificate.roll_no);
  if (!exists) {
    wallet.unshift({ ...certificate, savedAt: new Date().toISOString() });
    localStorage.setItem('pramaanikWallet', JSON.stringify(wallet));
  }
}

/* ── Reset Upload Area ───────────────────────────────────────── */
function resetUploadArea() {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;
  uploadArea.removeAttribute('data-init');
  uploadArea.innerHTML = `
    <div class="upload-icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </div>
    <h3>Drop your certificate here</h3>
    <p>Drag and drop, or click to browse your files</p>
    <button class="upload-btn" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Choose File
    </button>
    <input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png" hidden aria-label="File input">
    <div class="upload-formats">
      <span class="format-tag">PDF</span>
      <span class="format-tag">JPG</span>
      <span class="format-tag">JPEG</span>
      <span class="format-tag">PNG</span>
    </div>
  `;
  initializeFileUpload();
}

/* ── Utility ─────────────────────────────────────────────────── */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Global entry point
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('uploadArea')) {
    initializeFileUpload();
  }
});
