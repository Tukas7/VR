document.addEventListener('DOMContentLoaded', () => {
    const userInfoForm = document.getElementById('userInfoForm');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressTextarea = document.getElementById('address');
    const ordersList = document.getElementById('ordersList');
    const logoutButton = document.getElementById('logoutButton');

    if (userInfoForm && passwordChangeForm && firstNameInput && lastNameInput && emailInput && phoneInput && addressTextarea && ordersList && logoutButton) {
        loadUserProfile(firstNameInput, lastNameInput, emailInput, phoneInput, addressTextarea);
        loadUserOrders(ordersList);
        userInfoForm.addEventListener('submit', (event) => updateUserProfile(event, firstNameInput, lastNameInput, phoneInput, addressTextarea));
        passwordChangeForm.addEventListener('submit', (event) => changeUserPassword(event));
        logoutButton.addEventListener('click', logout);
    } else {
        console.error('Не удалось найти необходимые элементы на странице');
    }
});

async function loadUserProfile(firstNameInput, lastNameInput, emailInput, phoneInput, addressTextarea) {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('Пожалуйста, авторизуйтесь, чтобы просмотреть профиль.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`/api/user/${userId}`);
        const user = await response.json();
        
        firstNameInput.value = user.first_name || '';
        lastNameInput.value = user.last_name || '';
        emailInput.value = user.email;
        phoneInput.value = user.phone || '';
        addressTextarea.value = user.address || '';
    } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error);
        alert('Ошибка загрузки данных профиля.');
    }
}

async function updateUserProfile(event, firstNameInput, lastNameInput, phoneInput, addressTextarea) {
    event.preventDefault();
    const userId = localStorage.getItem('user_id');
    const formData = new FormData(event.target);

    const user = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        address: formData.get('address')
    };

    try {
        const response = await fetch(`/api/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (response.ok) {
            alert('Данные профиля обновлены.');
        } else {
            alert('Ошибка обновления данных профиля.');
        }
    } catch (error) {
        console.error('Ошибка обновления данных профиля:', error);
        alert('Ошибка обновления данных профиля.');
    }
}

async function changeUserPassword(event) {
    event.preventDefault();
    const userId = localStorage.getItem('user_id');
    const formData = new FormData(event.target);

    const passwords = {
        oldPassword: formData.get('oldPassword'),
        newPassword: formData.get('newPassword')
    };

    try {
        const response = await fetch(`/api/user/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwords)
        });

        if (response.ok) {
            alert('Пароль успешно изменен.');
            event.target.reset();
        } else {
            alert('Ошибка при изменении пароля.');
        }
    } catch (error) {
        console.error('Ошибка при изменении пароля:', error);
        alert('Ошибка при изменении пароля.');
    }
}

async function loadUserOrders(ordersList) {
    const userId = localStorage.getItem('user_id');
    try {
        const response = await fetch(`/api/orders/${userId}`);
        const orders = await response.json();
        ordersList.innerHTML = '';

        const orderMap = new Map();

        orders.forEach(order => {
            if (!orderMap.has(order.order_id)) {
                orderMap.set(order.order_id, {
                    order_id: order.order_id,
                    total_amount: order.total_amount,
                    order_date: order.order_date,
                    shipping_address: order.shipping_address,
                    payment_method: order.payment_method,
                    status: order.status,
                    items: []
                });
            }
            orderMap.get(order.order_id).items.push({
                product_name: order.product_name,
                quantity: order.quantity,
                price: order.price
            });
        });

        orderMap.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');

            const orderHeader = document.createElement('h3');
            orderHeader.textContent = `Заказ #${order.order_id}`;

            const orderDate = document.createElement('p');
            orderDate.textContent = `Дата: ${new Date(order.order_date).toLocaleDateString()}`;

            const orderTotal = document.createElement('p');
            orderTotal.textContent = `Сумма: ${order.total_amount} ₽`;

            const orderStatus = document.createElement('p');
            orderStatus.textContent = `Статус: ${order.status}`;

            const orderAddress = document.createElement('p');
            orderAddress.textContent = `Адрес доставки: ${order.shipping_address}`;

            const orderPayment = document.createElement('p');
            orderPayment.textContent = `Метод оплаты: ${order.payment_method}`;

            const itemsList = document.createElement('ul');
            order.items.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.textContent = `${item.product_name} - ${item.quantity} шт. - ${item.price * item.quantity} ₽`;
                itemsList.appendChild(itemLi);
            });

            orderCard.appendChild(orderHeader);
            orderCard.appendChild(orderDate);
            orderCard.appendChild(orderTotal);
            orderCard.appendChild(orderStatus);
            orderCard.appendChild(orderAddress);
            orderCard.appendChild(orderPayment);
            orderCard.appendChild(itemsList);

            ordersList.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        alert('Ошибка загрузки заказов.');
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
