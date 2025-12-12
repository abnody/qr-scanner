

// const WEB_APP_URL = "https://radiatus-hyperthermally-isabel.ngrok-free.dev/scan";
const WEB_APP_URL = "https://radiatus-hyperthermally-isabel.ngrok-free.dev/scan";

let lastDecodedId = null;
let processing = false;

// ======== Toast Overlay ======== //
function showToast(message, type = "success") {
    const overlay = document.createElement("div");
    overlay.className = "toast-overlay";

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <p>${message}</p>
        <button id="toast-ok">OK</button>
    `;

    overlay.appendChild(toast);
    document.body.appendChild(overlay);

    return new Promise(resolve => {
        toast.querySelector("#toast-ok").onclick = () => {
            overlay.remove();
            resolve();
        };
    });
}

// ======== Show/Hide Loading Spinner ======== //
function showLoading() {
    let overlay = document.querySelector("#scanner-card .overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "overlay";
        overlay.innerHTML = `<div class="spinner"></div>`;
        document.getElementById("scanner-card").appendChild(overlay);
    }
    overlay.style.display = "flex";
}

function hideLoading() {
    const overlay = document.querySelector("#scanner-card .overlay");
    if (overlay) overlay.style.display = "none";
}

// ======== Send ID to Server ======== //
async function sendToSheet(id) {
    showLoading();

    try {
        const res = await fetch(WEB_APP_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });

        const data = await res.json();
        hideLoading();
        console.log("Response from server:", data);

        if (data.data.success) {
            await showToast(`✔️ ${data.data.message}`, "success");
        } else {
            await showToast(`❌ ${data.data.message}`, "error");
        }

    } catch (err) {
        hideLoading();
        await showToast(`❌ ${err}`, "error");
    } finally {
        processing = false;
    }
}


// ======== QR Scan Callback ======== //
async function onScanSuccess(decodedText) {
    // if (processing || decodedText === lastDecodedId) return await showToast(`✔️ ID ${decodedText} already registered`, "success");
    if (processing) return ;
    processing = true;
    sendToSheet(decodedText);
}

// ======== Initialize Scanner ======== //
const scanner = new Html5Qrcode("reader");
let scannerRunning = false;

async function startScanner() {
    if (scannerRunning) return;
    try {
        await scanner.start(
            { facingMode: "environment" },
            { fps: 35, qrbox: 200, disableFlip: true },
            onScanSuccess
        );
        scannerRunning = true;
    } catch (err) {
        console.error("Failed to start scanner:", err);
        await showToast(`Scanner error: ${err}`, "error");
    }
}

async function stopScanner() {
    if (!scannerRunning) return;
    try {
        await scanner.stop();
        scannerRunning = false;
        try { scanner.clear(); } catch (e) { /* ignore */ }
    } catch (err) {
        console.error("Failed to stop scanner:", err);
    }
}

// Tab wiring and manual input handling
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const scanSection = document.getElementById('scanner-card');
    const manualSection = document.getElementById('manual-card');
    const manualForm = document.getElementById('manual-form');
    const manualInput = document.getElementById('manual-id');

    function activateTab(name) {
        tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name ? 'true' : 'false'));
        if (name === 'scan') {
            scanSection.style.display = 'block';
            manualSection.style.display = 'none';
            manualSection.setAttribute('aria-hidden', 'true');
            startScanner();
        } else {
            scanSection.style.display = 'none';
            manualSection.style.display = 'block';
            manualSection.setAttribute('aria-hidden', 'false');
            stopScanner();
        }
    }

    tabs.forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));

    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = manualInput.value.trim();
        if (!id) { await showToast('Please enter an ID', 'error'); return; }
        if (processing) return;
        processing = true;
        sendToSheet(id);
    });

    // default to scan tab
    activateTab('scan');
});
