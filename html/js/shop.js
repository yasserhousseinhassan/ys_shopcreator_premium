window.YS_Shop = {
    currentShop: null,
    cart: [],
    paymentType: 'cash',
    activeCategory: 'all',

    open: function (shop, inventoryImagePath) {
        this.currentShop = shop;
        this.inventoryImagePath = inventoryImagePath || 'nui://ox_inventory/web/images/';
        this.cart = [];
        this.activeCategory = 'all';

        // Appliquer le thème de couleur personnalisé choisi par l'admin !
        const themeColor = shop.theme_color || '#00f2fe';
        document.documentElement.style.setProperty('--accent-color', themeColor);
        document.documentElement.style.setProperty('--accent-glow', themeColor + '40');

        document.getElementById('player-shop-title').textContent = shop.name;
        document.getElementById('player-shop-subtitle').innerHTML = `<i class="fa-solid fa-location-dot"></i> Magasin Ouvert • Produits Frais & Équipements`;

        this.renderCategoryPills();
        this.renderItems();
        this.renderCart();
        this.bindEvents();
    },

    renderCategoryPills: function () {
        const container = document.getElementById('shop-category-pills');
        if (!container) return;

        const categories = new Set(['all']);
        if (this.currentShop.items) {
            this.currentShop.items.forEach(item => {
                if (item.category) categories.add(item.category);
            });
        }

        container.innerHTML = '';
        categories.forEach(cat => {
            const pill = document.createElement('button');
            pill.className = `cat-pill ${cat === this.activeCategory ? 'active' : ''}`;
            pill.setAttribute('data-cat', cat);
            pill.textContent = cat === 'all' ? 'Tous' : (cat.charAt(0).toUpperCase() + cat.slice(1));
            pill.onclick = () => {
                this.activeCategory = cat;
                document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.renderItems();
                window.YS_App.playSound('click');
            };
            container.appendChild(pill);
        });
    },

    renderItems: function () {
        const container = document.getElementById('shop-items-container');
        if (!container) return;
        container.innerHTML = '';

        const searchQuery = document.getElementById('shop-search-input').value.toLowerCase().trim();
        const items = this.currentShop.items || [];

        const filtered = items.filter(item => {
            const matchesCat = (this.activeCategory === 'all' || item.category === this.activeCategory);
            const matchesSearch = (!searchQuery || item.label.toLowerCase().includes(searchQuery) || item.name.toLowerCase().includes(searchQuery));
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 40px;"><i class="fa-solid fa-box-open" style="font-size: 32px; opacity: 0.5;"></i><p class="mt-2">Aucun article disponible</p></div>`;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-item-card';

            const stockText = item.stock !== undefined && item.stock >= 0 ? `Stock: ${item.stock}` : 'En Stock';
            const imgUrl = `${this.inventoryImagePath}${item.name}.png`;

            card.innerHTML = `
                <div class="item-img-placeholder">
                    <img src="${imgUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width: 56px; height: 56px; object-fit: contain;">
                    <i class="fa-solid fa-box-archive" style="display: none; font-size: 32px; color: var(--accent-color);"></i>
                </div>
                <div class="item-name">${item.label}</div>
                <div class="item-price">$${item.price}</div>
                <span style="font-size: 11px; color: #94a3b8; margin-bottom: 10px;">${stockText}</span>
                <button class="btn-add-cart"><i class="fa-solid fa-cart-plus"></i> Ajouter</button>
            `;

            card.querySelector('.btn-add-cart').onclick = () => {
                this.addToCart(item);
                window.YS_App.playSound('click');
            };

            container.appendChild(card);
        });
    },

    addToCart: function (item) {
        const existing = this.cart.find(c => c.name === item.name);
        if (existing) {
            existing.count += 1;
        } else {
            this.cart.push({
                name: item.name,
                label: item.label,
                price: item.price,
                count: 1
            });
        }
        this.renderCart();
    },

    renderCart: function () {
        const container = document.getElementById('cart-items-container');
        const countSpan = document.getElementById('cart-item-count');
        const totalSpan = document.getElementById('cart-total');
        const subtotalSpan = document.getElementById('cart-subtotal');
        const btnCheckout = document.getElementById('btn-checkout');

        if (!container) return;

        let total = 0;
        let totalCount = 0;

        container.innerHTML = '';

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="cart-empty-state">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <p>Votre panier est vide</p>
                </div>
            `;
            btnCheckout.disabled = true;
            btnCheckout.innerHTML = `<i class="fa-solid fa-check"></i> Payer la commande ($0)`;
            if (countSpan) countSpan.textContent = 0;
            if (totalSpan) totalSpan.textContent = '$0';
            if (subtotalSpan) subtotalSpan.textContent = '$0';
            return;
        }

        this.cart.forEach((cartItem, idx) => {
            total += cartItem.price * cartItem.count;
            totalCount += cartItem.count;

            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <div>
                    <div style="font-weight: 600; font-size: 13px;">${cartItem.label}</div>
                    <div style="font-size: 12px; color: #10b981;">$${cartItem.price * cartItem.count}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-secondary" style="padding: 2px 8px;" class="btn-qty-minus">-</button>
                    <span style="font-weight: 700; font-size: 13px;">${cartItem.count}</span>
                    <button class="btn-secondary" style="padding: 2px 8px;" class="btn-qty-plus">+</button>
                </div>
            `;

            row.querySelectorAll('button')[0].onclick = () => {
                cartItem.count -= 1;
                if (cartItem.count <= 0) {
                    this.cart.splice(idx, 1);
                }
                this.renderCart();
                window.YS_App.playSound('click');
            };

            row.querySelectorAll('button')[1].onclick = () => {
                cartItem.count += 1;
                this.renderCart();
                window.YS_App.playSound('click');
            };

            container.appendChild(row);
        });

        if (countSpan) countSpan.textContent = totalCount;
        if (totalSpan) totalSpan.textContent = `$${total}`;
        if (subtotalSpan) subtotalSpan.textContent = `$${total}`;

        btnCheckout.disabled = false;
        btnCheckout.innerHTML = `<i class="fa-solid fa-check"></i> Payer la commande ($${total})`;
    },

    bindEvents: function () {
        // Barre de Recherche
        const searchInput = document.getElementById('shop-search-input');
        if (searchInput) {
            searchInput.oninput = () => this.renderItems();
        }

        // Choix Paiement (Liquide / Banque)
        const payBtns = document.querySelectorAll('.payment-options .pay-btn');
        payBtns.forEach(btn => {
            btn.onclick = () => {
                payBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.paymentType = btn.getAttribute('data-pay');
                window.YS_App.playSound('click');
            };
        });

        // Checkout Validation
        const btnCheckout = document.getElementById('btn-checkout');
        if (btnCheckout) {
            btnCheckout.onclick = () => {
                if (this.cart.length === 0) return;

                window.YS_App.post('buyItems', {
                    identifier: this.currentShop.identifier,
                    items: this.cart,
                    paymentType: this.paymentType
                }).then(() => {
                    window.YS_App.playSound('success');
                    window.YS_App.closeAll();
                });
            };
        }
    }
};
