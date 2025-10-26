document.addEventListener('DOMContentLoaded', function () {
    initializeFileUpload();
    console.log('Verify page initialized');
});

// Verification Logic
async function handleFileVerification(file) {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `<div class="loading-spinner"></div><h3>Verifying Certificate...</h3><p><strong>${file.name}</strong></p>`;
    const formData = new FormData();
    formData.append('certificate', file);
    const apiUrl = 'http://localhost:5000/verify';
    try {
        const response = await fetch(apiUrl, { method: 'POST', body: formData });
        if (!response.ok) { throw new Error(`Server error: ${response.status}`); }
        const result = await response.json();
        if (result.status === "Verified ✅") {
            saveToWallet(result);
        }
        displayVerificationResult(result);
    } catch (error) {
        console.error('API Call Failed:', error);
        displayVerificationResult({ status: 'Error', message: 'Could not connect to the verification server.' });
    }
}

function displayVerificationResult(result) {
    const uploadArea = document.getElementById('uploadArea');
    let resultHTML = '';
    const isVerified = result.status === 'Verified ✅';
    if (isVerified) {
        resultHTML = `<h3 style="color: var(--success);">Certificate Verified</h3><p><strong>Student:</strong> ${result.student_name || 'N/A'}</p><p><strong>ID:</strong> ${result.roll_no || 'N/A'}</p>`;
    } else {
        resultHTML = `<h3 style="color: var(--error);">${result.status || 'Error'}</h3><p>${result.message || 'An unknown error occurred.'}</p>`;
    }
    uploadArea.innerHTML = resultHTML;
    const verifyAnotherBtn = document.createElement('button');
    verifyAnotherBtn.className = 'upload-btn';
    verifyAnotherBtn.textContent = 'Verify Another Certificate';
    verifyAnotherBtn.onclick = resetUploadArea;
    uploadArea.appendChild(verifyAnotherBtn);
}

function saveToWallet(certificate) {
    let wallet = localStorage.getItem('pramaanikWallet');
    wallet = wallet ? JSON.parse(wallet) : [];
    wallet.push(certificate);
    localStorage.setItem('pramaanikWallet', JSON.stringify(wallet));
}

function resetUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><h3>Upload Certificate</h3><p>Drag and drop your certificate here, or click to browse</p><button class="upload-btn">Choose File</button><input type="file" id="fileInput" accept=".pdf,.jpg,.jpeg,.png" hidden>`;
    initializeFileUpload();
}

function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    if (!uploadArea || !fileInput) return;
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileVerification(e.target.files[0]);
    });
}