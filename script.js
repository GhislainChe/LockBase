// Check if accounts is already declared to prevent redeclaration
if (typeof accounts === 'undefined') {
    // Initialize accounts from localStorage or empty array
    var accounts = JSON.parse(localStorage.getItem('accounts')) || [];
}

// DOM Elements
const homePage = document.getElementById('home-page');
const favoritesPage = document.getElementById('favorites-page');
const accountsContainer = document.getElementById('accounts-container');
const favoritesContainer = document.getElementById('favorites-container');
const navLinks = document.querySelectorAll('.nav-link');
const addAccountBtn = document.getElementById('add-account-btn');
const accountModal = document.getElementById('account-modal');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const accountForm = document.getElementById('account-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterType = document.getElementById('filter-type');
const sortBy = document.getElementById('sort-by');
const cardTypeSelect = document.getElementById('card-type');
const currencySelect = document.getElementById('card-currency');
const valueSuffix = document.getElementById('value-suffix');

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Trigger reflow to enable animation
    void toast.offsetWidth;
    toast.classList.add('show');
    
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Confirmation Dialog
function showConfirmation(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const messageEl = document.getElementById('confirmation-message');
    const confirmBtn = document.getElementById('confirm-action');
    const cancelBtn = document.getElementById('cancel-action');
    
    messageEl.textContent = message;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        modal.classList.remove('active');
        onConfirm();
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    const handleOverlayClick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOverlayClick);
        }
    };
    
    modal.addEventListener('click', handleOverlayClick);
}

        // Current state
        let currentPage = 'home';
        let editingAccountId = null;
        let filteredAccounts = [...accounts];

        // Initialize the app
        function init() {
            filterAndSortAccounts()
            setupEventListeners();
        }

        // Set up event listeners
        function setupEventListeners() {
            // Navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = e.target.getAttribute('data-page');
                    if (page) {
                        switchPage(page);
                    }
                });
            });

            // Add Account Button
            if (addAccountBtn) {
                addAccountBtn.addEventListener('click', openAddCardModal);
            }

            // Modal Buttons
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
            if (saveBtn) saveBtn.addEventListener('click', saveAccount);

            // Search
            if (searchInput) searchInput.addEventListener('input', handleSearch);
            if (searchBtn) searchBtn.addEventListener('click', handleSearch);

            // Filters
            if (filterType) filterType.addEventListener('change', filterAndSortAccounts);
            if (sortBy) sortBy.addEventListener('change', filterAndSortAccounts);

            // Form submission
            if (accountForm) {
                accountForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveAccount();
                });
            }

            // Card type and currency change handlers
            if (cardTypeSelect) {
                cardTypeSelect.addEventListener('change', handleCardTypeChange);
            }
            
            if (currencySelect) {
                currencySelect.addEventListener('change', updateCurrencySymbol);
            }
        }

        // Switch between pages
        function switchPage(page) {
            // Update active nav link
            navLinks.forEach(link => {
                if (link.getAttribute('data-page') === page) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

    // Update active page
    homePage.classList.remove('active');
    favoritesPage.classList.remove('active');

    if (page === 'home') {
        homePage.classList.add('active');
        currentPage = 'home';
        renderAccounts();
    } else if (page === 'favorites') {
        favoritesPage.classList.add('active');
        currentPage = 'favorites';
        renderFavorites();
    }
}

// Open modal for adding a new card/coupon
function openAddCardModal() {
    if (!accountModal) return;
    
    // Reset form and editing state
    editingAccountId = null;
    if (accountForm) {
        accountForm.reset();
        document.getElementById('account-id').value = '';
        
        // Reset specific fields
        if (currencySelect) currencySelect.value = 'USD';
        if (cardTypeSelect) cardTypeSelect.value = '';
        
        // Update UI
        updateCurrencySymbol();
        handleCardTypeChange();
    }
    
    // Set modal title
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Card/Coupon';
    }
    
    // Show the modal
    accountModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Focus on the first input field
    setTimeout(() => {
        const firstInput = accountForm.querySelector('input:not([type="hidden"]), select');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

// Open edit modal with account data
function openEditModal(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        console.error('Account not found:', accountId);
        return;
    }
    
    try {
        editingAccountId = accountId;
        
        // Set form values using optional chaining and nullish coalescing
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = !!value;
                } else {
                    el.value = value ?? '';
                }
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        };

        // Map account data to form fields
        const fieldMapping = {
            'account-id': account.id,
            'card-name': account.name,
            'card-type': account.type,
            'card-code': account.code || account.password, // Fallback to password for compatibility
            'card-value': account.value,
            'card-currency': account.currency || 'USD',
            'card-expiry': account.expiry,
            'card-email': account.email,
            'card-website': account.website || account.url, // Handle both website and url
            'card-terms': account.terms,
            'card-notes': account.notes,
            'card-active': account.isActive !== false // Default to true if undefined
        };

        // Set all form values
        Object.entries(fieldMapping).forEach(([id, value]) => {
            setValue(id, value);
        });

        // Update currency symbol
        updateCurrencySymbol();
        
        // Show/hide fields based on account type
        toggleCardSpecificFields(account.type);
        
        // Update modal title
        const modalTitle = document.querySelector('#account-modal .modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit ' + (account.type ? capitalizeFirst(account.type) : 'Item');
        }
        
        // Show modal
        const modal = document.getElementById('account-modal');
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput) firstInput.focus();
        } else {
            console.error('Account modal not found');
        }
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showToast('Error opening editor. Please try again.', 'error');
    }
}

// Close modal
function closeModal() {
    if (accountModal) {
        accountModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scrolling
        
        // Reset the form
        if (accountForm) {
            accountForm.reset();
            // Reset any custom form states
            if (editingAccountId !== null) {
                editingAccountId = null;
            }
            // Clear any validation errors
            const errorMessages = document.querySelectorAll('.error-message');
            errorMessages.forEach(el => el.remove());
        }
    }
}

// Save accounts to localStorage
function saveAccounts() {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

// Toggle favorite status of an account
function toggleFavorite(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
        account.isFavorite = !account.isFavorite;
        saveAccounts();
        filterAndSortAccounts();
        if (currentPage === 'favorites') {
            renderFavorites();
        }
        showToast(
            account.isFavorite ? 'Added to favorites' : 'Removed from favorites',
            'success'
        );
    }
}

// Delete an account
function deleteAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    showConfirmation(`Are you sure you want to delete "${account.name}"?`, () => {
        accounts = accounts.filter(acc => acc.id !== accountId);
        saveAccounts();
        filterAndSortAccounts();
        if (currentPage === 'favorites') {
            renderFavorites();
        }
        showToast('Account deleted successfully', 'success');
    });
}

// Format URL for display
function formatUrlDisplay(url) {
    if (!url) return '';
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname.replace(/\\/g, '/').replace(/\/$/, '') : '');
    } catch (e) {
        return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
}

// Save account (add or update)
function saveAccount() {
    try {
        const id = document.getElementById('account-id')?.value || '';
        const name = document.getElementById('card-name')?.value.trim() || '';
        const type = document.getElementById('card-type')?.value || '';
        const code = document.getElementById('card-code')?.value.trim() || '';
        const value = document.getElementById('card-value')?.value || '';
        const currency = document.getElementById('card-currency')?.value || 'USD';
        const expiry = document.getElementById('card-expiry')?.value || '';
        const email = document.getElementById('card-email')?.value.trim() || '';
        const website = document.getElementById('card-website')?.value.trim() || '';
        const terms = document.getElementById('card-terms')?.value.trim() || '';
        const notes = document.getElementById('card-notes')?.value.trim() || '';
        const isActive = document.getElementById('card-active')?.checked || false;

        // Basic validation
        if (!name || !type || !code) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (type === 'promo' && (value < 0 || value > 100)) {
            showToast('Promo code value must be between 0 and 100', 'error');
            return;
        }

        const accountData = {
            id: id || Date.now(),
            name,
            type,
            code,
            value,
            currency,
            expiry,
            email,
            website,
            terms,
            notes,
            isActive,
            isFavorite: false,
            dateAdded: new Date().toISOString().split('T')[0]
        };

        if (editingAccountId) {
            // Update existing account
            const index = accounts.findIndex(acc => acc.id === parseInt(editingAccountId));
            if (index !== -1) {
                accounts[index] = {
                    ...accounts[index],
                    ...accountData,
                    // Preserve existing values if not in the form
                    isFavorite: accounts[index].isFavorite
                };
                showToast('Card/Coupon updated successfully', 'success');
            }
        } else {
            // Add new account
            accounts.push(accountData);
            showToast('Card/Coupon added successfully', 'success');
        }

        saveAccounts();
        closeModal();
        filterAndSortAccounts();
        if (currentPage === 'favorites') renderFavorites();
    } catch (error) {
        console.error('Error saving account:', error);
        showToast('An error occurred while saving. Please try again.', 'error');
    }
}

// Handle search
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    filterAndSortAccounts();
    
    if (query) {
        filteredAccounts = filteredAccounts.filter(account => 
            account.name.toLowerCase().includes(query) ||
            account.username.toLowerCase().includes(query) ||
            account.type.toLowerCase().includes(query)
        );
    }
    
    renderAccounts();
}

// Filter and sort accounts
function filterAndSortAccounts() {
    // Reset filtered accounts to all accounts first
    filteredAccounts = [...accounts];
    
    // Apply type filter
    const typeFilter = filterType.value;
    if (typeFilter && typeFilter !== 'all') {
        filteredAccounts = filteredAccounts.filter(account => 
            account.type === typeFilter
        );
    }
    
    // Apply search query if any
    const searchQuery = searchInput.value.toLowerCase().trim();
    if (searchQuery) {
        filteredAccounts = filteredAccounts.filter(account => 
            account.name.toLowerCase().includes(searchQuery) ||
            account.username.toLowerCase().includes(searchQuery) ||
            account.type.toLowerCase().includes(searchQuery)
        );
    }
    
    // Apply sorting
    const sortOption = sortBy.value;
    filteredAccounts.sort((a, b) => {
        if (sortOption === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortOption === 'type') {
            return a.type.localeCompare(b.type);
        } else if (sortOption === 'date') {
            return new Date(b.dateAdded) - new Date(a.dateAdded);
        }
        return 0;
    });
    
    // Re-render the accounts
    renderAccounts();
}

// Render accounts on home page
function renderAccounts() {
    accountsContainer.innerHTML = '';
    
    if (filteredAccounts.length === 0) {
        accountsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No accounts found</h3>
                <p>Try adjusting your search or add a new account</p>
            </div>
        `;
        return;
    }
    
    filteredAccounts.forEach(account => {
        const accountCard = createAccountCard(account);
        accountsContainer.appendChild(accountCard);
    });
}

// Render favorite accounts
function renderFavorites() {
    favoritesContainer.innerHTML = '';
    
    const favoriteAccounts = accounts.filter(account => account.isFavorite);
    
    if (favoriteAccounts.length === 0) {
        favoritesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <h3>No favorite accounts</h3>
                <p>Mark accounts as favorites to see them here</p>
            </div>
        `;
        return;
    }
    
    favoriteAccounts.forEach(account => {
        const accountCard = createAccountCard(account);
        favoritesContainer.appendChild(accountCard);
    });
}

// Create account card element
function createAccountCard(account) {
    const card = document.createElement('div');
    card.className = `account-card ${account.isFavorite ? 'favorite' : ''} ${!account.isActive ? 'inactive' : ''}`;
    card.dataset.id = account.id;
    
    // Format card details based on type
    let details = [];
    
    // Common fields for all types
    details.push(`
        <div class="account-field">
            <span class="field-label">Type:</span>
            <span class="field-value">${capitalizeFirst(account.type || '')}</span>
        </div>
    `);

    // Card/Coupon specific fields
    if (['giftcard', 'coupon', 'promo'].includes(account.type)) {
        if (account.code) {
            details.push(`
                <div class="account-field">
                    <span class="field-label">Code:</span>
                    <span class="field-value">${account.code}</span>
                    <button class="copy-btn" data-clipboard-text="${account.code}" title="Copy to clipboard">
                        <i class="far fa-copy"></i>
                    </button>
                </div>
            `);
        }
        
        if (account.value) {
            const valueText = account.currency === 'USD' ? `$${account.value}` : 
                            account.currency ? `${account.currency}${account.value}` : account.value;
            details.push(`
                <div class="account-field">
                    <span class="field-label">Value:</span>
                    <span class="field-value">${valueText}</span>
                </div>
            `);
        }
        
        if (account.expiry) {
            const expiryDate = new Date(account.expiry);
            const now = new Date();
            const isExpired = expiryDate < now;
            details.push(`
                <div class="account-field ${isExpired ? 'expired' : ''}">
                    <span class="field-label">Expires:</span>
                    <span class="field-value">${expiryDate.toLocaleDateString()}</span>
                    ${isExpired ? '<span class="expired-badge">Expired</span>' : ''}
                </div>
            `);
        }
    } else {
        // Regular account fields
        if (account.username) {
            details.push(`
                <div class="account-field">
                    <span class="field-label">Username:</span>
                    <span class="field-value">${account.username}</span>
                </div>
            `);
        }
        
        if (account.password) {
            details.push(`
                <div class="account-field">
                    <span class="field-label">Password:</span>
                    <span class="field-value password-field">••••••••</span>
                    <button class="toggle-password" title="Show password">
                        <i class="far fa-eye"></i>
                    </button>
                </div>
            `);
        }
    }
    
    // Common additional fields
    if (account.website) {
        const displayUrl = formatUrlDisplay(account.website);
        details.push(`
            <div class="account-field">
                <span class="field-label">Website:</span>
                <span class="field-value">
                    <a href="${account.website.startsWith('http') ? account.website : 'https://' + account.website}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="website-link" 
                       title="${account.website}">
                        ${displayUrl}
                    </a>
                </span>
            </div>
        `);
    }
    
    if (account.email) {
        details.push(`
            <div class="account-field">
                <span class="field-label">Email:</span>
                <span class="field-value">
                    <a href="mailto:${account.email}" class="email-link">
                        ${account.email}
                    </a>
                </span>
            </div>
        `);
    }
    
    if (account.notes) {
        details.push(`
            <div class="account-field notes-field">
                <span class="field-label">Notes:</span>
                <span class="field-value">${account.notes}</span>
            </div>
        `);
    }
    
    // Build the card HTML
    card.innerHTML = `
        <div class="account-header">
            <div class="account-title">
                <i class="${getTypeIcon(account.type)}"></i>
                <h3>${account.name || 'Unnamed'}</h3>
                ${!account.isActive ? '<span class="inactive-badge">Inactive</span>' : ''}
            </div>
            <div class="account-actions">
                <button class="action-btn favorite-btn" title="${account.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="${account.isFavorite ? 'fas' : 'far'} fa-star"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="account-details">
            ${details.join('')}
        </div>
        <div class="card-footer">
            <small class="text-muted">Added: ${new Date(account.dateAdded).toLocaleDateString()}</small>
        </div>
    `;
    
    // Add event listeners
    const favoriteBtn = card.querySelector('.favorite-btn');
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const copyBtns = card.querySelectorAll('.copy-btn');
    const togglePasswordBtns = card.querySelectorAll('.toggle-password');
    
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(account.id);
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(account.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteAccount(account.id);
        });
    }
    
    // Handle copy buttons
    copyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = btn.dataset.clipboardText;
            navigator.clipboard.writeText(text).then(() => {
                const icon = btn.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';
                setTimeout(() => {
                    icon.className = originalClass;
                }, 2000);
            });
        });
    });
    
    // Handle password visibility toggle
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const passwordField = btn.previousElementSibling;
            const isHidden = passwordField.textContent === '••••••••';
            passwordField.textContent = isHidden ? account.password : '••••••••';
            btn.innerHTML = isHidden ? '<i class="far fa-eye-slash"></i>' : '<i class="far fa-eye"></i>';
            btn.title = isHidden ? 'Hide password' : 'Show password';
        });
    });
    
    return card;
}

// Helper function to get icon for account type
function getTypeIcon(type) {
    switch(type) {
        case 'giftcard': return 'fas fa-gift';
        case 'coupon': return 'fas fa-tag';
        case 'promo': return 'fas fa-tags';
        case 'bank': return 'fas fa-university';
        case 'email': return 'fas fa-envelope';
        case 'social': return 'fas fa-users';
        case 'shopping': return 'fas fa-shopping-cart';
        case 'credit': return 'fas fa-credit-card';
        case 'website': return 'fas fa-globe';
        case 'streaming': return 'fas fa-film';
        case 'gaming': return 'fas fa-gamepad';
        default: return 'fas fa-key';
    }
}

// Helper function to capitalize first letter
function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Toggle card-specific fields based on type
function toggleCardSpecificFields(type) {
    // Get all field groups
    const fieldGroups = {
        cardCode: document.getElementById('card-code-group'),
        cardValue: document.getElementById('card-value-group'),
        cardCurrency: document.getElementById('card-currency-group'),
        cardExpiry: document.getElementById('card-expiry-group'),
        username: document.getElementById('username-group'),
        password: document.getElementById('password-group'),
        email: document.getElementById('card-email-group'),
        website: document.getElementById('card-website-group'),
        terms: document.getElementById('card-terms-group')
    };

    // Hide all fields first
    Object.values(fieldGroups).forEach(group => {
        if (group) group.style.display = 'none';
    });
    
    // Show relevant fields based on type
    const isCardOrCoupon = type && ['giftcard', 'coupon', 'promo'].includes(type.toLowerCase());
    
    if (isCardOrCoupon) {
        if (fieldGroups.cardCode) fieldGroups.cardCode.style.display = 'block';
        if (fieldGroups.cardValue) fieldGroups.cardValue.style.display = 'block';
        if (fieldGroups.cardCurrency) fieldGroups.cardCurrency.style.display = 'block';
        if (fieldGroups.cardExpiry) fieldGroups.cardExpiry.style.display = 'block';
        if (fieldGroups.terms) fieldGroups.terms.style.display = 'block';
    } else {
        if (fieldGroups.username) fieldGroups.username.style.display = 'block';
        if (fieldGroups.password) fieldGroups.password.style.display = 'block';
    }
    
    // Always show these fields
    if (fieldGroups.email) fieldGroups.email.style.display = 'block';
    if (fieldGroups.website) fieldGroups.website.style.display = 'block';
    
    // Update currency symbol when changing type
    updateCurrencySymbol();
}

// Update currency symbol when currency changes
function updateCurrencySymbol() {
    if (!currencySelect) return;
    
    const currency = currencySelect.value;
    const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$'
    };
    
    if (valueSuffix) {
        valueSuffix.textContent = symbols[currency] || '';
    }
}

// Handle card type changes
function handleCardTypeChange() {
    if (!cardTypeSelect) return;
    
    const cardType = cardTypeSelect.value;
    const valueField = document.getElementById('card-value');
    const valueLabel = document.querySelector('label[for="card-value"]');
    
    if (cardType === 'promo') {
        if (valueField) {
            valueField.placeholder = 'e.g., 10 for 10% off';
            valueField.step = '1';
            valueField.min = '0';
            valueField.max = '100';
        }
        if (valueLabel) {
            valueLabel.textContent = 'Discount Percentage';
        }
    } else if (['giftcard', 'coupon'].includes(cardType)) {
        if (valueField) {
            valueField.placeholder = '0.00';
            valueField.step = '0.01';
            valueField.min = '0';
            valueField.max = '';
        }
        if (valueLabel) {
            valueLabel.textContent = 'Card Value';
        }
    } else {
        // Regular account type
        if (valueField) {
            valueField.placeholder = '';
            valueField.step = 'any';
            valueField.min = '';
            valueField.max = '';
        }
    }
    
    // Toggle card-specific fields and update currency symbol
    toggleCardSpecificFields(cardType);
    
    // Focus on the next relevant field
    setTimeout(() => {
        if (cardType === 'promo' || cardType === 'giftcard' || cardType === 'coupon') {
            const codeField = document.getElementById('card-code');
            if (codeField) codeField.focus();
        } else {
            const usernameField = document.getElementById('card-username');
            if (usernameField) usernameField.focus();
        }
    }, 100);
}

// Filter accounts based on search and type
function filterAccounts(accounts, searchTerm = '', typeFilter = 'all') {
    return accounts.filter(account => {
        const matchesSearch = !searchTerm || 
            account.name.toLowerCase().includes(searchTerm) ||
            (account.username && account.username.toLowerCase().includes(searchTerm)) ||
            (account.website && account.website.toLowerCase().includes(searchTerm)) ||
            (account.notes && account.notes.toLowerCase().includes(searchTerm)) ||
            (account.code && account.code.toLowerCase().includes(searchTerm));
            
        const matchesType = typeFilter === 'all' || 
                          (typeFilter === 'giftcard' && account.type === 'giftcard') ||
                          (typeFilter === 'coupon' && account.type === 'coupon') ||
                          (typeFilter === 'promo' && account.type === 'promo') ||
                          (typeFilter === 'other' && !['giftcard', 'coupon', 'promo'].includes(account.type));
        
        return matchesSearch && matchesType;
    });
}

// Sort accounts based on selected criteria
function sortAccounts(accounts, sortBy = 'name-asc') {
    const [field, direction] = sortBy.split('-');
    
    return [...accounts].sort((a, b) => {
        let compareA, compareB;
        
        switch(field) {
            case 'name':
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
                break;
            case 'type':
                compareA = a.type || '';
                compareB = b.type || '';
                break;
            case 'value':
                compareA = parseFloat(a.value || '0');
                compareB = parseFloat(b.value || '0');
                break;
            case 'date':
                compareA = new Date(a.dateAdded || 0);
                compareB = new Date(b.dateAdded || 0);
                break;
            default:
                return 0;
        }
        
        if (typeof compareA === 'string' && typeof compareB === 'string') {
            return direction === 'asc' 
                ? compareA.localeCompare(compareB)
                : compareB.localeCompare(compareA);
        } else {
            return direction === 'asc' 
                ? compareA - compareB
                : compareB - compareA;
        }
    });
}

// Update the UI with filtered and sorted accounts
function updateAccountList() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filter-type')?.value || 'all';
    const sortBy = document.getElementById('sort-accounts')?.value || 'name-asc';
    
    // Get accounts from storage or use empty array
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    
    // Filter and sort accounts
    let filteredAccounts = filterAccounts(accounts, searchTerm, typeFilter);
    filteredAccounts = sortAccounts(filteredAccounts, sortBy);
    
    // Update the UI
    const container = document.getElementById('accounts-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filteredAccounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No accounts found. Try adjusting your search or filters.</p>
            </div>`;
        return;
    }
    
    filteredAccounts.forEach(account => {
        const card = createAccountCard(account);
        container.appendChild(card);
    });
}

// Initialize filter and sort controls
function initFiltersAndSort() {
    // Connect navbar search to the filtering system
    const navbarSearch = document.getElementById('search-input');
    const searchButton = document.getElementById('search-btn');
    
    const triggerSearch = () => {
        updateAccountList();
    };
    
    // Handle search input (with debounce)
    let searchTimeout;
    if (navbarSearch) {
        navbarSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(triggerSearch, 300);
        });
        
        // Also trigger search on Enter key
        navbarSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                triggerSearch();
            }
        });
    }
    
    // Handle search button click
    if (searchButton) {
        searchButton.addEventListener('click', triggerSearch);
    }
    
    // Add event listeners for other filter and sort controls
    document.getElementById('filter-type')?.addEventListener('change', updateAccountList);
    document.getElementById('sort-accounts')?.addEventListener('change', updateAccountList);
}

// Initialize the app
function init() {
    // ... existing init code ...
    
    // Initialize filters and sort
    initFiltersAndSort();
    
    // Initial render
    updateAccountList();
}

init();