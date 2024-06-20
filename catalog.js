document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    document.getElementById('filterForm').addEventListener('submit', function(event) {
        event.preventDefault();
        applyFilters();
    });
});

async function loadProducts(filters = {}) {
    let queryString = Object.keys(filters).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(filters[key])).join('&');
    console.log('Query string:', queryString); // Логирование для отладки

    try {
        const response = await fetch(`/api/productss?${queryString}`);
        if (!response.ok) {
            throw new Error('Error fetching products: ' + response.statusText);
        }
        const products = await response.json();
        const productList = document.getElementById('productList');
        productList.innerHTML = '';

        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" data-id="${product.product_id}">
                <h3 data-id="${product.product_id}">${product.name}</h3>
                <div>
                    <p class="brand">Бренд: ${product.Brand}</p>
                    <p class="price">${product.price} ₽</p>
                </div>
                <button class="add-to-cart" data-id="${product.product_id}">Добавить в корзину</button>
            `;
            productList.appendChild(productItem);
        });

        // Добавляем обработчики событий для кнопок "Добавить в корзину"
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCart);
        });

        // Добавляем обработчики событий для заголовков и изображений
        document.querySelectorAll('.product-item h3, .product-item img').forEach(element => {
            element.addEventListener('click', (event) => {
                const productId = event.target.getAttribute('data-id');
                window.location.href = `product.html?id=${productId}`;
            });
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function applyFilters() {
    const formData = new FormData(document.getElementById('filterForm'));
    const filters = {};
    formData.forEach((value, key) => {
        if (value) {
            filters[key] = value;
        }
    });
    console.log('Filters:', filters); // Логирование для отладки
    loadProducts(filters);
}

function addToCart(event) {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('Пожалуйста, авторизуйтесь, чтобы добавить товар в корзину.');
        return;
    }

    const productId = event.target.getAttribute('data-id');
    fetch('/api/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: userId, product_id: productId, quantity: 1 })
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
