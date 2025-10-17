        // Initialize accounts from localStorage or empty array
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

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
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = link.getAttribute('data-page');
                    switchPage(page);
                });
            });

            // Modal
            addAccountBtn.addEventListener('click', openAddModal);
            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            saveBtn.addEventListener('click', saveAccount);

            // Search and filter
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') handleSearch();
            });
            filterType.addEventListener('change', filterAndSortAccounts);
            sortBy.addEventListener('change', filterAndSortAccounts);

            // Close modal when clicking outside
            accountModal.addEventListener('click', (e) => {
                if (e.target === accountModal) closeModal();
            });
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

        // Open modal for adding a new account
        function openAddModal() {
            document.getElementById('modal-title').textContent = 'Add New Account';
            accountForm.reset();
            editingAccountId = null;
            accountModal.classList.add('active');
        }

        // Open modal for editing an account
        function openEditModal(accountId) {
            const account = accounts.find(acc => acc.id === accountId);
            if (!account) return;

            document.getElementById('modal-title').textContent = 'Edit Account';
            document.getElementById('account-id').value = account.id;
            document.getElementById('account-name').value = account.name;
            document.getElementById('account-type').value = account.type;
            document.getElementById('username').value = account.username;
            document.getElementById('password').value = account.password;
            document.getElementById('url').value = account.url || '';
            document.getElementById('notes').value = account.notes || '';
            editingAccountId = accountId;
            accountModal.classList.add('active');
        }

// Open modal for editing an account
function openEditModal(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    document.getElementById('modal-title').textContent = 'Edit Account';
    document.getElementById('account-id').value = account.id;
    document.getElementById('account-name').value = account.name;
    document.getElementById('account-type').value = account.type;
    document.getElementById('username').value = account.username;
    document.getElementById('password').value = account.password;
    document.getElementById('url').value = account.url || '';
    document.getElementById('notes').value = account.notes || '';
    editingAccountId = accountId;
    accountModal.classList.add('active');
}

// Close modal
function closeModal() {
    accountModal.classList.remove('active');
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
    const id = document.getElementById('account-id').value;
    const name = document.getElementById('account-name').value.trim();
    const type = document.getElementById('account-type').value;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const url = document.getElementById('url').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!name || !type || !username || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (editingAccountId) {
        // Update existing account
        const index = accounts.findIndex(acc => acc.id === parseInt(editingAccountId));
        if (index !== -1) {
            accounts[index] = {
                ...accounts[index],
                name,
                type,
                username,
                password: password.startsWith('••••') ? accounts[index].password : password,
                url,
                notes,
                dateAdded: accounts[index].dateAdded || new Date().toISOString().split('T')[0]
            };
            showToast('Account updated successfully', 'success');
        }
    } else {
        // Add new account
        const newAccount = {
            id: Date.now(),
            name,
            type,
            username,
            password,
            url,
            notes,
            isFavorite: false,
            dateAdded: new Date().toISOString().split('T')[0]
        };
        accounts.push(newAccount);
        showToast('Account added successfully', 'success');
    }

    saveAccounts();
    closeModal();
    filterAndSortAccounts(); // Update the filtered list
    if (currentPage === 'favorites') renderFavorites();
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
    card.className = 'account-card';
    
    const typeIcon = getTypeIcon(account.type);
    const favoriteClass = account.isFavorite ? 'active' : '';
    const displayUrl = account.url ? formatUrlDisplay(account.url) : '';
    
    card.innerHTML = `
        <div class="account-header">
            <div class="account-type">
                <i class="${typeIcon}"></i> ${account.name}
            </div>
            <button class="favorite-btn ${favoriteClass}" data-id="${account.id}">
                <i class="fas fa-star"></i>
            </button>
        </div>
        <div class="account-details">
            <div class="account-field">
                <span class="field-label">Type:</span>
                <span class="field-value">${capitalizeFirst(account.type)}</span>
            </div>
            <div class="account-field">
                <span class="field-label">Username:</span>
                <span class="field-value">${account.username}</span>
            </div>
            <div class="account-field">
                <span class="field-label">Password:</span>
                <span class="field-value">••••••••</span>
            </div>
            ${account.url ? `
            <div class="account-field">
                <span class="field-label">Website:</span>
                <span class="field-value">
                    <a href="${account.url.startsWith('http') ? account.url : 'https://' + account.url}" 
                       target="_blank" 
                       class="website-link" 
                       title="${account.url}">
                        ${displayUrl}
                    </a>
                </span>
            </div>
            ` : ''}
            ${account.notes ? `
            <div class="account-field">
                <span class="field-label">Notes:</span>
                <span class="field-value">${account.notes}</span>
            </div>
            ` : ''}
        </div>
        <div class="account-actions">
            <button class="action-btn edit-btn" data-id="${account.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete-btn" data-id="${account.id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    // Add event listeners
    const favoriteBtn = card.querySelector('.favorite-btn');
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');
    const passwordField = card.querySelector('.field-value:nth-child(3)');
    
    favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(account.id);
    });
    
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(account.id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAccount(account.id);
    });
    
    // Toggle password visibility
    let passwordVisible = false;
    card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || 
            e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        
        passwordVisible = !passwordVisible;
        passwordField.textContent = passwordVisible ? account.password : '••••••••';
    });
    
    return card;
}

        // Helper function to get icon for account type
        function getTypeIcon(type) {
            switch(type) {
                case 'bank': return 'fas fa-university';
                case 'email': return 'fas fa-envelope';
                case 'social': return 'fas fa-users';
                case 'shopping': return 'fas fa-shopping-cart';
                default: return 'fas fa-key';
            }
        }

        // Helper function to capitalize first letter
        function capitalizeFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        // Initialize the app
        init();