document.addEventListener('DOMContentLoaded', loadCartItems);

async function loadCartItems() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('Пожалуйста, авторизуйтесь, чтобы просмотреть корзину.');
        return;
    }

    const response = await fetch(`/api/cart/${userId}`);
    const cartItems = await response.json();
    const cartList = document.getElementById('cartList');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    cartList.innerHTML = '';
    let totalPrice = 0;

    cartItems.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">Цена: ${item.price} ₽</div>
                <div class="cart-item-quantity">
                    Количество: <input type="number" min="1" value="${item.quantity}" data-id="${item.cart_item_id}" class="quantity-input">
                </div>
            </div>
            <button class="remove-item-button" data-id="${item.cart_item_id}">Удалить</button>
        `;
        cartList.appendChild(cartItem);
        totalPrice += item.price * item.quantity;
    });

    cartTotalPrice.textContent = `${totalPrice} ₽`;

    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll('.remove-item-button').forEach(button => {
        button.addEventListener('click', async (event) => {
            const cartItemId = event.target.getAttribute('data-id');
            await removeCartItem(cartItemId);
            loadCartItems(); // Перезагружаем корзину после удаления элемента
        });
    });

    // Добавляем обработчики для изменения количества товара
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', async (event) => {
            const cartItemId = event.target.getAttribute('data-id');
            const newQuantity = event.target.value;
            await updateCartItemQuantity(cartItemId, newQuantity);
            loadCartItems(); // Перезагружаем корзину после обновления количества
        });
    });
}

async function removeCartItem(cartItemId) {
    const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        alert('Ошибка при удалении товара из корзины.');
    }
}

async function updateCartItemQuantity(cartItemId, quantity) {
    const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
    });
    if (!response.ok) {
        alert('Ошибка при обновлении количества товара в корзине.');
    }
}
