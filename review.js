document.addEventListener('DOMContentLoaded', loadProductDetails);

async function loadProductDetails() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        alert('Product ID is missing!');
        return;
    }

    const productResponse = await fetch(`/api/products/${productId}`);
    const product = await productResponse.json();

    if (!product) {
        alert('Product not found!');
        return;
    }

    document.getElementById('productImage').src = product.imageUrl;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productBrand').textContent = `Бренд: ${product.Brand}`;
    document.getElementById('productPrice').textContent = `Цена: ${product.price} ₽`;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productId').value = product.product_id;

    document.getElementById('addToCartButton').addEventListener('click', () => addToCart(product));

    loadReviews(product.product_id);
}

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

async function loadReviews(productId) {
    const response = await fetch(`/api/products/${productId}/reviews`);
    const reviews = await response.json();
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = '';

    reviews.forEach(review => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${review.username}</strong> (${review.rating}/5)<br>${review.comment}`;
        reviewsList.appendChild(li);
    });
}

document.getElementById('reviewForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const userId = localStorage.getItem('user_id');
    if (!userId) {
        document.getElementById('authMessage').style.display = 'block';
        return;
    }

    const formData = new FormData(event.target);
    const review = {
        product_id: formData.get('product_id'),
        user_id: userId,
        rating: formData.get('rating'),
        comment: formData.get('comment')
    };

    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('authMessage').style.display = 'block';
        return;
    }

    const submitResponse = await fetch(`/api/products/${review.product_id}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(review)
    });

    if (submitResponse.ok) {
        loadReviews(review.product_id);
        event.target.reset();
    } else {
        alert('Failed to submit review');
    }
});
