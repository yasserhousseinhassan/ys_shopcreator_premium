window.YS_Admin = {
    shops: {},
    serverItems: [],
    isEditing: false,
    editingIdentifier: null,

    init: function (shops, colorPresets, defaultPeds, serverItems) {
        this.shops = shops || {};
        this.serverItems = serverItems || [];
        this.isEditing = false;
        this.editingIdentifier = null;

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

    addItemRow: function (itemData = {}) {
        const tbody = document.getElementById('items-table-body');
        if (!tbody) return;

        let selectOptionsHtml = '<option value="">-- Choisir un item de l\'inventaire --</option>';
        if (this.serverItems && this.serverItems.length > 0) {
            this.serverItems.forEach(item => {
                const selected = (itemData.name === item.name) ? 'selected' : '';
                selectOptionsHtml += `<option value="${item.name}" data-label="${item.label}" ${selected}>${item.label} (${item.name})</option>`;
            });
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <select class="item-select-input" style="width: 100%;">
                    ${selectOptionsHtml}
                </select>
                <input type="hidden" class="item-name-input" value="${itemData.name || ''}">
            </td>
            <td><input type="text" class="item-label-input" value="${itemData.label || ''}" placeholder="Label affiché" required></td>
            <td><input type="number" class="item-price-input" value="${itemData.price || 10}" placeholder="Prix $" required></td>
            <td><input type="number" class="item-stock-input" value="${itemData.stock !== undefined ? itemData.stock : -1}" placeholder="-1"></td>
            <td><input type="text" class="item-cat-input" value="${itemData.category || 'food'}" placeholder="Catégorie"></td>
            <td><button type="button" class="btn-danger-sm btn-delete-row"><i class="fa-solid fa-trash"></i></button></td>
        `;

        const selectEl = tr.querySelector('.item-select-input');
        const nameInput = tr.querySelector('.item-name-input');
        const labelInput = tr.querySelector('.item-label-input');

        selectEl.addEventListener('change', (e) => {
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            const itemName = selectedOpt.value;
            const itemLabel = selectedOpt.getAttribute('data-label') || itemName;

            nameInput.value = itemName;
            if (itemLabel) {
                labelInput.value = itemLabel;
            }
        });

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

        // Bouton Ajouter une ligne d'Item
        const btnAddItem = document.getElementById('btn-add-item-row');
        if (btnAddItem) {
            btnAddItem.onclick = () => this.addItemRow();
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
                    const selectEl = row.querySelector('.item-select-input');
                    const name = (nameInput.value || (selectEl ? selectEl.value : '')).trim();
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
