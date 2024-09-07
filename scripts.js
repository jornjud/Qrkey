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
    const qrCodeText = `https://jornjud.github.io/Qrkey/decoder.html?text=${encodedText}`;
    const qrcode = document.getElementById('qrcode');
    qrcode.innerHTML = "";  // ล้าง QR Code เก่า
    new QRCode(qrcode, {
        text: qrCodeText,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H,
        quietZone: 15,
        quietZoneColor: "#ffffff"
    });

    // เพิ่มการแสดงลิงก์
    const linkElement = document.getElementById('qrcode-link');
    linkElement.innerHTML = `<a href="${qrCodeText}" target="_blank">${qrCodeText}</a>`;
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

// ฟังก์ชันบันทึก QR Code
function saveQRCode() {
    const canvas = document.querySelector("#qrcode canvas");
    if (canvas) {
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = image;
        link.click();
    } else {
        alert('กรุณาสร้าง QR Code ก่อนบันทึก');
    }
}

// ฟังก์ชันแชร์ QR Code
function shareQRCode() {
    const canvas = document.querySelector("#qrcode canvas");
    if (canvas) {
        canvas.toBlob(function(blob) {
            const file = new File([blob], "qrcode.png", { type: "image/png" });
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
        });
    } else {
        alert('กรุณาสร้าง QR Code ก่อนแชร์');
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
