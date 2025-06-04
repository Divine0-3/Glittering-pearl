// Global remove functions
function removeImage() {
    document.getElementById('image-upload').value = '';
    document.getElementById('image').value = '';
    document.getElementById('image-preview').innerHTML = '';
}

function removeOfferImage() {
    document.getElementById('offer-image-upload').value = '';
    document.getElementById('offerImage').value = '';
    document.getElementById('offer-image-preview').innerHTML = '';
}

function removeOccasionImage() {
    document.getElementById('occasion-image-upload').value = '';
    document.getElementById('occasionImage').value = '';
    document.getElementById('occasion-image-preview').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');
    const addCategoryForm = document.getElementById('addCategoryForm');
    const addOfferForm = document.getElementById('addOfferForm');
    const addOccasionForm = document.getElementById('addOccasionForm');
    const productsList = document.getElementById('productsList');
    const categoriesList = document.getElementById('categoriesList');
    const offersList = document.getElementById('offersList');
    const occasionsList = document.getElementById('occasionsList');
    const hasDiscountCheckbox = document.getElementById('hasDiscount');
    const discountInput = document.getElementById('discountInput');

    // Load initial data
    loadProducts();
    loadCategories();
    loadOffers();
    loadOccasions();

    // Toggle discount input visibility
    hasDiscountCheckbox.addEventListener('change', () => {
        discountInput.style.display = hasDiscountCheckbox.checked ? 'block' : 'none';
        const discountPercentageInput = document.getElementById('discountPercentage');
        discountPercentageInput.required = hasDiscountCheckbox.checked;
    });

    // Handle product image selection
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Create a preview using FileReader
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('image-preview');
                preview.innerHTML = `
                    <div class="preview-container">
                        <img src="${e.target.result}" alt="Preview" class="preview-image">
                        <button type="button" class="remove-image" onclick="removeImage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    }

    // Handle offer image selection
    const offerImageUpload = document.getElementById('offer-image-upload');
    if (offerImageUpload) {
        offerImageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Create a preview using FileReader
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('offer-image-preview');
                preview.innerHTML = `
                    <div class="preview-container">
                        <img src="${e.target.result}" alt="Preview" class="preview-image">
                        <button type="button" class="remove-image" onclick="removeOfferImage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    }

    // Handle occasion image selection
    const occasionImageUpload = document.getElementById('occasion-image-upload');
    if (occasionImageUpload) {
        occasionImageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Create a preview using FileReader
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('occasion-image-preview');
                preview.innerHTML = `
                    <div class="preview-container">
                        <img src="${e.target.result}" alt="Preview" class="preview-image">
                        <button type="button" class="remove-image" onclick="removeOccasionImage()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    }

    // Handle product form submission
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate image
        const imageFile = document.getElementById('image-upload').files[0];
        if (!imageFile) {
            showMessage('Please select an image for the product', 'error');
            return;
        }
        
        const submitButton = addProductForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Product...';

        try {
            const formData = new FormData(addProductForm);
            
            // Round the price to nearest whole number
            const price = formData.get('price');
            if (price) {
                formData.set('price', Math.round(parseFloat(price)));
            }
            
            // Handle image upload if a file was selected
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                
                const uploadResponse = await fetch('/upload-image', {
                    method: 'POST',
                    body: imageFormData
                });
                
                if (!uploadResponse.ok) throw new Error('Image upload failed');
                
                const uploadData = await uploadResponse.json();
                formData.set('image', uploadData.url);
            }

            // Only include discount percentage if checkbox is checked
            if (!hasDiscountCheckbox.checked) {
                formData.delete('discountPercentage');
            }

            const response = await fetch('/api/products', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (response.ok) {
                // Clear the form
                addProductForm.reset();
                
                // Clear the image preview and input
                document.getElementById('image-upload').value = '';
                document.getElementById('image').value = '';
                document.getElementById('image-preview').innerHTML = '';
                
                // Hide discount input if it was shown
                discountInput.style.display = 'none';
                hasDiscountCheckbox.checked = false;
                
                // Show success message
                showMessage('Product added successfully!', 'success');
                
                // Refresh the products list
                await loadProducts();
            } else {
                throw new Error(data.error || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Product';
        }
    });

    // Handle category form submission
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = addCategoryForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Category...';

        try {
            const formData = new FormData(addCategoryForm);
            const response = await fetch('/api/categories', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to add category');
            }

            addCategoryForm.reset();
            await loadCategories();
            showMessage('Category added successfully!', 'success');
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Category';
        }
    });

    // Handle discount checkbox for offers
    const offerHasDiscountCheckbox = document.getElementById('offerHasDiscount');
    const offerDiscountInput = document.getElementById('offerDiscountInput');
    const offerDiscountPercentageInput = document.getElementById('offerDiscountPercentage');

    offerHasDiscountCheckbox.addEventListener('change', () => {
        offerDiscountInput.style.display = offerHasDiscountCheckbox.checked ? 'block' : 'none';
        offerDiscountPercentageInput.required = offerHasDiscountCheckbox.checked;
    });

    // Handle offer form submission
    addOfferForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = addOfferForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Offer...';

        try {
            const formData = new FormData(addOfferForm);
            
            // Handle image upload if a file was selected
            const imageFile = document.getElementById('offer-image-upload').files[0];
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                
                const uploadResponse = await fetch('/upload-image', {
                    method: 'POST',
                    body: imageFormData
                });
                
                if (!uploadResponse.ok) throw new Error('Image upload failed');
                
                const uploadData = await uploadResponse.json();
                formData.set('image', uploadData.url);
            }
            
            // Add selected products to form data
            if (selectedProductsList.size > 0) {
                formData.append('products', JSON.stringify(Array.from(selectedProductsList)));
            }

            const response = await fetch('/api/offers', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
            const result = await response.json();
            showMessage('Offer added successfully!', 'success');
                e.target.reset();
                selectedProducts.innerHTML = '';
                selectedProductsList.clear();
                document.getElementById('offer-image-preview').innerHTML = '';
                offerDiscountInput.style.display = 'none';
                await loadOffers();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add offer');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Offer';
        }
    });

    // Handle occasion form submission
    addOccasionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = addOccasionForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Occasion...';

        try {
            const formData = new FormData(addOccasionForm);
            
            // Handle image upload if a file was selected
            const imageFile = document.getElementById('occasion-image-upload').files[0];
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                
                const uploadResponse = await fetch('/upload-image', {
                    method: 'POST',
                    body: imageFormData
                });
                
                if (!uploadResponse.ok) throw new Error('Image upload failed');
                
                const uploadData = await uploadResponse.json();
                formData.set('image', uploadData.url);
            }

            // Add selected products to form data
            if (occasionSelectedProductsList.size > 0) {
                formData.append('products', JSON.stringify(Array.from(occasionSelectedProductsList)));
            }

            const response = await fetch('/api/occasions', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                showMessage('Occasion added successfully!', 'success');
                e.target.reset();
                occasionSelectedProducts.innerHTML = '';
                occasionSelectedProductsList.clear();
                document.getElementById('occasion-image-preview').innerHTML = '';
                await loadOccasions();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add occasion');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Occasion';
        }
    });

    // Function to load products
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();

            productsList.innerHTML = products.map(product => `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="product-details">
                        <h3>${product.name}</h3>
                        <p class="price">$${product.price.toFixed(2)}</p>
                        ${product.discountPercentage ? `<p class="discount">${product.discountPercentage}% OFF</p>` : ''}
                        <p class="category">${product.category}</p>
                        <p class="description">${product.description}</p>
                        <button class="delete-button" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showMessage('Failed to load products', 'error');
            console.error('Error:', error);
        }
    }

    // Function to load categories
    async function loadCategories() {
        try {
            const response = await fetch('/api/categories');
            const categories = await response.json();

            categoriesList.innerHTML = categories.map(category => `
                <div class="category-card" data-id="${category.id}">
                    <h3>${category.name}</h3>
                    <button class="delete-button" onclick="deleteCategory(${category.id})">Delete</button>
                </div>
            `).join('');

            // Update category dropdown in product form
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = '<option value="">Select a category</option>' +
                categories.map(category => 
                    `<option value="${category.name}">${category.name}</option>`
                ).join('');
        } catch (error) {
            showMessage('Failed to load categories', 'error');
            console.error('Error:', error);
        }
    }

    // Function to load offers
    async function loadOffers() {
        try {
            const response = await fetch('/api/offers');
            const offers = await response.json();

            offersList.innerHTML = offers.map(offer => `
                <div class="offer-card" data-id="${offer.id}">
                    <div class="offer-image">
                        <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="offer-details">
                        <h3>${offer.title}</h3>
                        <p class="tagline">${offer.tagline}</p>
                        ${offer.tag ? `<span class="offer-tag">${offer.tag}</span>` : ''}
                        ${offer.discountPercentage ? `<p class="discount">${offer.discountPercentage}% OFF</p>` : ''}
                        <button class="delete-button" onclick="deleteOffer(${offer.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showMessage('Failed to load offers', 'error');
            console.error('Error:', error);
        }
    }

    // Function to load occasions
    async function loadOccasions() {
        try {
            const response = await fetch('/api/occasions');
            const occasions = await response.json();

            occasionsList.innerHTML = occasions.map(occasion => `
                <div class="occasion-card" data-id="${occasion.id}">
                    <div class="occasion-image">
                        <img src="${occasion.image}" alt="${occasion.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="occasion-details">
                        <h3>${occasion.name}</h3>
                        ${occasion.tagline ? `<p class="tagline">${occasion.tagline}</p>` : ''}
                        <button class="delete-button" onclick="deleteOccasion(${occasion.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            showMessage('Failed to load occasions', 'error');
            console.error('Error:', error);
        }
    }

    // Function to show messages
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }

    // Make functions available globally
    window.deleteProduct = deleteProduct;
    window.deleteCategory = deleteCategory;
    window.deleteOffer = deleteOffer;
    window.loadProducts = loadProducts;
    window.loadCategories = loadCategories;
    window.loadOffers = loadOffers;
    window.loadOccasions = loadOccasions;

    // Product search functionality
    const productSearch = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const selectedProducts = document.getElementById('selectedProducts');
    let selectedProductsList = new Set();

    // Debounce function to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Search products
    const searchProducts = debounce(async (query) => {
        if (!query) {
            searchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            const filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase())
            );

            displaySearchResults(filteredProducts);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    }, 300);

    // Display search results
    function displaySearchResults(products) {
        searchResults.innerHTML = '';
        
        if (products.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        products.forEach(product => {
            if (!selectedProductsList.has(product.id)) {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">₹${product.price}</div>
                    </div>
                `;
                resultItem.addEventListener('click', () => addSelectedProduct(product));
                searchResults.appendChild(resultItem);
            }
        });

        searchResults.style.display = 'block';
    }

    // Add selected product
    function addSelectedProduct(product) {
        if (selectedProductsList.has(product.id)) return;

        selectedProductsList.add(product.id);
        const selectedProduct = document.createElement('div');
        selectedProduct.className = 'selected-product';
        selectedProduct.dataset.productId = product.id;
        selectedProduct.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₹${product.price}</div>
            </div>
            <span class="remove-product">×</span>
        `;

        selectedProduct.querySelector('.remove-product').addEventListener('click', () => {
            selectedProductsList.delete(product.id);
            selectedProduct.remove();
        });

        selectedProducts.appendChild(selectedProduct);
        productSearch.value = '';
        searchResults.style.display = 'none';
    }

    // Event listeners for product search
    productSearch.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== productSearch) {
            searchResults.style.display = 'none';
        }
    });

    // Occasion product search functionality
    const occasionProductSearch = document.getElementById('occasionProductSearch');
    const occasionSearchResults = document.getElementById('occasionSearchResults');
    const occasionSelectedProducts = document.getElementById('occasionSelectedProducts');
    let occasionSelectedProductsList = new Set();

    // Search products for occasion
    const searchOccasionProducts = debounce(async (query) => {
        if (!query) {
            occasionSearchResults.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            const filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase())
            );

            displayOccasionSearchResults(filteredProducts);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    }, 300);

    // Display search results for occasion
    function displayOccasionSearchResults(products) {
        occasionSearchResults.innerHTML = '';
        
        if (products.length === 0) {
            occasionSearchResults.style.display = 'none';
            return;
        }

        products.forEach(product => {
            if (!occasionSelectedProductsList.has(product.id)) {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.innerHTML = `
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-price">₹${product.price}</div>
                    </div>
                `;
                resultItem.addEventListener('click', () => addOccasionSelectedProduct(product));
                occasionSearchResults.appendChild(resultItem);
            }
        });

        occasionSearchResults.style.display = 'block';
    }

    // Add selected product to occasion
    function addOccasionSelectedProduct(product) {
        if (occasionSelectedProductsList.has(product.id)) return;

        occasionSelectedProductsList.add(product.id);
        const selectedProduct = document.createElement('div');
        selectedProduct.className = 'selected-product';
        selectedProduct.dataset.productId = product.id;
        selectedProduct.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₹${product.price}</div>
            </div>
            <span class="remove-product">×</span>
        `;

        selectedProduct.querySelector('.remove-product').addEventListener('click', () => {
            occasionSelectedProductsList.delete(product.id);
            selectedProduct.remove();
        });

        occasionSelectedProducts.appendChild(selectedProduct);
        occasionProductSearch.value = '';
        occasionSearchResults.style.display = 'none';
    }

    // Event listeners for occasion product search
    occasionProductSearch.addEventListener('input', (e) => {
        searchOccasionProducts(e.target.value);
    });

    document.addEventListener('click', (e) => {
        if (!occasionSearchResults.contains(e.target) && e.target !== occasionProductSearch) {
            occasionSearchResults.style.display = 'none';
        }
    });
});

// Function to delete product
async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadProducts();
                showMessage('Product deleted successfully!', 'success');
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete product');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        }
    }
}

// Function to delete category
async function deleteCategory(id) {
    if (confirm('Are you sure you want to delete this category?')) {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadCategories();
                showMessage('Category deleted successfully!', 'success');
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete category');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        }
    }
}

// Function to delete offer
async function deleteOffer(id) {
    if (confirm('Are you sure you want to delete this offer?')) {
        try {
            const response = await fetch(`/api/offers/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadOffers();
                showMessage('Offer deleted successfully!', 'success');
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete offer');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        }
    }
}

// Function to delete occasion
async function deleteOccasion(id) {
    if (confirm('Are you sure you want to delete this occasion?')) {
        try {
            const response = await fetch(`/api/occasions/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadOccasions();
                showMessage('Occasion deleted successfully!', 'success');
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete occasion');
            }
        } catch (error) {
            showMessage(error.message, 'error');
            console.error('Error:', error);
        }
    }
}

// Add styles for message animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .message {
        font-weight: 500;
    }
    .message.success {
        background-color: #dff0d8;
        color: #3c763d;
        border: 1px solid #d6e9c6;
    }
    .message.error {
        background-color: #f2dede;
        color: #a94442;
        border: 1px solid #ebccd1;
    }
`;
document.head.appendChild(style);

// Add CSS for occasion cards
const occasionStyles = document.createElement('style');
occasionStyles.textContent = `
    .occasion-card {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        padding: 1rem;
    }

    .occasion-image {
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        margin-right: 1rem;
    }

    .occasion-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .occasion-details {
        flex: 1;
    }

    .occasion-details h3 {
        margin: 0 0 0.5rem 0;
        color: #2c3e50;
    }

    .occasion-details .tagline {
        color: #666;
        font-style: italic;
        margin: 0.5rem 0;
    }

    .delete-button {
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .delete-button:hover {
        background-color: #c0392b;
    }

    /* Add styles for offer tag */
    .offer-tag {
        display: inline-block;
        background-color: #3498db;
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        font-size: 0.9rem;
        margin: 0.5rem 0;
        font-weight: 500;
    }

    .offer-card .tagline {
        color: #666;
        font-style: italic;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    }

    .offer-card .discount {
        color: #e74c3c;
        font-weight: bold;
        font-size: 1.2rem;
        margin: 0.5rem 0;
    }
`;
document.head.appendChild(occasionStyles); 