document.addEventListener('DOMContentLoaded', function () {
    loadWalletFromStorage();
    console.log('Wallet page initialized');
});

let walletCertificates = [];

// Wallet Management
function renderWallet() {
    const walletGrid = document.getElementById('walletGrid');
    const emptyState = document.getElementById('walletEmptyState');
    walletGrid.innerHTML = '';
    if (walletCertificates.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        walletCertificates.forEach(cert => {
            const card = document.createElement('div');
            card.className = 'certificate-card';
            card.innerHTML = `<h4>${cert.student_name}</h4><p>${cert.roll_no}</p><span class="badge verified">Verified</span>`;
            walletGrid.appendChild(card);
        });
    }
}

function loadWalletFromStorage() {
    const savedWallet = localStorage.getItem('pramaanikWallet');
    if (savedWallet) {
        walletCertificates = JSON.parse(savedWallet);
    }
    renderWallet();
}