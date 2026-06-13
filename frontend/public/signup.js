document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('themeToggle') || document.querySelector('.toggle-btn');
  if (toggleBtn) {
    const saved = localStorage.getItem('pramaanik-theme');
    if (saved === 'light') {
      document.body.classList.add('light');
      toggleBtn.textContent = '🌙';
    }
    toggleBtn.addEventListener('click', toggleDarkMode);
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      signup();
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

async function signup() {
  const firstnameInput = document.getElementById('firstnameInput');
  const lastnameInput = document.getElementById('lastnameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const genderInput = document.getElementById('genderInput');
  const ageInput = document.getElementById('ageInput');
  const contactInput = document.getElementById('contactInput');
  const btn = document.getElementById('signupSubmitBtn');

  const firstname = firstnameInput ? firstnameInput.value.trim() : '';
  const lastname = lastnameInput ? lastnameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const gender = genderInput ? genderInput.value : '';
  const age = ageInput ? ageInput.value.trim() : '';
  const contact = contactInput ? contactInput.value.trim() : '';

  if (btn) {
    btn.textContent = 'Creating account…';
    btn.disabled = true;
    btn.style.opacity = '0.75';
  }

  if (!firstname || !lastname || !email || !password || !gender || !age || !contact) {
    window.alert('Please complete every field to create your account.');
    if (btn) {
      btn.textContent = 'Create account';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
    return;
  }

  try {
    const registerResponse = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstname,
        lastname,
        email,
        password,
        gender,
        age: Number(age),
        contact,
      }),
    });

    const contentType = registerResponse.headers.get('content-type');
    let registerData;
    if (contentType && contentType.includes('application/json')) {
      registerData = await registerResponse.json();
    } else {
      const text = await registerResponse.text();
      throw new Error(text || 'Registration failed with an unexpected error');
    }

    if (!registerResponse.ok) {
      throw new Error(registerData.message || 'Registration failed');
    }

    const loginResponse = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const loginContentType = loginResponse.headers.get('content-type');
    let loginData;
    if (loginContentType && loginContentType.includes('application/json')) {
      loginData = await loginResponse.json();
    } else {
      const text = await loginResponse.text();
      throw new Error(text || 'Login failed with an unexpected error');
    }

    if (!loginResponse.ok) {
      throw new Error(loginData.message || 'Account created, but sign in failed');
    }

    localStorage.setItem('pramaanik-token', loginData.token);
    sessionStorage.setItem('loggedIn', 'true');
    window.location.href = 'home.html';
  } catch (error) {
    window.alert(error.message);
    if (btn) {
      btn.textContent = 'Create account';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
}
