// Импорт необходимых библиотек и модулей
const cors = require('cors');
const sql = require('mssql');
const express = require('express');
const multer = require('multer');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 9000;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SECRET_KEY = '1234';

app.use(express.json()); // Для разбора JSON-форматированных тел запросов
app.use(cors()); // Для обработки CORS-запросов, если фронтенд будет на другом домене
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.static(path.join(__dirname)));

const config = {
    user: 'Ilusha',
    password: 'qwerty123321F',
    server: '92.53.107.236',
    database: 'VR',
    
    options: {
        encrypt: true,
        trustServerCertificate: true // Игнорировать ошибки сертификата
    }
};

sql.connect(config)
  .then(() => console.log('Connected to the Database!'))
  .catch(err => console.error('Could not connect to the database!', err));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, 'img/'); // Папка для сохранения изображений
  },
  filename: function(req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Добавляем временную метку к имени файла для уникальности
  }
});
const upload = multer({ storage: storage });

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
  
    try {
        const result = await sql.query`
            INSERT INTO Users (username, email, password) 
            OUTPUT INSERTED.user_id 
            VALUES (${username}, ${email}, ${hashedPassword})
        `;
        const user_id = result.recordset[0].user_id;
        const token = jwt.sign({ user_id, email }, SECRET_KEY, { expiresIn: '1h' });
        res.status(201).json({ message: 'User registered!', token, username, user_id });
    } catch (err) {
        res.status(500).send('Error registering user: ' + err.message);
    }
  });
  

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
        const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ userId: user.user_id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
                res.json({ success: true, token, userId: user.user_id, email: user.email, username: user.username, message: "Авторизация успешна" });
            } else {
                res.status(401).send('Неверный пароль');
            }
        } else {
            res.status(404).send('Пользователь не найден');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера при попытке входа');
    }
  });
  

// Маршрут для проверки токена
app.post('/verifyToken', (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Токен не предоставлен' });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Неверный токен' });
    }
});
app.get('/slides', async (req, res) => {
    try {
        const result = await sql.query`SELECT id, imageUrl, description, modelName FROM Slides`;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching slides: ' + err.message);
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Products`;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching products: ' + err.message);
    }
});
// Маршрут для создания продукта
app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, description, price, stock, Brand } = req.body;
    
    const isFeatured = req.body.isFeatured === 'true' ? 1 : 0;
    const imageUrl = req.file ? `/img/${req.file.filename}` : null;
    try {
        await sql.query`
            INSERT INTO Products (name, description, price, stock, Brand, isFeatured, imageUrl)
            VALUES (${name}, ${description}, ${price}, ${stock}, ${Brand}, ${isFeatured}, ${imageUrl})
        `;
        res.status(201).send('Товар успешно создан');
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).send('Ошибка при создании товара');
    }
});

// Маршрут для обновления товара с изображением
app.put('/admin/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    
    
    const { name, description, price, stock, brand, oldImageUrl } = req.body;
    
    const isFeatured = req.body.isFeatured === 'on' ? 1 : 0;
    const imageUrl = req.file ? `/img/${req.file.filename}` : oldImageUrl;
    
    try {
        await sql.query`UPDATE Products SET name = ${name}, description = ${description}, price = ${price}, stock = ${stock},  imageUrl = ${imageUrl}, isFeatured = ${isFeatured}, Brand = ${brand} WHERE product_id = ${id}`;

        if (req.file && oldImageUrl) {
            fs.unlink(path.join(__dirname, oldImageUrl), err => {
                if (err) {
                    console.error('Error deleting old image:', err);
                }
            });
        }

        res.status(200).send('Product updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating product: ' + err.message);
    }
});

// Маршрут для удаления продукта
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Products WHERE product_id = ${id}`;
        res.status(200).send('Товар успешно удален');
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).send('Ошибка при удалении товара');
    }
});



app.get('/api/slides', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Slides`;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching slides:', err);
        res.status(500).send('Ошибка при получении слайдов');
    }
});
// Маршрут для добавления слайда
app.post('/api/slides', upload.single('image'), async (req, res) => {
    const { description, modelName } = req.body;
    const image = req.file ? `/img/${req.file.filename}` : null;

    try {
        await sql.query`
            INSERT INTO Slides (description, modelName, imageUrl)
            VALUES (${description}, ${modelName}, ${image})
        `;
        res.status(201).send('Слайд успешно создан');
    } catch (err) {
        console.error('Ошибка при создании слайда:', err);
        res.status(500).send('Ошибка при создании слайда');
    }
});

// Маршрут для удаления слайда
app.delete('/api/slides/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Slides WHERE id = ${id}`;
        res.status(200).send('Слайд успешно удален');
    } catch (err) {
        console.error('Error deleting slide:', err);
        res.status(500).send('Ошибка при удалении слайда');
    }
});

// Маршрут для обновления слайда



// Маршрут для получения рекомендуемых товаров
app.get('/api/featured-products', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Products WHERE isFeatured = 1`;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching featured products: ' + err.message);
    }
});

// Маршрут для получения данных о конкретном товаре
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await sql.query`SELECT * FROM Products WHERE product_id = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching product: ' + err.message);
    }
});


app.get('/api/products/:id/reviews', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await sql.query`
            SELECT Reviews.*, Users.username 
            FROM Reviews 
            JOIN Users ON Reviews.user_id = Users.user_id 
            WHERE Reviews.product_id = ${id}`;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching reviews: ' + err.message);
    }
});

// Маршрут для добавления отзыва о конкретном товаре



app.post('/api/products/:id/reviews', async (req, res) => {
    const { id } = req.params;
    const { user_id, rating, comment } = req.body;

    try {
        await sql.query`INSERT INTO Reviews (user_id, product_id, rating, comment) VALUES (${user_id}, ${id}, ${rating}, ${comment})`;
        res.status(201).send('Review added successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding review: ' + err.message);
    }
});


app.post('/api/cart', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    try {
        const result = await sql.query`SELECT * FROM CartItems WHERE user_id = ${user_id} AND product_id = ${product_id}`;
        if (result.recordset.length > 0) {
            // Если товар уже в корзине, обновляем его количество
            const cartItem = result.recordset[0];
            const newQuantity = cartItem.quantity + quantity;
            await sql.query`UPDATE CartItems SET quantity = ${newQuantity} WHERE cart_item_id = ${cartItem.cart_item_id}`;
            res.status(200).send('Cart item quantity updated');
        } else {
            // Если товара нет в корзине, добавляем его
            await sql.query`INSERT INTO CartItems (user_id, product_id, quantity) VALUES (${user_id}, ${product_id}, ${quantity})`;
            res.status(201).send('Item added to cart');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding item to cart: ' + err.message);
    }
});

// Маршрут для получения товаров в корзине пользователя
app.get('/api/cart/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const result = await sql.query`
            SELECT CartItems.*, Products.name, Products.price, Products.imageUrl
            FROM CartItems 
            JOIN Products ON CartItems.product_id = Products.product_id 
            WHERE CartItems.user_id = ${user_id}`;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching cart items: ' + err.message);
    }
});

app.delete('/api/cart/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;

    try {
        await sql.query`DELETE FROM CartItems WHERE cart_item_id = ${cart_item_id}`;
        res.status(200).send('Item removed from cart');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error removing item from cart: ' + err.message);
    }
});

app.put('/api/cart/:cart_item_id', async (req, res) => {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    try {
        await sql.query`UPDATE CartItems SET quantity = ${quantity} WHERE cart_item_id = ${cart_item_id}`;
        res.status(200).send('Cart item quantity updated');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating cart item quantity: ' + err.message);
    }
});


app.get('/api/productss', async (req, res) => {
    const { brand, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM Products WHERE 1=1';
    let request = new sql.Request();

    console.log('Received filters:', { brand, minPrice, maxPrice }); // Логирование полученных фильтров

    if (brand) {
        query += ' AND Brand = @brand';
        request.input('brand', sql.VarChar(50), brand);
    }
    if (minPrice) {
        const minPriceFloat = parseFloat(minPrice);
        if (!isNaN(minPriceFloat)) {
            query += ' AND price >= @minPrice';
            request.input('minPrice', sql.Decimal(10, 2), minPriceFloat);
        } else {
            console.error('Invalid minPrice:', minPrice);
        }
    }
    if (maxPrice) {
        const maxPriceFloat = parseFloat(maxPrice);
        if (!isNaN(maxPriceFloat)) {
            query += ' AND price <= @maxPrice';
            request.input('maxPrice', sql.Decimal(10, 2), maxPriceFloat);
        } else {
            console.error('Invalid maxPrice:', maxPrice);
        }
    }

    console.log('Final query:', query); // Логирование окончательного запроса

    try {
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).send('Error filtering products: ' + err.message);
    }
});















app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await sql.query`SELECT * FROM Users WHERE user_id = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).send('User not found');
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user data: ' + err.message);
    }
});

app.put('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone, address } = req.body;

    try {
        await sql.query`UPDATE Users SET first_name = ${firstName}, last_name = ${lastName}, phone = ${phone}, address = ${address} WHERE user_id = ${id}`;
        res.send('User updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating user data: ' + err.message);
    }
});


app.put('/api/user/:id/password', async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    try {
        const result = await sql.query`SELECT password FROM Users WHERE user_id = ${id}`;
        if (result.recordset.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('Old password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sql.query`UPDATE Users SET password = ${hashedPassword} WHERE user_id = ${id}`;
        res.send('Password updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating password: ' + err.message);
    }
});

app.post('/api/orders', async (req, res) => {
    const { userId, cartItems, totalAmount, shippingAddress, paymentMethod } = req.body;
    let transaction;
    
    
    try {
        transaction = new sql.Transaction();
        await transaction.begin();

        const orderRequest = new sql.Request(transaction);
        const orderResult = await orderRequest
            .input('userId', sql.Int, userId)
            .input('totalAmount', sql.Decimal(10, 2), totalAmount)
            .input('shippingAddress', sql.NVarChar(255), shippingAddress)
            .input('paymentMethod', sql.NVarChar(50), paymentMethod)
            .query(`
                INSERT INTO Orders (user_id, total_amount, shipping_address, payment_method)
                VALUES (@userId, @totalAmount, @shippingAddress, @paymentMethod );
                SELECT SCOPE_IDENTITY() AS order_id;
            `);

        const orderId = orderResult.recordset[0].order_id;

        for (const item of cartItems) {
            const itemRequest = new sql.Request(transaction);
            await itemRequest
                .input('orderId', sql.Int, orderId)
                .input('productId', sql.Int, item.productId)
                .input('quantity', sql.Int, item.quantity)
                .input('price', sql.Decimal(10, 2), item.price)
                .query(`
                    INSERT INTO OrderItems (order_id, product_id, quantity, price)
                    VALUES (@orderId, @productId, @quantity, @price);
                `);
        }

        await transaction.commit();
        res.status(201).send('Order placed successfully');
    } catch (err) {
        console.error(err);
        if (transaction) {
            await transaction.rollback();
        }
        res.status(500).send('Error placing order: ' + err.message);
    }
});

app.get('/api/orders/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await sql.query`
            SELECT o.order_id, o.total_amount, o.order_date, o.shipping_address, o.payment_method, o.status,
                   p.product_id, p.name AS product_name, p.price, oi.quantity
            FROM Orders o
            JOIN OrderItems oi ON o.order_id = oi.order_id
            JOIN Products p ON oi.product_id = p.product_id
            WHERE o.user_id = ${userId}
            ORDER BY o.order_date DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders: ' + err.message);
    }
});



// Маршруты для получения отзывов с именами пользователей
app.get('/api/reviews', async (req, res) => {
    const { product_id } = req.query;
    try {
        const result = await sql.query`
            SELECT Reviews.review_id, Reviews.comment, Reviews.rating, Users.username
            FROM Reviews
            JOIN Users ON Reviews.user_id = Users.user_id
            WHERE Reviews.product_id = ${product_id}
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send('Ошибка при получении отзывов');
    }
});

// Маршрут для удаления отзыва
app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.query`DELETE FROM Reviews WHERE review_id = ${id}`;
        res.status(200).send('Отзыв успешно удален');
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Ошибка при удалении отзыва');
    }
});

// Маршрут для получения заказов
app.get('/api/orders', async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Orders`;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).send('Ошибка при получении заказов');
    }
});

// Маршрут для обновления статуса заказа
app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await sql.query`UPDATE Orders SET status = ${status} WHERE order_id = ${id}`;
        res.status(200).send('Статус заказа успешно обновлен');
    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).send('Ошибка при обновлении статуса заказа');
    }
});


// Маршрут для получения статистики
app.get('/api/statistics', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT TOP 10 product_id, COUNT(*) AS order_count
            FROM OrderItems
            GROUP BY product_id
            ORDER BY order_count DESC
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching statistics:', err);
        res.status(500).send('Error fetching statistics');
    }
});
app.get('/api/orders/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await sql.query`
            SELECT Products.name AS product_name, OrderItems.quantity, OrderItems.price
            FROM OrderItems
            JOIN Products ON OrderItems.product_id = Products.product_id
            WHERE OrderItems.order_id = ${id}
        `;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).send('Ошибка при получении деталей заказа');
    }
});

// Маршрут для получения статистики
app.get('/api/statistics', async (req, res) => {
    try {
        
        const result = await sql.query`
            SELECT TOP 10 
                Products.name AS product_name, 
                COUNT(OrderItems.product_id) AS order_count, 
                SUM(OrderItems.price * OrderItems.quantity) AS total_sales
            FROM OrderItems
            JOIN Products ON OrderItems.product_id = Products.product_id
            GROUP BY Products.name
            ORDER BY order_count DESC
        `;
        
        res.json(result.recordset);
        
    } catch (err) {
        console.error('Error fetching statistics:', err);
        res.status(500).send('Ошибка при получении статистики');
    }
});
