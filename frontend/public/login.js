document.addEventListener('DOMContentLoaded', function () {
  // Theme toggle
  const toggleBtn = document.getElementById('themeToggle') || document.querySelector('.toggle-btn');
  if (toggleBtn) {
    // Restore saved theme
    const saved = localStorage.getItem('pramaanik-theme');
    if (saved === 'light') {
      document.body.classList.add('light');
      toggleBtn.textContent = '🌙';
    }
    toggleBtn.addEventListener('click', toggleDarkMode);
  }

  // Form submit
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      login();
    });
  }
});

function toggleDarkMode() {
  const body = document.body;
  body.classList.toggle('light');
  const btn = document.getElementById('themeToggle') || document.querySelector('.toggle-btn');
  const isLight = body.classList.contains('light');
  if (btn) btn.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('pramaanik-theme', isLight ? 'light' : 'dark');
}

function login() {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const btn = document.getElementById('loginSubmitBtn');
  if (btn) {
    btn.textContent = 'Signing in…';
    btn.disabled = true;
    btn.style.opacity = '0.75';
  }

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    window.alert('Please enter both email and password.');
    if (btn) {
      btn.textContent = 'Sign in';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
    return;
  }

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
    }),
  })
    .then(async (response) => {
      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'An unexpected error occurred');
      }

      if (!response.ok) {
        if (response.status === 404) {
          window.alert('No account found. Creating one now, then signing you in.');
          return registerAndLogin(email, password);
        }
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('pramaanik-token', data.token);
      sessionStorage.setItem('loggedIn', 'true');
      window.location.href = 'home.html';
    })
    .catch((error) => {
      window.alert(error.message);
      if (btn) {
        btn.textContent = 'Sign in';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
}

function registerAndLogin(email, password) {
  const nameSeed = String(email || 'user').split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
  const parts = nameSeed.trim().split(/\s+/).filter(Boolean);
  const firstname = parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : 'User';
  const lastname = parts[1] ? parts[1][0].toUpperCase() + parts[1].slice(1) : 'Account';

  return fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstname,
      lastname,
      email,
      password,
      gender: 'Not specified',
      age: 18,
      contact: email,
    }),
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok && response.status !== 400) {
        throw new Error(data.message || 'Registration failed');
      }
      return fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed after registration');
      }
      localStorage.setItem('pramaanik-token', data.token);
      sessionStorage.setItem('loggedIn', 'true');
      window.location.href = 'home.html';
    })
    .catch((error) => {
      window.alert(error.message);
      const btn = document.getElementById('loginSubmitBtn');
      if (btn) {
        btn.textContent = 'Sign in';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
}
