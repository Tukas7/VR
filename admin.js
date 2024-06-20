document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadSlides();
    loadReviews();
    loadOrders();
    loadStatistics();

    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('slideForm').addEventListener('submit', saveSlide);
});

async function loadProducts() {
    const response = await fetch('/api/products');
    const products = await response.json();
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    products.forEach(product => {
        const li = document.createElement('li');
        li.textContent = `${product.name} - ${product.price} ₽`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Редактировать';
        editButton.classList.add('edit');
        editButton.addEventListener('click', () => editProduct(product));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => deleteProduct(product.product_id));

        const reviewButton = document.createElement('button');
        reviewButton.textContent = 'Отзывы';
        reviewButton.classList.add('reviews');
        reviewButton.addEventListener('click', () => loadProductReviews(product.product_id));

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        li.appendChild(reviewButton);

        productList.appendChild(li);
    });
}

async function loadSlides() {
    const response = await fetch('/api/slides');
    const slides = await response.json();
    const slideList = document.getElementById('slideList');
    slideList.innerHTML = '';

    slides.forEach(slide => {
        const li = document.createElement('li');
        li.textContent = `${slide.modelName} - ${slide.description}`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Редактировать';
        editButton.classList.add('edit');
        editButton.addEventListener('click', () => editSlide(slide));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => deleteSlide(slide.id));

        li.appendChild(editButton);
        li.appendChild(deleteButton);

        slideList.appendChild(li);
    });
}

async function loadReviews() {
    const response = await fetch('/api/reviews');
    const reviews = await response.json();
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';

    reviews.forEach(review => {
        const li = document.createElement('li');
        li.textContent = `${review.username}: ${review.comment} (${review.rating} звезд)`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => deleteReview(review.review_id));

        li.appendChild(deleteButton);

        reviewList.appendChild(li);
    });
}

async function loadOrders() {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

    orders.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `Заказ #${order.order_id} - ${order.total_amount} ₽ - ${order.status}`;

        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'Детали';
        detailsButton.classList.add('edit');
        detailsButton.addEventListener('click', () => loadOrderDetails(order.order_id));

        const statusSelect = document.createElement('select');
        ['В процессе', 'Доставляется', 'Доставлен', 'Получен'].forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            if (status === order.status) {
                option.selected = true;
            }
            statusSelect.appendChild(option);
        });
        statusSelect.addEventListener('change', () => updateOrderStatus(order.order_id, statusSelect.value));

        li.appendChild(detailsButton);
        li.appendChild(statusSelect);

        orderList.appendChild(li);
    });
}

async function loadStatistics() {
    const response = await fetch('/api/statistics');
    const statistics = await response.json();
    const statisticsList = document.getElementById('statisticsList');
    statisticsList.innerHTML = '';

    statistics.forEach(stat => {
        const li = document.createElement('li');
        li.textContent = `Товар: ${stat.product_name} - Количество заказов: ${stat.order_count} - Итоговая сумма продаж: ${stat.total_sales} ₽`;

        statisticsList.appendChild(li);
    });
}

async function saveProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productId = formData.get('productId');
    console.log(formData);
    const method = productId ? 'PUT' : 'POST';
    const endpoint = productId ? `/admin/products/${productId}` : '/api/products';

    try {
        const response = await fetch(endpoint, {
            method: method,
            body: formData
        });
        if (response.ok) {
            alert('Товар успешно сохранен');
            loadProducts();
            event.target.reset(); // Сбросить форму после сохранения
        } else {
            alert('Ошибка при сохранении товара');
        }
    } catch (error) {
        console.error('Ошибка при сохранении товара:', error);
        alert('Ошибка при сохранении товара');
    }
}




async function saveSlide(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch('/api/slides', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('Слайд успешно сохранен');
            loadSlides();
        } else {
            alert('Ошибка при сохранении слайда');
        }
    } catch (error) {
        console.error('Ошибка при сохранении слайда:', error);
        alert('Ошибка при сохранении слайда');
    }
}

document.getElementById('slideForm').addEventListener('submit', saveSlide);

async function editProduct(product) {
    console.log(product);
    document.getElementById('productId').value = product.product_id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('Brand').value = product.Brand;
    document.getElementById('isFeatured').checked = product.isFeatured;
}

async function deleteProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Товар успешно удален');
            loadProducts();
        } else {
            alert('Ошибка при удалении товара');
        }
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        alert('Ошибка при удалении товара');
    }
}

async function editSlide(slide) {
    document.getElementById('slideId').value = slide.id;
    
    document.getElementById('slideDescription').value = slide.description;
    document.getElementById('slideModelName').value = slide.modelName;

}

async function deleteSlide(slideId) {
    try {
        const response = await fetch(`/api/slides/${slideId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Слайд успешно удален');
            loadSlides();
        } else {
            alert('Ошибка при удалении слайда');
        }
    } catch (error) {
        console.error('Ошибка при удалении слайда:', error);
        alert('Ошибка при удалении слайда');
    }
}

async function deleteReview(reviewId) {
    try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('Отзыв успешно удален');
            loadReviews();
        } else {
            alert('Ошибка при удалении отзыва');
        }
    } catch (error) {
        console.error('Ошибка при удалении отзыва:', error);
        alert('Ошибка при удалении отзыва');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            alert('Статус заказа успешно обновлен');
            loadOrders();
        } else {
            alert('Ошибка при обновлении статуса заказа');
        }
    } catch (error) {
        console.error('Ошибка при обновлении статуса заказа:', error);
        alert('Ошибка при обновлении статуса заказа');
    }
}

async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/reviews?product_id=${productId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const reviews = await response.json();
        const reviewList = document.getElementById('reviewList');
        reviewList.innerHTML = '';

        reviews.forEach(review => {
            const li = document.createElement('li');
            li.textContent = `${review.username}: ${review.comment} (${review.rating} звезд)`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.classList.add('delete');
            deleteButton.addEventListener('click', () => deleteReview(review.review_id));

            li.appendChild(deleteButton);

            reviewList.appendChild(li);
        });
    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
    }
}

async function loadOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/details`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const orderDetails = await response.json();
        const orderDetailsList = document.getElementById('orderDetailsList');
        orderDetailsList.innerHTML = '';

        orderDetails.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.product_name} - ${item.quantity} шт. - ${item.price} ₽`;

            orderDetailsList.appendChild(li);
        });

        const detailsSection = document.querySelector('.order-details');
        detailsSection.style.display = 'block';
    } catch (error) {
        console.error('Ошибка при загрузке деталей заказа:', error);
    }
}
