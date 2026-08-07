// Mode Navigateur Web (Hors FiveM) pour tester sans lancer GTA/FiveM
const isBrowser = typeof GetParentResourceName === 'undefined';
if (isBrowser) {
    window.GetParentResourceName = () => 'ys_shopcreator_premium';
}

window.YS_App = {
    // Communication NUI sécurisée avec FiveM (ou Mock en navigateur)
    post: function (event, data = {}) {
        if (isBrowser) {
            console.log(`[Browser Mock NUI Post] ${event}:`, data);
            if (event === 'getCoords') {
                return Promise.resolve({ x: 215.45, y: -810.20, z: 30.40, h: 90.0 });
            }
            return Promise.resolve({ status: 'ok' });
        }

        return fetch(`https://${GetParentResourceName()}/${event}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(data)
        }).then(resp => resp.json()).catch(() => ({}));
    },

    // Web Audio Synthesizer pour effets sonores NUI ultra-smooth
    playSound: function (type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'click') {
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'success') {
                osc.frequency.setValueAtTime(520, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            }
        } catch (e) {}
    },

    closeAll: function () {
        document.getElementById('app').classList.add('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('player-shop-modal').classList.add('hidden');
        document.getElementById('owner-panel').classList.add('hidden');
        this.post('closeUI');
    }
};

// Écouteur global des messages NUI
window.addEventListener('message', function (event) {
    const data = event.data;

    if (!data || !data.action) return;

    const appEl = document.getElementById('app');

    if (data.action === 'openAdmin') {
        appEl.classList.remove('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('player-shop-modal').classList.add('hidden');
        document.getElementById('owner-panel').classList.add('hidden');

        if (window.YS_Admin) {
            window.YS_Admin.init(data.shops, data.colorPresets, data.defaultPeds, data.serverItems);
        }
    } else if (data.action === 'openShop') {
        appEl.classList.remove('hidden');
        document.getElementById('player-shop-modal').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('owner-panel').classList.add('hidden');

        if (window.YS_Shop) {
            window.YS_Shop.open(data.shop, data.inventoryImagePath);
        }
    } else if (data.action === 'openOwner') {
        appEl.classList.remove('hidden');
        document.getElementById('owner-panel').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('player-shop-modal').classList.add('hidden');

        if (window.YS_Owner) {
            window.YS_Owner.open(data.shop);
        }
    } else if (data.action === 'pedPlaced') {
        if (data.coords) {
            document.getElementById('coords-x').value = data.coords.x;
            document.getElementById('coords-y').value = data.coords.y;
            document.getElementById('coords-z').value = data.coords.z;
            document.getElementById('coords-h').value = data.coords.h;
        }
        appEl.classList.remove('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        window.YS_App.playSound('success');
    }
});

// Fermeture via touche Echap
window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        window.YS_App.closeAll();
    }
});

// Écouteurs de fermeture boutons X
document.getElementById('btn-close-admin').addEventListener('click', () => window.YS_App.closeAll());
document.getElementById('btn-close-shop').addEventListener('click', () => window.YS_App.closeAll());
document.getElementById('btn-close-owner').addEventListener('click', () => window.YS_App.closeAll());

// ====================================================================
// 🧪 MODE TEST AUTOMATIQUE DANS LE NAVIGATEUR (CHROME / EDGE / FIREFOX)
// ====================================================================
if (isBrowser) {
    document.addEventListener('DOMContentLoaded', () => {
        // Ajouter une barre de test flottante en bas à droite de Chrome
        const devBar = document.createElement('div');
        devBar.style.position = 'fixed';
        devBar.style.bottom = '20px';
        devBar.style.right = '20px';
        devBar.style.zIndex = '99999';
        devBar.style.background = '#0f172a';
        devBar.style.border = '1px solid #00f2fe';
        devBar.style.padding = '12px 18px';
        devBar.style.borderRadius = '12px';
        devBar.style.boxShadow = '0 10px 30px rgba(0,242,254,0.3)';
        devBar.style.display = 'flex';
        devBar.style.gap = '10px';

        devBar.innerHTML = `
            <span style="color:#00f2fe; font-weight:bold; align-self:center; font-size:13px;">🌐 BROWSER TEST MODE:</span>
            <button id="dev-btn-admin" style="background:#00f2fe; color:#0f172a; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">👑 Panel Admin</button>
            <button id="dev-btn-shop" style="background:#10b981; color:#fff; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">🛍️ Shop Joueur</button>
        `;

        document.body.appendChild(devBar);

        const dummyServerItems = [
            { name: 'bread', label: 'Pain Chaud' },
            { name: 'water', label: 'Bouteille d\'Eau' },
            { name: 'phone', label: 'Téléphone Portable' },
            { name: 'bandage', label: 'Bandage Médical' },
            { name: 'weapon_pistol', label: 'Pistolet 9mm' }
        ];

        const dummyShop = {
            identifier: 'supermarket_test',
            name: 'Supermarché Vinewood 24/7',
            theme_color: '#00f2fe',
            items: [
                { name: 'bread', label: 'Pain Chaud', price: 15, stock: -1, category: 'food' },
                { name: 'water', label: 'Bouteille d\'Eau', price: 10, stock: -1, category: 'drink' },
                { name: 'phone', label: 'Téléphone Portable', price: 450, stock: 5, category: 'tools' }
            ]
        };

        document.getElementById('dev-btn-admin').onclick = () => {
            window.postMessage({
                action: 'openAdmin',
                shops: { 'supermarket_test': dummyShop },
                serverItems: dummyServerItems
            }, '*');
        };

        document.getElementById('dev-btn-shop').onclick = () => {
            window.postMessage({
                action: 'openShop',
                shop: dummyShop,
                inventoryImagePath: 'https://raw.githubusercontent.com/overextended/ox_inventory/main/web/images/'
            }, '*');
        };
    });
}
