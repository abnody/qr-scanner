

const WEB_APP_URL = "http://127.0.0.1:4040/scan";

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

        if (data.success) {
            await showToast(`✔️ ID ${id} checked in`, "success");
        } else {
            await showToast(`❌ Error`, "error");
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
    if (processing || decodedText === lastDecodedId) return await showToast(`✔️ ID ${id} already registered`, "success");;
    lastDecodedId = decodedText;
    processing = true;
    sendToSheet(decodedText);
}

// ======== Initialize Scanner ======== //
const scanner = new Html5Qrcode("reader");
scanner.start(
    { facingMode: "environment" },
    { fps: 35, qrbox: 200, disableFlip: true },
    onScanSuccess
);
