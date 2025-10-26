document.addEventListener('DOMContentLoaded', function () {
    const pageContainer = document.getElementById('mainContent');
    const navLinks = document.querySelectorAll('.nav-item');

    // Function to load page content
    function loadPage(pageName) {
        fetch(`${pageName}.html`)
            .then(response => response.text())
            .then(data => {
                pageContainer.innerHTML = data;
                // Re-initialize scripts for the loaded page if necessary
                if (pageName === 'verify') {
                    initializeFileUpload();
                } else if (pageName === 'wallet') {
                    loadWalletFromStorage();
                }
            })
            .catch(error => {
                console.error('Error loading the page: ', error);
                pageContainer.innerHTML = '<p>Error loading page. Please try again.</p>';
            });
    }

    // Event listeners for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const pageName = this.getAttribute('data-page');

            // Remove active class from all nav links
            navLinks.forEach(nav => nav.classList.remove('active'));
            // Add active class to the clicked link
            this.classList.add('active');

            loadPage(pageName);
        });
    });

    // Load the home page by default
    loadPage('home-content');

    // Handle login/logout button
    const loginBtn = document.getElementById('loginBtn');
    if (sessionStorage.getItem('loggedIn')) {
        loginBtn.textContent = 'Logout';
    }

    loginBtn.addEventListener('click', () => {
        if (sessionStorage.getItem('loggedIn')) {
            sessionStorage.removeItem('loggedIn');
            window.location.href = 'login.html';
        } else {
            window.location.href = 'login.html';
        }
    });

    // Theme switcher
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Set initial theme to light
    body.classList.remove('dark-theme');
    themeToggle.textContent = '🌙';

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            themeToggle.textContent = '☀️';
        } else {
            themeToggle.textContent = '🌙';
        }
    });
});