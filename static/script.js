// Color Selection Functionality
const colorOptions = document.querySelectorAll('.color-option');
const pearlCards = document.querySelectorAll('.pearl-card');

colorOptions.forEach(option => {
    option.addEventListener('click', () => {
        const selectedColor = option.getAttribute('data-color');
        
        // Update active state
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Filter pearls
        pearlCards.forEach(card => {
            if (selectedColor === 'all' || card.getAttribute('data-color') === selectedColor) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Search functionality
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const searchSuggestions = document.querySelector('.search-suggestions');
const suggestionItems = document.querySelectorAll('.suggestion-item');
let searchTimeout;

// Sample search data
const searchData = [
    { title: 'White Pearl Collection', category: 'Collections', icon: 'gem' },
    { title: 'Pearl Rings', category: 'Products', icon: 'ring' },
    { title: 'Pearl Necklaces', category: 'Products', icon: 'necktie' },
    { title: 'Black Pearl Collection', category: 'Collections', icon: 'gem' },
    { title: 'Pearl Earrings', category: 'Products', icon: 'earring' },
    { title: 'Pearl Bracelets', category: 'Products', icon: 'bracelet' }
];

// Handle search input
searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const query = this.value.trim();
    
    if (query.length < 2) {
        searchSuggestions.style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        fetch(`/search-suggestions?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(products => {
    searchSuggestions.innerHTML = '';
    
                if (products.length === 0) {
                    searchSuggestions.style.display = 'none';
                    return;
                }

                products.forEach(product => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <div class="suggestion-content">
                            <span class="suggestion-title">${product.name}</span>
                            <span class="suggestion-category">${product.category}</span>
                </div>
            `;
            
            suggestionItem.addEventListener('click', () => {
                        window.location.href = `/product/${product.id}`;
            });
            
            searchSuggestions.appendChild(suggestionItem);
        });
    
                searchSuggestions.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching search suggestions:', error);
                searchSuggestions.style.display = 'none';
            });
    }, 300);
});

    // Handle search button click
    searchButton.addEventListener('click', () => {
    if (searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
    }
    });

    // Handle Enter key press
    searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
        }
    });

// Close search suggestions when clicking outside
document.addEventListener('click', function(event) {
    if (!searchInput.contains(event.target) && !searchSuggestions.contains(event.target)) {
        searchSuggestions.style.display = 'none';
    }
});

// Hide suggestions when input loses focus
searchInput.addEventListener('blur', () => {
    setTimeout(() => {
        if (!searchInput.value.trim()) {
            searchSuggestions.classList.remove('active');
        }
    }, 200);
});

// Add hover effect to suggestions
suggestionItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateX(5px)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateX(0)';
    });
});

// Carousel functionality
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const prevButton = document.querySelector('.carousel-control.prev');
    const nextButton = document.querySelector('.carousel-control.next');
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        currentSlide = index;
    }
    
    function nextSlide() {
        let next = currentSlide + 1;
        if (next >= slides.length) {
            next = 0;
        }
        showSlide(next);
    }
    
    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 0) {
            prev = slides.length - 1;
        }
        showSlide(prev);
    }
    
    function startAutoSlide() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoSlide() {
        if (slideInterval) {
        clearInterval(slideInterval);
        }
    }
    
    // Event listeners
    nextButton.addEventListener('click', () => {
        stopAutoSlide();
        nextSlide();
        startAutoSlide();
    });
    
    prevButton.addEventListener('click', () => {
        stopAutoSlide();
        prevSlide();
        startAutoSlide();
    });
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            stopAutoSlide();
            showSlide(index);
            startAutoSlide();
        });
    });
    
    // Start auto-sliding
    startAutoSlide();
    
    // Pause auto-sliding when hovering over the carousel
    const carousel = document.querySelector('.carousel-container');
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
});

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('.search-input');
    const searchButtons = document.querySelectorAll('.search-button');
    const searchQueryText = document.getElementById('search-query-text');
    const searchResultsGrid = document.querySelector('.search-results-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    // If we're on the search page and there's a query, display results
    if (searchQueryText && searchQuery) {
        searchQueryText.textContent = searchQuery;
        displaySearchResults(searchQuery);
    }

    // Add event listeners to all search inputs and buttons
    searchInputs.forEach((input, index) => {
        const searchButton = searchButtons[index];

        // Handle search button click
        searchButton.addEventListener('click', () => {
            const query = input.value.trim();
            if (query) {
                performSearch(query);
            }
        });

        // Handle Enter key press
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = input.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    });

    // Handle filter changes
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    const priceSlider = document.querySelector('.price-slider');

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    if (priceSlider) {
        priceSlider.addEventListener('input', applyFilters);
    }
});

function performSearch(query) {
    // If we're already on the search page, update the results without reloading
    if (window.location.pathname.includes('search.html')) {
        const searchQueryText = document.getElementById('search-query-text');
        if (searchQueryText) {
            searchQueryText.textContent = query;
        }
        displaySearchResults(query);
    } else {
        // If we're on another page, redirect to search page
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
}

function displaySearchResults(query) {
    // This is a mock function - in a real application, you would fetch results from a server
    const mockResults = [
        {
            id: 1,
            title: 'Classic White Pearl',
            description: 'Elegant white pearl earrings with sterling silver hooks',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
            category: 'earrings'
        },
        {
            id: 2,
            title: 'Black Pearl Collection',
            description: 'Delicate pearl bracelet with adjustable chain',
            price: 129.99,
            image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&auto=format&fit=crop&q=60',
            category: 'bracelets'
        },
        {
            id: 3,
            title: 'Pink Pearl Necklace',
            description: 'Stunning pearl necklace with gold chain',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
            category: 'necklaces'
        },
        {
            id: 4,
            title: 'Golden Pearl Ring',
            description: 'Elegant pearl ring with diamond accents',
            price: 149.99,
            image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&auto=format&fit=crop&q=60',
            category: 'rings'
        },
        {
            id: 5,
            title: 'Pearl Hair Accessories',
            description: 'Beautiful pearl hair clips and pins',
            price: 49.99,
            image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60',
            category: 'hair-accessories'
        }
    ];

    const searchResultsGrid = document.querySelector('.search-results-grid');
    if (!searchResultsGrid) return;

    // Clear existing results
    searchResultsGrid.innerHTML = '';

    // Normalize the search query and results for better matching
    const normalizedQuery = query.toLowerCase().trim();
    
    // Filter results based on the query - show exact matches and partial matches
    const filteredResults = mockResults.filter(result => {
        const normalizedTitle = result.title.toLowerCase();
        return normalizedTitle === normalizedQuery || 
               normalizedTitle.includes(normalizedQuery) ||
               normalizedQuery.includes(normalizedTitle);
    });

    if (filteredResults.length === 0) {
        // Show no results message
        searchResultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No results found for "${query}"</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    // Display filtered results
    filteredResults.forEach(result => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        resultCard.dataset.category = result.category;
        resultCard.innerHTML = `
            <img src="${result.image}" alt="${result.title}" class="search-result-image">
            <div class="search-result-info">
                <h3>${result.title}</h3>
                <p>${result.description}</p>
                <div class="search-result-price">$${result.price.toFixed(2)}</div>
            </div>
        `;
        searchResultsGrid.appendChild(resultCard);
    });

    // Reset filters after new search
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    const priceSlider = document.querySelector('.price-slider');
    
    filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    if (priceSlider) {
        priceSlider.value = 1000;
    }
}

function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    const maxPrice = document.querySelector('.price-slider').value;

    // Get all result cards
    const resultCards = document.querySelectorAll('.search-result-card');
    
    resultCards.forEach(card => {
        const price = parseFloat(card.querySelector('.search-result-price').textContent.replace('$', ''));
        const category = card.dataset.category;

        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
        const matchesPrice = price <= maxPrice;

        if (matchesCategory && matchesPrice) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Check if any results are visible
    const visibleResults = Array.from(resultCards).some(card => card.style.display !== 'none');
    const noResultsMessage = document.querySelector('.no-results');

    if (!visibleResults && !noResultsMessage) {
        const searchResultsGrid = document.querySelector('.search-results-grid');
        const searchQuery = document.getElementById('search-query-text').textContent;
        searchResultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No results found for "${searchQuery}"</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
    } else if (visibleResults && noResultsMessage) {
        noResultsMessage.remove();
    }
} 

// Add smooth scrolling for any anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Products horizontal scroll
document.addEventListener('DOMContentLoaded', function() {
    const productsGrid = document.querySelector('.products-grid');
    const prevButton = document.querySelector('.products-nav.prev');
    const nextButton = document.querySelector('.products-nav.next');

    if (productsGrid && prevButton && nextButton) {
        const scrollAmount = 300; // Adjust this value to control scroll distance

        prevButton.addEventListener('click', () => {
            productsGrid.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        nextButton.addEventListener('click', () => {
            productsGrid.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Show/hide navigation buttons based on scroll position
        productsGrid.addEventListener('scroll', () => {
            prevButton.style.opacity = productsGrid.scrollLeft > 0 ? '1' : '0.5';
            nextButton.style.opacity = 
                productsGrid.scrollLeft < (productsGrid.scrollWidth - productsGrid.clientWidth) ? '1' : '0.5';
        });

        // Initial button state
        prevButton.style.opacity = '0.5';
    }
}); 