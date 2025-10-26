document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.querySelector('.toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleDarkMode);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            login();
        });
    }
});

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    const btn = document.querySelector(".toggle-btn");
    if (document.body.classList.contains("dark")) {
        btn.textContent = "☀";
    } else {
        btn.textContent = "🌙";
    }
}

function login() {
    // Simulate a successful login
    sessionStorage.setItem('loggedIn', 'true');
    window.location.href = 'home.html';
}