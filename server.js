
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;

// Налаштування
const SECRET_KEY = 'TarasYurkiv';
const MY_LIST_NUMBER = 15;

// Обробка JSON
app.use(express.json());

// SHA-256 без солі
function hashPassword(password) {
    return crypto.createHash('sha256')
        .update(password, 'utf8')
        .digest('hex');
}

// База трьох користувачів для лабораторної
// У реальному проєкті користувачів варто зберігати в БД.
const usersDb = {
    Yurkiv: {
        id: 15,
        passwordHash: hashPassword('Taras')
    },
    Senkiv: {
        id: 14,
        passwordHash: hashPassword('Yuriy')
    },
    Ata: {
        id: 16,
        passwordHash: hashPassword('Andriy')
    }
};

// Middleware перевірки JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Токен відсутній! Доступ заборонено.'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: 'Токен порожній!'
        });
    }

    jwt.verify(
        token,
        SECRET_KEY,
        { algorithms: ['HS256'] },
        (err, decoded) => {
            if (err) {
                const message =
                    err.name === 'TokenExpiredError'
                        ? 'Час дії токена закінчився!'
                        : 'Невалідний токен!';

                return res.status(401).json({ message });
            }

            // Додаткова перевірка даних токена
            if (
                !decoded ||
                typeof decoded.login !== 'string' ||
                typeof decoded.id !== 'number'
            ) {
                return res.status(401).json({
                    message: 'Токен не містить коректних даних!'
                });
            }

            req.user = {
                login: decoded.login,
                id: decoded.id
            };

            next();
        }
    );
}

// Головна сторінка
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Стилі та клієнтський JavaScript
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

// Вхід у систему
// POST /login перевіряє логін і пароль та видає JWT.
// Цей маршрут має бути доступним без попереднього токена.
app.post('/login', (req, res) => {
    const { login, password } = req.body ?? {};

    if (
        typeof login !== 'string' ||
        typeof password !== 'string' ||
        !login.trim() ||
        !password
    ) {
        return res.status(400).json({
            message: 'Введіть логін і пароль!'
        });
    }

    const normalizedLogin = login.trim();
    const user = usersDb[normalizedLogin];

    if (!user) {
        return res.status(401).json({
            message: 'Невірний логін або пароль!'
        });
    }

    const enteredHash = hashPassword(password);

    // Порівнюємо SHA-256 введеного пароля з хешем у базі
    if (enteredHash !== user.passwordHash) {
        return res.status(401).json({
            message: 'Невірний логін або пароль!'
        });
    }

    const payload = {
        login: normalizedLogin,
        id: user.id
    };

    const token = jwt.sign(payload, SECRET_KEY, {
        algorithm: 'HS256',
        expiresIn: `${MY_LIST_NUMBER}m`
    });

    return res.status(200).json({
        message: `Користувача ${normalizedLogin} успішно авторизовано!`,
        token,
        user: {
            login: normalizedLogin,
            id: user.id
        }
    });
});

// Захищений маршрут /login.
// Доступний лише з валідним Bearer-токеном.
app.get('/login', verifyToken, (req, res) => {
    res.json({
        message: `Користувача ${req.user.login} успішно авторизовано!`,
        login: req.user.login,
        id: req.user.id
    });
});

// Окремий захищений маршрут для перевірки JWT
app.get('/protected', verifyToken, (req, res) => {
    res.json({
        message: `JWT підтверджено! Ви авторизовані як ${req.user.login}.`,
        login: req.user.login,
        id: req.user.id
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});

module.exports = app;