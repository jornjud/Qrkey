// ตัวอักษรที่อนุญาตในการเข้ารหัส (รวมภาษาไทย, อังกฤษ, ตัวเลข, และอักขระพิเศษบางตัว)
const ALLOWED_CHARS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ' +
                      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
                      '!@#$%^&*()_+-=[]{}|;:,./<>?';

// ฟังก์ชันสร้าง seed สั้น
function generateShortSeed() {
    return Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
}

// ฟังก์ชันสร้าง Pseudo-random number generator (PRNG)
function createPRNG(seed, keyword) {
    const combined = seed + keyword;
    const hash = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex);
    let state = parseInt(hash.substring(0, 8), 16);
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x80000000;
    };
}

// ปรับฟังก์ชันเข้ารหัส ThaiEng แบบปรับปรุง
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

// ฟังก์ชันเข้ารหัสหลัก
function encrypt(text, keyword) {
    const seed = generateShortSeed();
    return seed + encodeThaiEng(text, seed, keyword);
}

// ฟังก์ชันสร้าง QR code
function generateQRCode(text) {
    const encodedText = encodeURIComponent(text);
    const qrCodeText = `https://jornjud.github.io/Qrkey/decoder.html?text=${encodedText}`;  // แก้ URL ให้ตรงกับเส้นทางของหน้า decoder
    const canvas = document.getElementById('qrcode');
    canvas.innerHTML = "";  // ล้าง QR Code เก่า
    new QRCode(canvas, {
        text: qrCodeText,
        width: 128,
        height: 128
    });
}


// ฟังก์ชันอัพเดตการแปลและสร้าง QR code อัตโนมัติ
function updateTranslation() {
    const sourceText = document.getElementById("sourceText").value;
    const keyword = document.getElementById("keyword").value;
    const targetText = encrypt(sourceText, keyword);
    document.getElementById("targetText").value = targetText;
    generateQRCode(targetText);
}

// ฟังก์ชันคัดลอกข้อความไปยัง clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    alert('คัดลอกข้อความแล้ว!');
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
