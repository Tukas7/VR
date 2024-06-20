document.addEventListener('DOMContentLoaded', loadOrder);

async function loadOrder() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('Пожалуйста, авторизуйтесь, чтобы оформить заказ.');
        window.location.href = 'login.html';
        return;
    }

    const orderList = document.getElementById('orderList');
    
    try {
        const response = await fetch(`/api/cart/${userId}`);
        const cart = await response.json();

        if (cart.length === 0) {
            orderList.innerHTML = '<li>Ваша корзина пуста.</li>';
            return;
        }

        cart.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - ${item.quantity} шт. - ${item.price * item.quantity} ₽`;
            orderList.appendChild(li);
        });

        document.getElementById('orderForm').addEventListener('submit', (event) => placeOrder(event, userId, cart));
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        alert('Ошибка загрузки корзины.');
    }
}

async function placeOrder(event, userId, cart) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const orderDetails = {
        userId: userId,
        cartItems: cart.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price
        })),
        totalAmount: cart.reduce((total, item) => total + item.price * item.quantity, 0),
        shippingAddress: formData.get('shippingAddress'),
        paymentMethod: formData.get('paymentMethod')
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderDetails)
        });

        if (response.ok) {
            alert('Заказ успешно оформлен!');
            // Здесь можно добавить логику для очистки корзины в базе данных
            window.location.href = 'profile.html'; // Перенаправить на страницу профиля
        } else {
            alert('Ошибка при оформлении заказа.');
        }
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        alert('Ошибка при оформлении заказа.');
 
    }
}