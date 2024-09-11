// ต้องใส่ CryptoJS เข้ามาในไฟล์เพื่อใช้งาน
// <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js"></script>

// ตัวอักษรที่อนุญาตในการเข้ารหัส
const ALLOWED_CHARS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ' +
                      'ะาำิีึืุูเแโใไ' + // เพิ่มสระภาษาไทย
                      '่้๊๋์' + // เพิ่มวรรณยุกต์ภาษาไทย
                      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
                      '!@#$%^&*()_+-=[]{}|;:,./<>?';

// ฟังก์ชันสร้าง seed สั้น
function generateShortSeed() {
    return Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
}

// ฟังก์ชันสร้าง PRNG ที่ใช้ CryptoJS.SHA256
function createPRNG(seed, keyword) {
    const combined = seed + keyword;
    const hash = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Hex);
    let state = parseInt(hash.substring(0, 8), 16);
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x80000000;
    };
}

// ฟังก์ชันเข้ารหัสแบบ ThaiEng
function encodeThaiEng(text, seed, keyword) {
    if (!keyword) {
        return text;
    }

    const prng = createPRNG(seed, keyword);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const index = ALLOWED_CHARS.indexOf(char);
        if (index !== -1) {
            const shift = Math.floor(prng() * ALLOWED_CHARS.length);
            const newIndex = (index + shift) % ALLOWED_CHARS.length;
            result += ALLOWED_CHARS[newIndex]; // เปลี่ยนเป็นตัวอักษรใหม่ตามตำแหน่งที่สลับ
        } else {
            result += char; // เก็บตัวอักษรเดิมถ้าไม่พบใน ALLOWED_CHARS
        }
    }
    return result;
}

// ฟังก์ชันถอดรหัสแบบ ThaiEng
function decodeThaiEng(encodedText, seed, keyword) {
    if (!keyword) {
        return encodedText;
    }

    const prng = createPRNG(seed, keyword);
    let result = '';
    for (let i = 0; i < encodedText.length; i++) {
        const char = encodedText[i];
        const index = ALLOWED_CHARS.indexOf(char);
        if (index !== -1) {
            const shift = Math.floor(prng() * ALLOWED_CHARS.length);
            const newIndex = (index - shift + ALLOWED_CHARS.length) % ALLOWED_CHARS.length;
            result += ALLOWED_CHARS[newIndex]; // สลับกลับไปที่ตัวอักษรเดิม
        } else {
            result += char; // เก็บตัวอักษรเดิมถ้าไม่พบใน ALLOWED_CHARS
        }
    }
    return result;
}

// ฟังก์ชันเข้ารหัสหลัก
function encrypt(text, keyword) {
    if (!keyword) {
        return text;
    }
    const seed = generateShortSeed();
    return seed + encodeThaiEng(text, seed, keyword);
}

// ฟังก์ชันถอดรหัสหลัก
function decrypt(encodedText, keyword) {
    if (!keyword) {
        return encodedText;
    }
    const seed = encodedText.slice(0, 4);
    const text = encodedText.slice(4);
    return decodeThaiEng(text, seed, keyword);
}

// ฟังก์ชันสร้าง QR code
function generateQRCode(text, hint) {
    const encodedText = encodeURIComponent(text);
    const encodedHint = encodeURIComponent(hint || '');  // Encode hint if provided
    const qrCodeText = `https://jornjud.github.io/Qrkey/decoder.html?text=${encodedText}&hint=${encodedHint}`;
    const qrcode = document.getElementById('qrcode');
    
    if (qrcode) {
        qrcode.innerHTML = "";  // Clear existing QR code

        // Create the QR code
        new QRCode(qrcode, {
            text: qrCodeText,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        qrcode.style.border = '10px solid #FFA500';
        qrcode.style.display = 'inline-block';

        // Image or Emoji at center
        const uploadedImage = document.getElementById('uploadedImage');
        const emoji = document.getElementById('emojiInput').value;

        if (uploadedImage.src && uploadedImage.src !== window.location.href) {
            // If an image is uploaded, show it at the center
            const centerImage = document.createElement('img');
            centerImage.src = uploadedImage.src;
            centerImage.style.position = 'absolute';
            centerImage.style.top = '50%';
            centerImage.style.left = '50%';
            centerImage.style.transform = 'translate(-50%, -50%)';
            centerImage.style.width = '20%';
            centerImage.style.height = '20%';
            centerImage.style.borderRadius = '50%';
            qrcode.appendChild(centerImage);
        } else if (emoji) {
            // If no image, but emoji is provided
            const centerEmoji = document.createElement('div');
            centerEmoji.textContent = emoji;
            centerEmoji.style.position = 'absolute';
            centerEmoji.style.top = '50%';
            centerEmoji.style.left = '50%';
            centerEmoji.style.transform = 'translate(-50%, -50%)';
            centerEmoji.style.fontSize = '48px';  // Adjust emoji size
            qrcode.appendChild(centerEmoji);
        }

        const linkElement = document.getElementById('qrcode-link');
        if (linkElement) {
            linkElement.innerHTML = `<a href="${qrCodeText}" target="_blank">${qrCodeText}</a>`;
        }
    }
}

// ฟังก์ชันอัพโหลดรูปภาพ
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById('uploadedImage');
            imgElement.src = e.target.result;
            imgElement.style.display = 'none';  // Hide actual image but keep data
            updateTranslation();  // Regenerate QR code with image
        };
        reader.readAsDataURL(file);
    }
}

// ฟังก์ชันอัพเดทการแปล
function updateTranslation() {
    const sourceText = document.getElementById("sourceText");
    const keyword = document.getElementById("keyword");
    const hint = document.getElementById("hint");  // New hint input

    if (sourceText && keyword) {
        const targetText = encrypt(sourceText.value, keyword.value);
        generateQRCode(targetText, hint.value);  // Pass the hint value
    }
}

// ฟังก์ชันบันทึก QR code
function saveQRCode() {
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        html2canvas(qrcode).then(canvas => {
            const link = document.createElement('a');
            link.download = 'qrcode.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }
}

// ฟังก์ชันแชร์ QR code
function shareQRCode() {
    const qrcode = document.getElementById('qrcode');
    if (qrcode) {
        html2canvas(qrcode).then(canvas => {
            canvas.toBlob(blob => {
                const file = new File([blob], "qrcode.png", { type: "image/png" });
                if (navigator.share) {
                    navigator.share({
                        title: 'SQRC QR Code',
                        text: 'Check out this SQRC QR Code',
                        files: [file]
                    }).catch(console.error);
                } else {
                    alert('Web Share API is not supported in your browser. You can save the QR code and share it manually.');
                }
            });
        });
    }
}

// ฟังก์ชันคัดลอกลิงก์ไปยังคลิปบอร์ด
function copyToClipboard() {
    const qrcodeLink = document.getElementById('qrcode-link');
    if (qrcodeLink) {
        const link = qrcodeLink.textContent;
        navigator.clipboard.writeText(link).then(() => {
            alert('คัดลอกลิงก์แล้ว!');
        }).catch(err => {
            console.error('ไม่สามารถคัดลอกข้อความ: ', err);
        });
    }
}

// Event listeners สำหรับการใช้งาน
document.addEventListener('DOMContentLoaded', function() {
    const convertButton = document.getElementById('convertButton');
    const saveButton = document.getElementById('saveButton');
    const shareButton = document.getElementById('shareButton');
    const copyButton = document.getElementById('copyButton');
    const imageUpload = document.getElementById('imageUpload');
    const sourceText = document.getElementById('sourceText');
    const keyword = document.getElementById('keyword');
    const hint = document.getElementById('hint');  // New hint input

    if (convertButton) convertButton.addEventListener('click', updateTranslation);
    if (saveButton) saveButton.addEventListener('click', saveQRCode);
    if (shareButton) shareButton.addEventListener('click', shareQRCode);
    if (copyButton) copyButton.addEventListener('click', copyToClipboard);
    if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
    if (sourceText) sourceText.addEventListener('input', updateTranslation);
    if (keyword) keyword.addEventListener('input', updateTranslation);
    if (hint) hint.addEventListener('input', updateTranslation);  // Update QR on hint input
});
