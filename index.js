document.addEventListener('DOMContentLoaded', loadFeaturedProducts, loadSlides());

async function loadFeaturedProducts() {
    const response = await fetch('/api/featured-products');
    const products = await response.json();
    const featuredProductsContainer = document.getElementById('featuredProducts');

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        const productImage = document.createElement('img');
        productImage.src = product.imageUrl;
        productImage.alt = product.name;

        const productName = document.createElement('h3');
        productName.textContent = product.name;
        productName.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.product_id}`;
        });

        const productBrand = document.createElement('p');
        productBrand.textContent = `Бренд: ${product.Brand}`;

        const productPrice = document.createElement('p');
        productPrice.textContent = `Цена: ${product.price} ₽`;
        productPrice.classList.add('price');

        const addToCartButton = document.createElement('button');
        addToCartButton.textContent = 'Добавить в корзину';
        addToCartButton.addEventListener('click', () => addToCart(product));

        const badge = document.createElement('div');
        badge.textContent = 'Рекомендуемый';
        badge.classList.add('badge');

        productCard.appendChild(badge);
        productCard.appendChild(productImage);
        productCard.appendChild(productName);
        productCard.appendChild(productBrand);
        productCard.appendChild(productPrice);
        productCard.appendChild(addToCartButton);

        featuredProductsContainer.appendChild(productCard);
        
    });
}

function loadSlides() {
    fetch('/slides')
    .then(response => response.json())
    .then(slides => {
        const sliderContainer = document.getElementById('sliderContainer');
        sliderContainer.innerHTML = ''; // Очищаем контейнер

        slides.forEach(slide => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide';
            slideElement.innerHTML = `
                <div class="slide-content">
                    <img src="${slide.imageUrl}" alt="${slide.description}">
                    <div class="slide-text">
                        <h2>${slide.modelName}</h2>
                        <p>${slide.description}</p>
                        <a href="catalog.html" class="slide-button">Узнать больше</a>
                    </div>
                </div>
            `;
            sliderContainer.appendChild(slideElement);
        });

        // Инициализация слайдера
        $('#sliderContainer').slick({
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 2000,
            arrows: true,
            dots: true
        });
    })
    .catch(error => console.error('Ошибка загрузки слайдов:', error));
}