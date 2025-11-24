// cart.js - Cart management functionality

class CartManager {
    constructor() {
        this.db = freshGreensDB;
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        this.updateCartUI();
        this.setupEventListeners();
    }

    getCurrentUser() {
        const user = localStorage.getItem('freshgreens_current_user');
        return user ? JSON.parse(user) : null;
    }

    getUserId() {
        return this.currentUser ? this.currentUser.id : 'guest';
    }

    updateCartUI() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const count = this.db.getCartItemCount(this.getUserId());
            cartCount.textContent = count;
        }
    }

    setupEventListeners() {
        // Add to cart buttons for premade salads - use named function to prevent duplicate listeners
        if (!window.cartAddToCartListener) {
            window.cartAddToCartListener = (e) => {
                if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
                    const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
                    const productId = button.getAttribute('data-id');
                    const productName = button.getAttribute('data-name');
                    const productPrice = parseFloat(button.getAttribute('data-price'));

                    const product = {
                        id: parseInt(productId),
                        name: productName,
                        price: productPrice,
                        category: 'premade'
                    };

                    this.addToCart(product);
                }
            };
            document.addEventListener('click', window.cartAddToCartListener);
        }

        // Custom salad builder add to cart - prevent duplicate listeners
        const customSaladBtn = document.getElementById('add-custom-to-cart');
        if (customSaladBtn && !customSaladBtn.hasCartListener) {
            customSaladBtn.addEventListener('click', () => {
                this.handleAddCustomSalad();
            });
            customSaladBtn.hasCartListener = true;
        }

        // Proceed to checkout button
        const checkoutBtn = document.getElementById('proceed-to-checkout');
        if (checkoutBtn && !checkoutBtn.hasCheckoutListener) {
            checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
            checkoutBtn.hasCheckoutListener = true;
        }
    }

    // Custom Salad Handler
    handleAddCustomSalad() {
        const state = window.currentSalad || {};

        const bases = Array.isArray(state.bases) ? state.bases : (state.base ? [state.base] : []);
        const proteins = Array.isArray(state.proteins) ? state.proteins : (state.protein ? [state.protein] : []);
        const vegetables = Array.isArray(state.vegetables) ? state.vegetables : (state.vegetable ? [state.vegetable] : []);
        const fruits = Array.isArray(state.fruits) ? state.fruits : (state.fruit ? [state.fruit] : []);
        const toppings = Array.isArray(state.toppings) ? state.toppings : (state.topping ? [state.topping] : []);
        const dressings = Array.isArray(state.dressings) ? state.dressings : (state.dressing ? [state.dressing] : []);

        if (!bases.length) {
            return;
        }

        let price = 149;
        let description = 'Custom salad with: ';

        if (bases.length) { bases.forEach(b => { if (b && b.price) price += b.price; }); description += `Bases: ${bases.map(b => b.name).join(', ')}, `; }
        if (proteins.length) { proteins.forEach(p => { if (p && p.price) price += p.price; }); description += `Proteins: ${proteins.map(p => p.name).join(', ')}, `; }
        if (vegetables.length) { vegetables.forEach(v => { if (v && v.price) price += v.price; }); description += `Vegetables: ${vegetables.map(v => v.name).join(', ')}, `; }
        if (fruits.length) { fruits.forEach(f => { if (f && f.price) price += f.price; }); description += `Fruits: ${fruits.map(f => f.name).join(', ')}, `; }
        if (toppings.length) { toppings.forEach(t => { if (t && t.price) price += t.price; }); description += `Toppings: ${toppings.map(t => t.name).join(', ')}, `; }
        if (dressings.length) { dressings.forEach(d => { if (d && d.price) price += d.price; }); description += `Dressings: ${dressings.map(d => d.name).join(', ')}`; }

        description = description.replace(/, $/, '');

        const customSalad = {
            id: Date.now(),
            name: 'Custom Salad',
            price: price,
            description: description,
            category: 'custom',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80'
        };

        const customizations = {
            base: bases[0] || null,
            protein: proteins[0] || null,
            vegetables: vegetables || [],
            fruits: fruits || [],
            toppings: toppings || [],
            dressing: dressings[0] || null
        };

        this.addToCart(customSalad, 1, customizations);

        if (window.resetSaladBuilder) window.resetSaladBuilder();
    }

    addToCart(product, quantity = 1, customizations = {}) {
        const userId = this.getUserId();
        const cart = this.db.addToCart(userId, product, quantity, customizations);
        this.showAddToCartMessage(product.name);
        this.updateCartUI();
        return cart;
    }

    showAddToCartMessage(productName) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>Added ${productName} to cart!</span>
            </div>
        `;

        if (!document.querySelector('#cart-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-toast-styles';
            styles.textContent = `
                .cart-toast { position: fixed; top: 20px; right: 20px; background: var(--primary); color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; animation: slideIn 0.3s ease; }
                .toast-content { display: flex; align-items: center; gap: 10px; }
                .toast-content i { font-size: 1.2rem; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    getCart() {
        return this.db.getCart(this.getUserId());
    }

    updateQuantity(itemId, quantity) {
        const userId = this.getUserId();
        return this.db.updateCartItem(userId, itemId, quantity);
    }

    removeItem(itemId) {
        const userId = this.getUserId();
        return this.db.removeFromCart(userId, itemId);
    }

    clearCart() {
        const userId = this.getUserId();
        return this.db.clearCart(userId);
    }

    getTotal() {
        const cart = this.getCart();
        return cart.total;
    }

    getItemCount() {
        return this.db.getCartItemCount(this.getUserId());
    }

    // New: Handle checkout
    handleCheckout() {
        const cart = this.getCart();
        if (!cart.items.length) {
            alert('Your cart is empty! Please add items before proceeding to checkout.');
            return;
        }

        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            const goToLogin = confirm('You need to be logged in to proceed. Go to login page?');
            if (goToLogin) window.location.href = '/login.html';
            return;
        }

        window.location.href = '/checkout.html';
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment to ensure database is initialized
    setTimeout(() => {
        if (typeof freshGreensDB === 'undefined') {
            console.error('Database not available');
            return;
        }
        window.cartManager = new CartManager();
    }, 100);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
