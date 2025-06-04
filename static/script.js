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
let searchTimeout;

// Handle search button click
searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
});

// Handle Enter key press
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    }
});

// Handle search input for suggestions
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

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
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
const suggestionItems = document.querySelectorAll('.suggestion-item');
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
    // Always redirect to the search route
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
}

function applyFilters() {
    const selectedCategories = Array.from(document.querySelectorAll('.filter-option input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    const maxPrice = document.querySelector('.price-slider').value;

    // Get all result cards
    const resultCards = document.querySelectorAll('.search-result-card');
    
    resultCards.forEach(card => {
        const price = parseFloat(card.querySelector('.search-result-price').textContent.replace('₹', ''));
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