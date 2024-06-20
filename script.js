
window.onload = function() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch('/verifyToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('registerBtn').style.display = 'none';
                document.getElementById('profileLink').style.display = 'block';
                document.getElementById('cart').style.display = 'block';
            } else {
                localStorage.removeItem('token');
            }
        })
        .catch(error => console.error('Ошибка:', error));
    }
    console.log(localStorage);
    
    
}
document.getElementById('loginBtn').onclick = function() {
    document.getElementById('loginModal').style.display = 'block';
}

document.getElementById('registerBtn').onclick = function() {
    document.getElementById('registerModal').style.display = 'block';
}

document.querySelectorAll('.close').forEach(function(element) {
    element.onclick = function() {
        this.parentElement.parentElement.style.display = 'none';
    }
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
        
    }).then(response => {
        if (!response.ok) throw new Error('Registration failed');
        return response.json();
    }).then(data => {
        document.getElementById('registerModal').style.display = 'none'; 
        localStorage.setItem('token', data.token, ); 
        localStorage.setItem('username', data.username); 
        localStorage.setItem('user_id', data.user_id, ); 
        document.getElementById('loginBtn').style.display = 'none'; 
        document.getElementById('registerBtn').style.display = 'none'; 
        document.getElementById('profileLink').style.display = 'block';
        document.getElementById('cart').style.display = 'block';
        alert('Registered successfully!');
    }).catch(err => {
        alert(err.message);
    });
}

function login(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('loginModal').style.display = 'none'; // Закрываем модальное окно
            localStorage.setItem('token', data.token); // Сохраняем токен
            localStorage.setItem('email', data.email); // Сохраняем email
            localStorage.setItem('user_id', data.userId); // Сохраняем user_id
            localStorage.setItem('username', data.username); // Сохраняем username
            document.getElementById('loginBtn').style.display = 'none'; // Скрываем кнопку входа
            document.getElementById('registerBtn').style.display = 'none'; // Скрываем кнопку регистрации
            document.getElementById('profileLink').style.display = 'block'; // Показываем профиль
            document.getElementById('cart').style.display = 'block'; // Показываем корзину
        } else {
            alert('Ошибка авторизации: ' + data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
}


// Проверка токена при загрузке страницы




    



function addToCart(product) {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('Пожалуйста, авторизуйтесь, чтобы добавить товар в корзину.');
        return;
    }

    fetch('/api/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, product_id: product.product_id, quantity: 1 })
    })
    .then(response => {
        if (response.ok) {
            alert('Товар добавлен в корзину!');
        } else {
            alert('Ошибка при добавлении товара в корзину.');
        }
    })
    .catch(error => console.error('Ошибка:', error));
}








document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Проверяем, есть ли сохранённая тема в localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    } else {
        // Устанавливаем тему по умолчанию (тёмная)
        body.classList.add('dark-theme');
    }

    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
    });
});