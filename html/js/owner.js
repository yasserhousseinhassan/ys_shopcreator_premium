window.YS_Owner = {
    currentShop: null,

    open: function (shop) {
        this.currentShop = shop;
        document.getElementById('owner-shop-title').textContent = shop.name;
        document.getElementById('owner-vault-balance').textContent = `$${shop.vault_balance || 0}`;
        this.bindEvents();
    },

    bindEvents: function () {
        const btnDeposit = document.getElementById('btn-deposit-vault');
        const btnWithdraw = document.getElementById('btn-withdraw-vault');
        const inputAmount = document.getElementById('vault-amount-input');

        if (btnDeposit) {
            btnDeposit.onclick = () => {
                const amount = parseFloat(inputAmount.value);
                if (amount && amount > 0) {
                    window.YS_App.post('depositVault', {
                        identifier: this.currentShop.identifier,
                        amount: amount
                    }).then(() => {
                        window.YS_App.playSound('success');
                        window.YS_App.closeAll();
                    });
                }
            };
        }

        if (btnWithdraw) {
            btnWithdraw.onclick = () => {
                const amount = parseFloat(inputAmount.value);
                if (amount && amount > 0) {
                    window.YS_App.post('withdrawVault', {
                        identifier: this.currentShop.identifier,
                        amount: amount
                    }).then(() => {
                        window.YS_App.playSound('success');
                        window.YS_App.closeAll();
                    });
                }
            };
        }
    }
};
