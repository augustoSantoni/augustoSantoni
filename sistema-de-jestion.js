// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCS9IGjLoHV4WyGxOMOxKfCEWGmPvYixfE",
    authDomain: "sistema-de-gestion-6f6ec.firebaseapp.com",
    projectId: "sistema-de-gestion-6f6ec",
    storageBucket: "sistema-de-gestion-6f6ec.firebasestorage.app",
    messagingSenderId: "228239925371",
    appId: "1:228239925371:web:584a7ccec1f291b59742de",
    measurementId: "G-HPBP2GF69T"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias a las colecciones
const productsRef = collection(db, 'products');
const salesRef = collection(db, 'sales');

// Variables globales para almacenar los datos en memoria
let products = [];
let sales = [];

// Función de login (sin cambios)
function login() {
    const password = document.getElementById('passwordInput').value;
    if (password === 'SATA') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
        updateDashboard();
        updateInventoryTable();
        updateSalesTable();
        updateProductSelects();
    } else {
        alert('Contraseña incorrecta');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabName}')"]`).classList.add('active');
}

async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const profit = parseFloat(document.getElementById('productProfit').value);
    const quantity = document.getElementById('productQuantity').value;
    const imageFile = document.getElementById('productImage').files[0];

    if (!name || !price || !profit || isNaN(quantity)) {
        alert('Por favor complete todos los campos con valores válidos');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const product = {
            id: Date.now(),
            name,
            price,
            profit,
            quantity: parseInt(quantity) || 0,
            image: e.target.result
        };

        try {
            await addDoc(productsRef, product);
            // Limpiar campos
            document.getElementById('productName').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productProfit').value = '';
            document.getElementById('productQuantity').value = '';
            document.getElementById('productImage').value = '';
        } catch (error) {
            console.error("Error adding product: ", error);
            alert('Error al agregar el producto');
        }
    };

    if (imageFile) {
        reader.readAsDataURL(imageFile);
    } else {
        alert('Por favor seleccione una imagen');
    }
}

async function registerSale() {
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const message = document.getElementById('saleMessage').value;

    const product = products.find(p => p.id === parseInt(productId));
    if (!product || quantity > product.quantity || quantity <= 0) {
        alert('Cantidad no válida o insuficiente en inventario');
        return;
    }

    const sale = {
        date: new Date().toLocaleString(),
        productId,
        productName: product.name,
        quantity,
        total: product.price * quantity,
        profit: product.profit * quantity,
        message
    };

    try {
        // Registrar la venta
        await addDoc(salesRef, sale);

        // Actualizar el inventario
        const productDoc = doc(db, 'products', product.dbId);
        await updateDoc(productDoc, {
            quantity: product.quantity - quantity
        });

        // Limpiar campos
        document.getElementById('saleQuantity').value = '';
        document.getElementById('saleMessage').value = '';
    } catch (error) {
        console.error("Error registering sale: ", error);
        alert('Error al registrar la venta');
    }
}

function updateInventoryTable() {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    products.forEach(product => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><img src="${product.image}" class="product-image" alt="${product.name}"></td>
            <td>${product.name}</td>
            <td>$${product.price}</td>
            <td>$${product.profit}</td>
            <td>${product.quantity}</td>
            <td>
                <button onclick="deleteProduct('${product.dbId}')" style="background-color: #dc3545;">Eliminar</button>
            </td>
        `;
    });
}

async function deleteProduct(dbId) {
    if (confirm('¿Está seguro de eliminar este producto?')) {
        try {
            await deleteDoc(doc(db, 'products', dbId));
        } catch (error) {
            console.error("Error deleting product: ", error);
            alert('Error al eliminar el producto');
        }
    }
}

async function deleteSale(dbId) {
    if (confirm('¿Está seguro de eliminar esta venta?')) {
        try {
            const sale = sales.find(s => s.dbId === dbId);
            const product = products.find(p => p.id === parseInt(sale.productId));
            
            if (product) {
                // Devolver la cantidad al inventario
                const productDoc = doc(db, 'products', product.dbId);
                await updateDoc(productDoc, {
                    quantity: product.quantity + sale.quantity
                });
            }

            // Eliminar la venta
            await deleteDoc(doc(db, 'sales', dbId));
        } catch (error) {
            console.error("Error deleting sale: ", error);
            alert('Error al eliminar la venta');
        }
    }
}

function updateSalesTable() {
    const tbody = document.querySelector('#salesTable tbody');
    tbody.innerHTML = '';
    sales.forEach((sale) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>$${sale.total}</td>
            <td>$${sale.profit}</td>
            <td>${sale.message}</td>
            <td>
                <button onclick="deleteSale('${sale.dbId}')" style="background-color: #dc3545;">Eliminar</button>
            </td>
        `;
    });
}

function updateProductSelects() {
    const saleSelect = document.getElementById('saleProduct');
    const options = products.map(product => 
        `<option value="${product.id}">${product.name} - Stock: ${product.quantity}</option>`
    ).join('');
    saleSelect.innerHTML = options;
}

function updateDashboard() {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    document.getElementById('totalSales').textContent = `$${totalSales}`;
    document.getElementById('totalProfit').textContent = `$${totalProfit}`;
}

// Escuchar cambios en tiempo real
onSnapshot(productsRef, (snapshot) => {
    products = [];
    snapshot.forEach((doc) => {
        products.push({ ...doc.data(), dbId: doc.id });
    });
    updateInventoryTable();
    updateProductSelects();
    updateDashboard();
});

onSnapshot(salesRef, (snapshot) => {
    sales = [];
    snapshot.forEach((doc) => {
        sales.push({ ...doc.data(), dbId: doc.id });
    });
    updateSalesTable();
    updateDashboard();
});

// Hacer las funciones disponibles globalmente
window.login = login;
window.showTab = showTab;
window.addProduct = addProduct;
window.registerSale = registerSale;
window.deleteProduct = deleteProduct;
window.deleteSale = deleteSale;