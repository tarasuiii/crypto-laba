
'use strict';

// ==========================================
// 1. ТЕМА САЙТУ
// ==========================================

function toggleTheme() {
    document.body.classList.toggle('dark-mode');

    const btn = document.getElementById('theme-toggle');

    btn.innerText = document.body.classList.contains('dark-mode')
        ? '☀️ Світла тема'
        : '🌙 Темна тема';
}


// ==========================================
// 2. НАВІГАЦІЯ
// ==========================================

function openCipher(cipherType) {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('workspace-screen').classList.remove('hidden');

    if (cipherType === 'caesar') {
        document.getElementById('workspace-title').innerText = 'Шифр Цезаря';
        document.getElementById('caesar-controls').classList.remove('hidden');
        document.getElementById('trans-controls').classList.add('hidden');
    } else {
        document.getElementById('workspace-title').innerText = 'Шифр перестановки';
        document.getElementById('caesar-controls').classList.add('hidden');
        document.getElementById('trans-controls').classList.remove('hidden');
    }

    updateHash();
}

function goHome() {
    document.getElementById('workspace-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');

    document.getElementById('brute-force-output').classList.add('hidden');
    document.getElementById('frequency-output').classList.add('hidden');
    document.getElementById('matrix-output').classList.add('hidden');

    const toggleBtn = document.getElementById('toggle-matrix-btn');
    toggleBtn.classList.add('hidden');
    toggleBtn.innerText = '👁️ Показати матрицю';

    document.getElementById('main-text').value = '';
    document.getElementById('file-input').value = '';

    updateHash();
}

function showHome() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('workspace-screen').classList.add('hidden');
    document.getElementById('home-screen').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('workspace-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}


// ==========================================
// 3. SHA-256 ДЛЯ ТЕКСТУ
// ==========================================

async function updateHash() {
    const text = document.getElementById('main-text').value;
    const hashSpan = document.getElementById('text-hash');

    if (!text) {
        hashSpan.innerText = 'Відсутній (порожній текст)';
        return;
    }

    try {
        const buffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);

        hashSpan.innerText = Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    } catch (error) {
        hashSpan.innerText = 'Помилка обчислення';
    }
}

document.getElementById('main-text').addEventListener('input', updateHash);


// ==========================================
// 4. РОБОТА З ФАЙЛАМИ
// ==========================================

document.getElementById('file-input').addEventListener('change', function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        document.getElementById('main-text').value = e.target.result;
        updateHash();
    };

    reader.onerror = function () {
        alert('Не вдалося прочитати файл!');
    };

    reader.readAsText(file);
    event.target.value = '';
});

function downloadResult() {
    const text = document.getElementById('main-text').value;

    if (!text) {
        alert('Немає тексту для збереження!');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'crypto_result.txt';
    link.click();

    URL.revokeObjectURL(url);
}

async function copyResult() {
    const text = document.getElementById('main-text').value;

    if (!text) {
        alert('Немає тексту для копіювання!');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        alert('Текст скопійовано!');
    } catch (error) {
        alert('Не вдалося скопіювати текст. Перевірте дозволи браузера.');
    }
}


// ==========================================
// 5. ШИФР ЦЕЗАРЯ
// ==========================================

const ALPHABETS = {
    en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    uk: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'
};

const DICTIONARY = {
    uk: [
        ' В ', ' НА ', ' І ', ' З ', ' ТА ', ' ЩО ',
        ' ЯК ', ' МИ ', ' ЦЕ ', ' ВОНО ', ' ТАК ',
        ' ДО ', ' ПО ', ' НЕ ', ' А '
    ],
    en: [
        ' THE ', ' IN ', ' AND ', ' TO ', ' OF ',
        ' A ', ' IS ', ' IT ', ' YOU ', ' THAT ',
        ' HE ', ' WAS ', ' FOR ', ' ON ', ' ARE ', ' WITH '
    ]
};

function getCaesarResult(text, lang, key, action) {
    const alphabet = ALPHABETS[lang];
    const n = alphabet.length;

    key = ((key % n) + n) % n;

    if (action === 'decrypt') {
        key = (n - key) % n;
    }

    let result = '';

    for (const char of text) {
        const upperChar = char.toUpperCase();
        const idx = alphabet.indexOf(upperChar);

        if (idx === -1) {
            result += char;
            continue;
        }

        const newChar = alphabet[(idx + key) % n];

        result += char === upperChar
            ? newChar
            : newChar.toLowerCase();
    }

    return result;
}

function processCaesar(action) {
    const text = document.getElementById('main-text').value;
    const lang = document.getElementById('caesar-lang').value;
    const key = Number(document.getElementById('caesar-key').value);

    if (!text || !Number.isInteger(key) || key < 1) {
        alert('Введіть текст і цілий ключ від 1 до довжини алфавіту!');
        return;
    }

    document.getElementById('main-text').value =
        getCaesarResult(text, lang, key, action);

    document.getElementById('brute-force-output').classList.add('hidden');
    document.getElementById('frequency-output').classList.add('hidden');

    updateHash();
}

function bruteForceCaesar() {
    const text = document.getElementById('main-text').value;
    const lang = document.getElementById('caesar-lang').value;
    const alphabet = ALPHABETS[lang];
    const dict = DICTIONARY[lang];
    const outputBox = document.getElementById('brute-force-output');

    if (!text) {
        alert('Введіть зашифрований текст!');
        return;
    }

    outputBox.innerHTML = '<h3>Можливі варіанти дешифрування:</h3>';

    for (let key = 1; key < alphabet.length; key++) {
        const attempt = getCaesarResult(text, lang, key, 'decrypt');
        const cleanText = ' ' + attempt.toUpperCase() + ' ';
        const score = dict.filter(word => cleanText.includes(word)).length;

        const row = document.createElement('div');
        row.className = 'brute-row' + (score > 0 ? ' best-match' : '');

        const label = document.createElement('strong');
        label.textContent = `Ключ ${key}${score > 0 ? ' ⭐' : ''}: `;

        row.appendChild(label);
        row.appendChild(document.createTextNode(attempt.slice(0, 120)));

        outputBox.appendChild(row);
    }

    outputBox.classList.remove('hidden');
    document.getElementById('frequency-output').classList.add('hidden');
}

function analyzeFrequency() {
    const text = document.getElementById('main-text').value.toUpperCase();
    const lang = document.getElementById('caesar-lang').value;
    const alphabet = ALPHABETS[lang];
    const outputBox = document.getElementById('frequency-output');

    if (!text) {
        alert('Введіть текст для аналізу!');
        return;
    }

    const counts = {};
    let maxChar = '';
    let maxCount = 0;

    for (const char of text) {
        if (alphabet.includes(char)) {
            counts[char] = (counts[char] || 0) + 1;

            if (counts[char] > maxCount) {
                maxCount = counts[char];
                maxChar = char;
            }
        }
    }

    if (maxCount === 0) {
        alert('У тексті немає літер обраного алфавіту.');
        return;
    }

    const expectedChar = lang === 'uk' ? 'О' : 'E';
    const suggestedKey = (
        alphabet.indexOf(maxChar) -
        alphabet.indexOf(expectedChar) +
        alphabet.length
    ) % alphabet.length;

    document.getElementById('freq-suggestion').innerText =
        `Найчастіша літера: ${maxChar} (${maxCount} разів). ` +
        `Припущення: літера ${expectedChar}. ` +
        `Ймовірний ключ: ${suggestedKey}.`;

    const chart = document.getElementById('freq-chart');
    chart.innerHTML = '';

    alphabet.split('').forEach(char => {
        const count = counts[char] || 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-bar-wrapper';

        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${(count / maxCount) * 100}%`;
        bar.title = `${char}: ${count}`;

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = char;

        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        chart.appendChild(wrapper);
    });

    outputBox.classList.remove('hidden');
    document.getElementById('brute-force-output').classList.add('hidden');
}


// ==========================================
// 6. ШИФР ПЕРЕСТАНОВКИ
// ==========================================

function processTransposition(action) {
    const text = document.getElementById('main-text').value;
    const key = document.getElementById('trans-key').value;

    if (!text || !key.trim()) {
        alert('Введіть текст та ключове слово!');
        return;
    }

    // Кожна позиція ключа зберігається окремо,
    // щоб підтримувати повторювані символи.
    const keyChars = key.split('').map((char, index) => ({
        char,
        index
    }));

    keyChars.sort((a, b) => {
        const comparison = a.char.toLowerCase()
            .localeCompare(b.char.toLowerCase());

        return comparison || a.index - b.index;
    });

    const colOrder = keyChars.map(item => item.index);
    const cols = key.length;
    const rows = Math.ceil(text.length / cols);
    const grid = Array.from(
        { length: rows },
        () => Array(cols).fill('')
    );

    let result = '';

    if (action === 'encrypt') {
        let k = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (k < text.length) {
                    grid[r][c] = text[k++];
                }
            }
        }

        for (const colIndex of colOrder) {
            for (let r = 0; r < rows; r++) {
                result += grid[r][colIndex];
            }
        }
    } else {
        const remainder = text.length % cols;
        const fullRows = Math.floor(text.length / cols);

        let k = 0;

        for (const colIndex of colOrder) {
            const columnLength =
                remainder === 0 || colIndex < remainder
                    ? fullRows
                    : fullRows;

            for (let r = 0; r < columnLength; r++) {
                if (k < text.length) {
                    grid[r][colIndex] = text[k++];
                }
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                result += grid[r][c];
            }
        }
    }

    document.getElementById('main-text').value = result;
    updateHash();

    let matrixHtml = '<h3>Структура матриці:</h3>';
    matrixHtml += '<table class="matrix-table"><tr>';

    const displayOrder = Array(cols).fill(0);

    colOrder.forEach((colIndex, i) => {
        displayOrder[colIndex] = i + 1;
    });

    for (let c = 0; c < cols; c++) {
        matrixHtml += `<th>${displayOrder[c]}</th>`;
    }

    matrixHtml += '</tr><tr>';

    for (let c = 0; c < cols; c++) {
        matrixHtml += `<th>${escapeHtml(key[c])}</th>`;
    }

    matrixHtml += '</tr>';

    for (let r = 0; r < rows; r++) {
        matrixHtml += '<tr>';

        for (let c = 0; c < cols; c++) {
            matrixHtml += `<td>${escapeHtml(grid[r][c] || ' ')}</td>`;
        }

        matrixHtml += '</tr>';
    }

    matrixHtml += '</table>';

    const matrixContainer = document.getElementById('matrix-output');
    matrixContainer.innerHTML = matrixHtml;
    matrixContainer.classList.add('hidden');

    const toggleBtn = document.getElementById('toggle-matrix-btn');
    toggleBtn.classList.remove('hidden');
    toggleBtn.innerText = '👁️ Показати матрицю';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toggleMatrix() {
    const matrix = document.getElementById('matrix-output');
    const btn = document.getElementById('toggle-matrix-btn');

    matrix.classList.toggle('hidden');

    btn.innerText = matrix.classList.contains('hidden')
        ? '👁️ Показати матрицю'
        : '🙈 Сховати матрицю';
}


// ==========================================
// 7. АВТОРИЗАЦІЯ
// ==========================================

async function performLogin() {
    const loginInput =
        document.getElementById('login-username').value.trim();

    const passwordInput =
        document.getElementById('login-password').value;

    const errorMsg = document.getElementById('login-error');
    const successMsg = document.getElementById('login-success');
    const loginButton = document.getElementById('login-button');

    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    if (!loginInput || !passwordInput) {
        errorMsg.innerText = 'Введіть логін і пароль!';
        errorMsg.classList.remove('hidden');
        return;
    }

    loginButton.disabled = true;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                login: loginInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMsg.innerText = data.message || 'Помилка авторизації!';
            errorMsg.classList.remove('hidden');
            return;
        }

        // Зберігаємо JWT після успішного входу
        localStorage.setItem('jwt_token', data.token);

        successMsg.innerText = data.message;
        successMsg.classList.remove('hidden');

        document.getElementById('login-password').value = '';

        updateCurrentUser(data.user);

        setTimeout(() => {
            showHome();
        }, 700);

    } catch (error) {
        errorMsg.innerText =
            "Помилка з'єднання із сервером. Перевірте, чи він запущений.";

        errorMsg.classList.remove('hidden');
    } finally {
        loginButton.disabled = false;
    }
}

function updateCurrentUser(user) {
    const element = document.getElementById('current-user');

    if (user) {
        element.textContent = `Авторизований користувач: ${user.login} (ID: ${user.id})`;
    }
}


// ==========================================
// 8. ПЕРЕВІРКА ЗАХИЩЕНИХ МАРШРУТІВ
// ==========================================

async function requestProtectedRoute(route) {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        showLogin();
        throw new Error('JWT-токен не знайдено. Увійдіть у систему.');
    }

    const response = await fetch(route, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('jwt_token');
            showLogin();
        }

        throw new Error(data.message || 'Помилка перевірки токена.');
    }

    return data;
}

async function testProtectedAPI() {
    try {
        // Перевіряємо маршрут /login, який вимагає валідний JWT
        const data = await requestProtectedRoute('/login');

        alert(
            `${data.message}\nID користувача: ${data.id}`
        );

    } catch (error) {
        alert(error.message);
    }
}


// ==========================================
// 9. ВИХІД ІЗ СИСТЕМИ
// ==========================================

function logout() {
    localStorage.removeItem('jwt_token');

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('login-success').classList.add('hidden');
    document.getElementById('current-user').innerText = '';

    showLogin();
}


// ==========================================
// 10. ПЕРЕВІРКА ТОКЕНА ПРИ ЗАПУСКУ
// ==========================================

async function initializeAuth() {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        showLogin();
        return;
    }

    try {
        const data = await requestProtectedRoute('/protected');

        updateCurrentUser({
            login: data.login,
            id: data.id
        });

        showHome();

    } catch (error) {
        showLogin();
    }
}

initializeAuth();
