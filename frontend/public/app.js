document.addEventListener('DOMContentLoaded', function () {
  const pageContainer = document.getElementById('mainContent');
  const allNavItems = document.querySelectorAll('.nav-item[data-page]');

  /* ── Toast System ─────────────────────────────────────────── */
  const toastTypes = {
    success: { icon: '✅', border: 'var(--emerald)' },
    error:   { icon: '❌', border: 'var(--rose)' },
    warning: { icon: '⚠️', border: 'var(--amber)' },
    info:    { icon: 'ℹ️', border: 'var(--indigo)' },
  };

  window.__toast = function(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = toastTypes[type] || toastTypes.info;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.style.borderLeft = `3px solid ${t.border}`;
    toast.innerHTML = `
      <div class="toast-icon" aria-hidden="true">${t.icon}</div>
      <div class="toast-content">
        <div class="toast-title">${message}</div>
      </div>
    `;
    container.appendChild(toast);
    const remove = () => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
  };

  function isAuthenticated() {
    return Boolean(localStorage.getItem('pramaanik-token'));
  }

  function promptLoginForVault() {
    window.alert('Please sign in first to view your vault.');
    window.location.href = 'login.html';
  }

  /* ── Page Loading ─────────────────────────────────────────── */
  function loadPage(pageName) {
    // Show skeleton while loading
    pageContainer.innerHTML = `
      <div class="page" style="padding:2rem 1.25rem;">
        <div class="skeleton-block" style="height:200px;border-radius:1.25rem;margin-bottom:1.5rem;"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem;margin-bottom:1.5rem;">
          <div class="skeleton-block" style="height:100px;border-radius:1rem;"></div>
          <div class="skeleton-block" style="height:100px;border-radius:1rem;"></div>
          <div class="skeleton-block" style="height:100px;border-radius:1rem;"></div>
        </div>
      </div>
    `;

    fetch(`${pageName}.html`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(html => {
        pageContainer.innerHTML = html;
        // Re-init page-specific logic
        if (pageName === 'verify') {
          setTimeout(initializeFileUpload, 50);
        } else if (pageName === 'wallet') {
          setTimeout(loadWalletFromStorage, 50);
        } else if (pageName === 'home-content') {
          setTimeout(initHomePage, 50);
        }
      })
      .catch(err => {
        console.error('Page load error:', err);
        pageContainer.innerHTML = `
          <div class="page" style="text-align:center;padding:4rem 2rem;">
            <div class="empty-state-icon" style="display:inline-flex;margin-bottom:1rem;background:var(--rose-100);color:var(--rose);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Page unavailable</h2>
            <p style="margin-top:0.5rem;">Could not load this page. Please try again.</p>
          </div>
        `;
      });
  }

  /* ── Navigation ───────────────────────────────────────────── */
  window.__navigate = function(pageName) {
    if (pageName === 'wallet' && !isAuthenticated()) {
      promptLoginForVault();
      return;
    }

    allNavItems.forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-page') === pageName);
    });
    loadPage(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  allNavItems.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const pageName = this.getAttribute('data-page');
      window.__navigate(pageName);
    });
  });

  // Home page init
  function initHomePage() {
    const isLoggedIn = isAuthenticated();

    // Update stat counter from wallet
    const wallet = JSON.parse(localStorage.getItem('pramaanikWallet') || '[]');
    const statEl = document.getElementById('stat-verified');
    if (statEl && wallet.length > 0) {
      statEl.textContent = wallet.length + '+';
    }

    const section = document.getElementById('recentActivity');
    const list = document.getElementById('activityList');
    const countBadge = document.getElementById('activityCount');

    // Guests should not see recent activity.
    if (!isLoggedIn) {
      if (section) section.classList.add('hidden');
      if (list) list.innerHTML = '';
      if (countBadge) countBadge.textContent = '';
      return;
    }

    // Show recent activity if exists
    if (wallet.length > 0 && section && list) {
      section.classList.remove('hidden');
      if (countBadge) countBadge.textContent = wallet.length;
      const recent = wallet.slice(-5).reverse();
      recent.forEach((cert, idx) => {
        const isVerified = cert.status === 'Verified ✅';
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.style.animationDelay = `${idx * 60}ms`;
        item.innerHTML = `
          <div class="activity-dot ${isVerified ? '' : 'warning'}" aria-hidden="true"></div>
          <div class="activity-info">
            <div class="activity-name">${cert.student_name || 'Unknown'}</div>
            <div class="activity-id">${cert.roll_no || 'N/A'}</div>
          </div>
          <span class="badge ${isVerified ? 'verified' : 'pending'}">${isVerified ? 'Verified' : 'Suspicious'}</span>
        `;
        list.appendChild(item);
      });
    }

    // Hero CTA wiring
    document.querySelectorAll('[data-page]').forEach(btn => {
      if (!btn.classList.contains('nav-item')) {
        btn.addEventListener('click', function() {
          const p = this.getAttribute('data-page');
          if (p) window.__navigate(p);
        });
      }
    });
  }

  /* ── Login Button ─────────────────────────────────────────── */
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    const token = localStorage.getItem('pramaanik-token');
    if (token) {
      loginBtn.textContent = 'Logout';
      loginBtn.style.background = 'none';
      loginBtn.style.color = 'var(--foreground)';
      loginBtn.style.border = '1px solid var(--border-subtle)';
      loginBtn.style.boxShadow = 'none';
    }
    loginBtn.addEventListener('click', () => {
      if (localStorage.getItem('pramaanik-token')) {
        localStorage.removeItem('pramaanik-token');
        sessionStorage.removeItem('loggedIn');
        window.__toast('You have been signed out.', 'info');
        setTimeout(() => window.location.href = 'login.html', 800);
      } else {
        window.location.href = 'login.html';
      }
    });
  }

  /* ── Theme Toggle ─────────────────────────────────────────── */
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // Persist theme
  const savedTheme = localStorage.getItem('pramaanik-theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (themeToggle) themeToggle.textContent = '☀️';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-theme');
      const isDark = body.classList.contains('dark-theme');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('pramaanik-theme', isDark ? 'dark' : 'light');
    });
  }

  /* ── Skeleton CSS injection ───────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .skeleton-block {
      background: linear-gradient(90deg, var(--border-subtle) 25%, var(--accent) 50%, var(--border-subtle) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);

  /* ── Boot ─────────────────────────────────────────────────── */
  loadPage('home-content');

  const originalNavigate = window.__navigate;
  window.__navigate = function(pageName) {
    return originalNavigate(pageName);
  };
});
