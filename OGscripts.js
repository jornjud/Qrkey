// ตัวอักษรที่อนุญาตในการเข้ารหัส
const ALLOWED_CHARS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ' +
                      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
                      '!@#$%^&*()_+-=[]{}|;:,./<>?';

function generateShortSeed() {
    return Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
}

function createPRNG(seed, keyword) {
    const combined = seed + keyword;
    const hash = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex);
    let state = parseInt(hash.substring(0, 8), 16);
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x80000000;
    };
}

function encodeThaiEng(text, seed, keyword) {
    const prng = createPRNG(seed, keyword);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = ALLOWED_CHARS.indexOf(char);
        if (index !== -1) {
            const shift = Math.floor(prng() * ALLOWED_CHARS.length);
            const newIndex = (index + shift) % ALLOWED_CHARS.length;
            result += ALLOWED_CHARS[newIndex];
        } else {
            result += char;
        }
    }
    return result;
}

function encrypt(text, keyword) {
    const seed = generateShortSeed();
    return seed + encodeThaiEng(text, seed, keyword);
}

function generateQRCode(text) {
    const encodedText = encodeURIComponent(text);
    const qrCodeText = `https://jornjud.github.io/Qrkey/decoder.html?text=${encodedText}`;
    const qrcode = document.getElementById('qrcode');
    qrcode.innerHTML = "";  // ล้าง QR Code เก่า
    new QRCode(qrcode, {
        text: qrCodeText,
        width: 300,
        height: 300,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H,
        quietZone: 10,
        quietZoneColor: "#ffffff"
    });

    // เพิ่มการแสดงลิงก์
    const linkElement = document.getElementById('qrcode-link');
    linkElement.innerHTML = `<a href="${qrCodeText}" target="_blank">${qrCodeText}</a>`;
}

function updateTranslation() {
    const sourceText = document.getElementById("sourceText").value;
    const keyword = document.getElementById("keyword").value;
    const targetText = encrypt(sourceText, keyword);
    document.getElementById("targetText").value = targetText;
    generateQRCode(targetText);
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    alert('คัดลอกข้อความแล้ว!');
}

function createQRCodeWithFrame() {
    return new Promise((resolve) => {
        const qrCanvas = document.querySelector("#qrcode canvas");
        const frameCanvas = document.createElement('canvas');
        const ctx = frameCanvas.getContext('2d');

        // กำหนดขนาดของ canvas ใหม่ (เพิ่มขอบ)
        const padding = 40;
        const borderWidth = 4;
        frameCanvas.width = qrCanvas.width + (padding * 2) + (borderWidth * 4);
        frameCanvas.height = frameCanvas.width;

        // วาดพื้นหลังสีขาว
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);

        // วาดกรอบนอกสีดำ
        ctx.strokeStyle = 'black';
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth / 2, borderWidth / 2, frameCanvas.width - borderWidth, frameCanvas.height - borderWidth);

        // วาดกรอบในสีเขียว
        ctx.strokeStyle = '#4CAF50';
        ctx.strokeRect(borderWidth * 2, borderWidth * 2, frameCanvas.width - borderWidth * 4, frameCanvas.height - borderWidth * 4);

        // วาด QR code ลงบน canvas ใหม่
        ctx.drawImage(qrCanvas, padding + borderWidth * 2, padding + borderWidth * 2);

        frameCanvas.toBlob((blob) => {
            resolve(blob);
        });
    });
}

async function saveQRCode() {
    const blob = await createQRCodeWithFrame();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qrcode_with_frame.png';
    link.click();
}

async function shareQRCode() {
    const blob = await createQRCodeWithFrame();
    const file = new File([blob], "qrcode_with_frame.png", { type: "image/png" });
    if (navigator.share) {
        navigator.share({
            title: 'SQRC QR Code',
            text: 'นี่คือ QR Code สำหรับข้อความที่เข้ารหัสของฉัน',
            files: [file]
        }).then(() => console.log('Share was successful.'))
        .catch((error) => console.log('Sharing failed', error));
    } else {
        alert('ขออภัย, เบราว์เซอร์ของคุณไม่รองรับการแชร์');
    }
}

// เพิ่ม event listener เมื่อโหลดหน้าเว็บเสร็จ
document.addEventListener('DOMContentLoaded', function() {
    const convertButton = document.getElementById('convertButton');
    if (convertButton) {
        convertButton.addEventListener('click', updateTranslation);
    }

    // เพิ่ม event listener สำหรับการกด Enter ใน input fields
    const sourceText = document.getElementById('sourceText');
    const keyword = document.getElementById('keyword');

    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            updateTranslation();
        }
    }

    if (sourceText) {
        sourceText.addEventListener('keypress', handleEnterKey);
    }
    if (keyword) {
        keyword.addEventListener('keypress', handleEnterKey);
    }
});
