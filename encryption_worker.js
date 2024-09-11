// encryption_worker.js

// ตัวอักษรที่อนุญาตในการเข้ารหัส
const ALLOWED_CHARS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ' +
                      'ะาำิีึืุูเแโใไ' + 
                      '่้๊๋์' + 
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
            result += ALLOWED_CHARS[newIndex]; 
        } else {
            result += char; 
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
            result += ALLOWED_CHARS[newIndex];
        } else {
            result += char;
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

self.onmessage = function(event) {
    if (event.data.action === 'encrypt') {
        const text = event.data.text;
        const keyword = event.data.keyword;
        const encryptedText = encrypt(text, keyword);
        self.postMessage(encryptedText);
    }
};