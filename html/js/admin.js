window.YS_Admin = {
    shops: {},
    serverItems: [],
    isEditing: false,
    editingIdentifier: null,
    inventoryImagePath: 'nui://ox_inventory/web/images/',
    selectedPickerItems: [],

    init: function (shops, colorPresets, defaultPeds, serverItems) {
        this.shops = shops || {};
        this.serverItems = serverItems || [];
        this.isEditing = false;
        this.editingIdentifier = null;
        this.selectedPickerItems = [];

        this.renderTabs();
        this.renderColorPresets(colorPresets);
        this.renderPedPresets(defaultPeds);
        this.renderShopsList();
        this.bindEvents();
        this.resetForm();
    },

    resetForm: function () {
        this.isEditing = false;
        this.editingIdentifier = null;
        this.selectedPickerItems = [];

        const form = document.getElementById('form-shop-creator');
        if (form) form.reset();

        const btnSave = document.getElementById('btn-save-shop');
        if (btnSave) {
            btnSave.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Enregistrer le Magasin`;
        }

        const tbody = document.getElementById('items-table-body');
        if (tbody) tbody.innerHTML = '';
        document.getElementById('color-hex-label').textContent = '#00f2fe';
        document.getElementById('group-buy-price').classList.add('hidden');
    },

    renderTabs: function () {
        const tabBtns = document.querySelectorAll('.admin-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                document.getElementById(targetTab).classList.add('active');

                if (targetTab === 'tab-create' && !this.isEditing) {
                    this.resetForm();
                }

                window.YS_App.playSound('click');
            });
        });
    },

    switchTab: function (tabId) {
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const targetBtn = document.querySelector(`.admin-tabs .tab-btn[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
    },

    renderColorPresets: function (presets) {
        const container = document.getElementById('color-presets-container');
        if (!container) return;
        container.innerHTML = '';
        presets = presets || [
            { label: 'Cyan', hex: '#00f2fe' },
            { label: 'Émeraude', hex: '#10b981' },
            { label: 'Violet', hex: '#a855f7' },
            { label: 'Or', hex: '#fbbf24' },
            { label: 'Rouge', hex: '#ef4444' }
        ];

        presets.forEach(preset => {
            const chip = document.createElement('div');
            chip.className = 'color-chip';
            chip.style.backgroundColor = preset.hex;
            chip.title = preset.label;
            chip.addEventListener('click', () => {
                document.getElementById('theme-color').value = preset.hex;
                document.getElementById('color-hex-label').textContent = preset.hex;
                window.YS_App.playSound('click');
            });
            container.appendChild(chip);
        });
    },

    renderPedPresets: function (peds) {
        const container = document.getElementById('ped-presets-container');
        if (!container) return;
        container.innerHTML = '';
        peds = peds || [
            { label: 'Épicier', model: 'mp_m_shopkeep_01' },
            { label: 'Armurier', model: 's_m_y_ammucity_01' }
        ];

        peds.forEach(ped => {
            const chip = document.createElement('span');
            chip.className = 'ped-chip';
            chip.textContent = ped.label;
            chip.addEventListener('click', () => {
                document.getElementById('npc-model').value = ped.model;
                window.YS_App.playSound('click');
            });
            container.appendChild(chip);
        });
    },

    openItemPickerModal: function () {
        const modal = document.getElementById('modal-item-picker');
        if (!modal) return;

        this.selectedPickerItems = [];
        this.updatePickerFooterCount();

        modal.classList.remove('hidden');
        document.getElementById('item-picker-search').value = '';
        this.renderItemPickerGrid('');
        window.YS_App.playSound('click');
    },

    closeItemPickerModal: function () {
        const modal = document.getElementById('modal-item-picker');
        if (modal) modal.classList.add('hidden');
    },

    updatePickerFooterCount: function () {
        const count = this.selectedPickerItems.length;
        const countLabel = document.getElementById('selected-items-count-label');
        const btnCount = document.getElementById('btn-confirm-count');

        if (countLabel) countLabel.textContent = `${count} article(s) sélectionné(s)`;
        if (btnCount) btnCount.textContent = count;
    },

    renderItemPickerGrid: function (searchQuery) {
        const grid = document.getElementById('item-picker-grid');
        if (!grid) return;
        grid.innerHTML = '';

        searchQuery = (searchQuery || '').toLowerCase().trim();
        const items = this.serverItems || [];

        const filtered = items.filter(item => {
            if (!searchQuery) return true;
            return (item.label && item.label.toLowerCase().includes(searchQuery)) ||
                   (item.name && item.name.toLowerCase().includes(searchQuery));
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 30px;">
                    <i class="fa-solid fa-box-open" style="font-size: 32px; opacity: 0.5;"></i>
                    <p class="mt-2">Aucun objet trouvé dans l'inventaire</p>
                </div>
            `;
            return;
        }

        const isBrowser = typeof GetParentResourceName === 'undefined';
        const imgPath = isBrowser ? 'https://raw.githubusercontent.com/overextended/ox_inventory/main/web/images/' : this.inventoryImagePath;

        filtered.forEach(item => {
            const isSelected = this.selectedPickerItems.some(i => i.name === item.name);
            const card = document.createElement('div');
            card.className = `item-picker-card ${isSelected ? 'selected' : ''}`;

            const imgUrl = `${imgPath}${item.name}.png`;

            card.innerHTML = `
                <div class="picker-selected-badge" style="${isSelected ? '' : 'display:none;'}"><i class="fa-solid fa-check"></i></div>
                <div class="item-picker-card-img">
                    <img src="${imgUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <i class="fa-solid fa-box-archive" style="display: none;"></i>
                </div>
                <div class="item-picker-card-title">${item.label || item.name}</div>
                <div class="item-picker-card-code"><code>${item.name}</code></div>
            `;

            card.onclick = () => {
                const index = this.selectedPickerItems.findIndex(i => i.name === item.name);
                if (index > -1) {
                    this.selectedPickerItems.splice(index, 1);
                    card.classList.remove('selected');
                    card.querySelector('.picker-selected-badge').style.display = 'none';
                } else {
                    this.selectedPickerItems.push({
                        name: item.name,
                        label: item.label || item.name,
                        price: 10,
                        stock: -1,
                        category: 'food'
                    });
                    card.classList.add('selected');
                    card.querySelector('.picker-selected-badge').style.display = 'flex';
                }
                this.updatePickerFooterCount();
                window.YS_App.playSound('click');
            };

            grid.appendChild(card);
        });
    },

    addItemRow: function (itemData = {}) {
        const tbody = document.getElementById('items-table-body');
        if (!tbody) return;

        const tr = document.createElement('tr');
        const isBrowser = typeof GetParentResourceName === 'undefined';
        const imgPath = isBrowser ? 'https://raw.githubusercontent.com/overextended/ox_inventory/main/web/images/' : this.inventoryImagePath;
        const imgUrl = itemData.name ? `${imgPath}${itemData.name}.png` : '';

        tr.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 28px; height: 28px; background: rgba(15,23,42,0.8); border: 1px solid var(--border-color); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
                        ${itemData.name ? `<img src="${imgUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width: 22px; height: 22px; object-fit: contain;"><i class="fa-solid fa-box" style="display: none; font-size: 12px; color: var(--accent-color);"></i>` : '<i class="fa-solid fa-box" style="font-size: 12px; color: var(--accent-color);"></i>'}
                    </div>
                    <input type="text" class="item-name-input" value="${itemData.name || ''}" placeholder="nom_item" required style="width: 100%;">
                </div>
            </td>
            <td><input type="text" class="item-label-input" value="${itemData.label || ''}" placeholder="Label affiché" required></td>
            <td><input type="number" class="item-price-input" value="${itemData.price || 10}" placeholder="Prix $" required></td>
            <td><input type="number" class="item-stock-input" value="${itemData.stock !== undefined ? itemData.stock : -1}" placeholder="-1"></td>
            <td><input type="text" class="item-cat-input" value="${itemData.category || 'food'}" placeholder="Catégorie"></td>
            <td><button type="button" class="btn-danger-sm btn-delete-row"><i class="fa-solid fa-trash"></i></button></td>
        `;

        tr.querySelector('.btn-delete-row').addEventListener('click', () => {
            tr.remove();
            window.YS_App.playSound('click');
        });

        tbody.appendChild(tr);
    },

    fillFormWithShopData: function (shopData) {
        document.getElementById('shop-name').value = shopData.name || '';
        document.getElementById('shop-id').value = shopData.identifier || '';

        if (shopData.coords) {
            document.getElementById('coords-x').value = shopData.coords.x || '';
            document.getElementById('coords-y').value = shopData.coords.y || '';
            document.getElementById('coords-z').value = shopData.coords.z || '';
            document.getElementById('coords-h').value = shopData.coords.h || '';
        }

        const themeColor = shopData.theme_color || '#00f2fe';
        document.getElementById('theme-color').value = themeColor;
        document.getElementById('color-hex-label').textContent = themeColor;

        document.getElementById('npc-enabled').checked = (shopData.npc_enabled == true || shopData.npc_enabled == 1);
        document.getElementById('npc-model').value = shopData.npc_model || 'mp_m_shopkeep_01';

        if (shopData.blip_data) {
            document.getElementById('blip-enabled').checked = (shopData.blip_data.enabled == true || shopData.blip_data.enabled == 1);
            document.getElementById('blip-sprite').value = shopData.blip_data.sprite || 52;
            document.getElementById('blip-color').value = shopData.blip_data.color || 2;
            document.getElementById('blip-scale').value = shopData.blip_data.scale || 0.8;
        }

        const isPlayerOwned = (shopData.is_player_owned == true || shopData.is_player_owned == 1);
        document.getElementById('is-player-owned').checked = isPlayerOwned;

        const groupBuyPrice = document.getElementById('group-buy-price');
        if (isPlayerOwned) {
            groupBuyPrice.classList.remove('hidden');
            document.getElementById('buy-price').value = shopData.buy_price || 50000;
        } else {
            groupBuyPrice.classList.add('hidden');
        }

        const tbody = document.getElementById('items-table-body');
        if (tbody) tbody.innerHTML = '';

        if (shopData.items && shopData.items.length > 0) {
            shopData.items.forEach(item => this.addItemRow(item));
        }
    },

    editShop: function (shopData) {
        this.isEditing = true;
        this.editingIdentifier = shopData.identifier;

        this.fillFormWithShopData(shopData);

        const btnSave = document.getElementById('btn-save-shop');
        if (btnSave) {
            btnSave.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Mettre à jour le Magasin (${shopData.name})`;
        }

        this.switchTab('tab-create');
        window.YS_App.playSound('click');
    },

    cloneShop: function (shopData) {
        this.isEditing = false;
        this.editingIdentifier = null;

        const clonedData = JSON.parse(JSON.stringify(shopData));
        clonedData.name = shopData.name + ' (Copie)';
        clonedData.identifier = shopData.identifier + '_copie';

        this.fillFormWithShopData(clonedData);

        const btnSave = document.getElementById('btn-save-shop');
        if (btnSave) {
            btnSave.innerHTML = `<i class="fa-solid fa-copy"></i> Enregistrer comme Nouveau Magasin Cloné`;
        }

        this.switchTab('tab-create');
        window.YS_App.playSound('success');
    },

    bindEvents: function () {
        // Bouton Placement 3D du PNJ
        const btnPlace3D = document.getElementById('btn-place-3d-ped');
        if (btnPlace3D) {
            btnPlace3D.onclick = () => {
                const model = document.getElementById('npc-model').value.trim() || 'mp_m_shopkeep_01';
                const coords = {
                    x: parseFloat(document.getElementById('coords-x').value) || 0,
                    y: parseFloat(document.getElementById('coords-y').value) || 0,
                    z: parseFloat(document.getElementById('coords-z').value) || 0,
                    h: parseFloat(document.getElementById('coords-h').value) || 0
                };
                document.getElementById('app').classList.add('hidden');
                window.YS_App.post('startPedPlacement', { model: model, coords: coords });
            };
        }

        // Bouton Récupérer Coordonnées
        const btnGetCoords = document.getElementById('btn-get-coords');
        if (btnGetCoords) {
            btnGetCoords.onclick = () => {
                window.YS_App.post('getCoords').then(coords => {
                    if (coords && coords.x) {
                        document.getElementById('coords-x').value = coords.x;
                        document.getElementById('coords-y').value = coords.y;
                        document.getElementById('coords-z').value = coords.z;
                        document.getElementById('coords-h').value = coords.h;
                        window.YS_App.playSound('success');
                    }
                });
            };
        }

        // Color picker label update
        const colorInput = document.getElementById('theme-color');
        if (colorInput) {
            colorInput.oninput = (e) => {
                document.getElementById('color-hex-label').textContent = e.target.value;
            };
        }

        // Toggle Magasin Joueur
        const chkPlayerOwned = document.getElementById('is-player-owned');
        if (chkPlayerOwned) {
            chkPlayerOwned.onchange = (e) => {
                const groupPrice = document.getElementById('group-buy-price');
                if (e.target.checked) {
                    groupPrice.classList.remove('hidden');
                } else {
                    groupPrice.classList.add('hidden');
                }
            };
        }

        // Bouton Ouvrir le Sélecteur d'Items Visuel
        const btnAddItem = document.getElementById('btn-add-item-row');
        if (btnAddItem) {
            btnAddItem.onclick = () => this.openItemPickerModal();
        }

        // Fermer le Sélecteur d'Items
        const btnClosePicker = document.getElementById('btn-close-item-picker');
        if (btnClosePicker) {
            btnClosePicker.onclick = () => this.closeItemPickerModal();
        }

        // Recherche en direct dans le sélecteur d'items
        const inputSearchPicker = document.getElementById('item-picker-search');
        if (inputSearchPicker) {
            inputSearchPicker.oninput = (e) => this.renderItemPickerGrid(e.target.value);
        }

        // Bouton Réinitialiser la Sélection Multiple
        const btnClearSelection = document.getElementById('btn-clear-item-selection');
        if (btnClearSelection) {
            btnClearSelection.onclick = () => {
                this.selectedPickerItems = [];
                this.updatePickerFooterCount();
                const searchQuery = document.getElementById('item-picker-search').value;
                this.renderItemPickerGrid(searchQuery);
                window.YS_App.playSound('click');
            };
        }

        // Bouton Valider & Ajouter les Articles Sélectionnés
        const btnConfirmAdd = document.getElementById('btn-confirm-add-selected-items');
        if (btnConfirmAdd) {
            btnConfirmAdd.onclick = () => {
                if (this.selectedPickerItems.length === 0) return;

                this.selectedPickerItems.forEach(item => {
                    this.addItemRow(item);
                });

                this.closeItemPickerModal();
                window.YS_App.playSound('success');
            };
        }

        // Form submission (Création OU Édition)
        const form = document.getElementById('form-shop-creator');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();

                // Lire les items
                const itemRows = document.querySelectorAll('#items-table-body tr');
                const items = [];
                itemRows.forEach(row => {
                    const nameInput = row.querySelector('.item-name-input');
                    const name = (nameInput ? nameInput.value : '').trim();
                    const label = row.querySelector('.item-label-input').value.trim();
                    const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
                    const stock = parseInt(row.querySelector('.item-stock-input').value);
                    const category = row.querySelector('.item-cat-input').value.trim() || 'food';

                    if (name && label) {
                        items.push({ name, label, price, stock, category });
                    }
                });

                const shopData = {
                    name: document.getElementById('shop-name').value.trim(),
                    identifier: document.getElementById('shop-id').value.trim(),
                    coords: {
                        x: parseFloat(document.getElementById('coords-x').value),
                        y: parseFloat(document.getElementById('coords-y').value),
                        z: parseFloat(document.getElementById('coords-z').value),
                        h: parseFloat(document.getElementById('coords-h').value)
                    },
                    theme_color: document.getElementById('theme-color').value,
                    npc_enabled: document.getElementById('npc-enabled').checked,
                    npc_model: document.getElementById('npc-model').value.trim() || 'mp_m_shopkeep_01',
                    blip_data: {
                        enabled: document.getElementById('blip-enabled').checked,
                        sprite: parseInt(document.getElementById('blip-sprite').value) || 52,
                        color: parseInt(document.getElementById('blip-color').value) || 2,
                        scale: parseFloat(document.getElementById('blip-scale').value) || 0.8,
                        name: document.getElementById('shop-name').value.trim()
                    },
                    is_player_owned: document.getElementById('is-player-owned').checked,
                    buy_price: parseInt(document.getElementById('buy-price').value) || 0,
                    items: items
                };

                const targetEvent = this.isEditing ? 'updateShop' : 'createShop';

                window.YS_App.post(targetEvent, shopData).then(() => {
                    window.YS_App.playSound('success');
                    window.YS_App.closeAll();
                });
            };
        }
    },

    renderShopsList: function () {
        const container = document.getElementById('shops-list-container');
        const countSpan = document.getElementById('shop-count');
        if (!container) return;

        const shopKeys = Object.keys(this.shops);
        if (countSpan) countSpan.textContent = shopKeys.length;

        container.innerHTML = '';

        shopKeys.forEach(key => {
            const shop = this.shops[key];
            const card = document.createElement('div');
            card.className = 'shop-manage-card';
            card.style.borderLeft = `4px solid ${shop.theme_color || '#00f2fe'}`;
            card.style.background = 'rgba(30, 41, 59, 0.6)';
            card.style.padding = '16px';
            card.style.borderRadius = '8px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.marginBottom = '12px';

            card.innerHTML = `
                <div>
                    <h4 style="font-size: 16px; font-weight: 700; color: #fff;">${shop.name}</h4>
                    <p style="font-size: 12px; color: #94a3b8;">ID: <code>${shop.identifier}</code> • Items: ${shop.items ? shop.items.length : 0}</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary btn-tp-shop" title="Se Téléporter"><i class="fa-solid fa-location-arrow"></i> TP</button>
                    <button class="btn-secondary btn-edit-shop" title="Éditer le Magasin" style="color: #00f2fe; border-color: rgba(0,242,254,0.3);"><i class="fa-solid fa-pen-to-square"></i> Éditer</button>
                    <button class="btn-secondary btn-clone-shop" title="Cloner le Magasin" style="color: #fbbf24; border-color: rgba(251,191,36,0.3);"><i class="fa-solid fa-copy"></i> Cloner</button>
                    <button class="btn-danger-sm btn-delete-shop" title="Supprimer"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;

            card.querySelector('.btn-tp-shop').onclick = () => {
                window.YS_App.post('teleportToShop', shop.identifier);
                window.YS_App.closeAll();
            };

            card.querySelector('.btn-edit-shop').onclick = () => {
                this.editShop(shop);
            };

            card.querySelector('.btn-clone-shop').onclick = () => {
                this.cloneShop(shop);
            };

            card.querySelector('.btn-delete-shop').onclick = () => {
                window.YS_App.post('deleteShop', shop.identifier).then(() => {
                    card.remove();
                    window.YS_App.playSound('click');
                });
            };

            container.appendChild(card);
        });
    }
};
