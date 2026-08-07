local ShopsTable = {}

-- Chargement initial des magasins depuis la BDD
local function LoadShopsFromDatabase()
    MySQL.query('SELECT * FROM ys_shops', {}, function(results)
        ShopsTable = {}
        if results then
            for i = 1, #results do
                local row = results[i]
                row.coords = json.decode(row.coords or '{}')
                row.blip_data = json.decode(row.blip_data or '{}')
                row.items = json.decode(row.items or '[]')
                row.restrictions = json.decode(row.restrictions or '{}')
                row.npc_enabled = row.npc_enabled == 1
                row.is_player_owned = row.is_player_owned == 1

                ShopsTable[row.identifier] = row
            end
        end
        print(('[YS_ShopCreator] %s magasin(s) chargé(s) depuis la base de données.'):format(#results or 0))
        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
    end)
end

AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    LoadShopsFromDatabase()
end)

RegisterNetEvent('ys_shopcreator:server:requestSync', function()
    local src = source
    TriggerClientEvent('ys_shopcreator:client:syncShops', src, ShopsTable)
end)

-- Commande Admin pour ouvrir le Panel Creator
local function GetServerInventoryItems()
    local itemsList = {}

    if GetResourceState('ox_inventory') == 'started' then
        local oxItems = exports.ox_inventory:Items()
        if oxItems then
            for name, item in pairs(oxItems) do
                table.insert(itemsList, {
                    name = name,
                    label = item.label or name
                })
            end
        end
    else
        local framework = YS_Bridge.GetFrameworkName()
        if framework == 'esx' then
            local ESX = exports['es_extended']:getSharedObject()
            if ESX and ESX.GetItems then
                local esxItems = ESX.GetItems()
                for name, item in pairs(esxItems) do
                    table.insert(itemsList, {
                        name = name,
                        label = item.label or name
                    })
                end
            end
        elseif framework == 'qbcore' then
            local QBCore = exports['qb-core']:GetCoreObject()
            if QBCore and QBCore.Shared and QBCore.Shared.Items then
                for name, item in pairs(QBCore.Shared.Items) do
                    table.insert(itemsList, {
                        name = name,
                        label = item.label or name
                    })
                end
            end
        end
    end

    table.sort(itemsList, function(a, b) return a.label < b.label end)
    return itemsList
end

RegisterCommand(Config.AdminCommand, function(source, args, rawCommand)
    local src = source
    if src == 0 then
        print('[YS_ShopCreator] La commande doit être exécutée en jeu.')
        return
    end

    if YS_Bridge.IsAdmin(src) then
        local serverItems = GetServerInventoryItems()
        TriggerClientEvent('ys_shopcreator:client:openAdminMenu', src, ShopsTable, serverItems)
    else
        YS_Bridge.Notify(src, _t('no_permission'), 'error')
    end
end, false)

-- Event Admin: Création d'un magasin
RegisterNetEvent('ys_shopcreator:server:createShop', function(data)
    local src = source
    if not YS_Bridge.IsAdmin(src) then return end

    if not data or not data.name or not data.identifier or not data.coords then
        YS_Bridge.Notify(src, _t('invalid_data'), 'error')
        return
    end

    local coordsJson = json.encode(data.coords)
    local blipJson = json.encode(data.blip_data or {})
    local itemsJson = json.encode(data.items or {})
    local restrJson = json.encode(data.restrictions or {})

    local sql = [[
        INSERT INTO ys_shops 
        (identifier, name, coords, npc_enabled, npc_model, blip_data, theme_color, items, restrictions, is_player_owned, buy_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name), coords = VALUES(coords), npc_enabled = VALUES(npc_enabled), npc_model = VALUES(npc_model),
        blip_data = VALUES(blip_data), theme_color = VALUES(theme_color), items = VALUES(items), restrictions = VALUES(restrictions),
        is_player_owned = VALUES(is_player_owned), buy_price = VALUES(buy_price)
    ]]

    MySQL.prepare(sql, {
        data.identifier,
        data.name,
        coordsJson,
        data.npc_enabled and 1 or 0,
        data.npc_model or 'mp_m_shopkeep_01',
        blipJson,
        data.theme_color or '#00f2fe',
        itemsJson,
        restrJson,
        data.is_player_owned and 1 or 0,
        tonumber(data.buy_price) or 0
    }, function(id)
        data.id = id
        ShopsTable[data.identifier] = data
        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        YS_Bridge.Notify(src, _t('shop_created', data.name), 'success')

        -- Webhook Discord
        YS_Webhooks.Send('Create', '🟢 NOUVEAU MAGASIN CRÉÉ', ('Admin : **%s** (ID: %s)\nNom du Shop : **%s**\nID Shop : `%s`\nThème Couleur : `%s`'):format(
            YS_Bridge.GetName(src), src, data.name, data.identifier, data.theme_color
        ))
    end)
end)

-- Event Admin: Modification d'un magasin
RegisterNetEvent('ys_shopcreator:server:updateShop', function(data)
    local src = source
    if not YS_Bridge.IsAdmin(src) then return end

    if not data or not data.identifier then return end

    local existing = ShopsTable[data.identifier]
    if not existing then return end

    local coordsJson = json.encode(data.coords or existing.coords)
    local blipJson = json.encode(data.blip_data or existing.blip_data)
    local itemsJson = json.encode(data.items or existing.items)
    local restrJson = json.encode(data.restrictions or existing.restrictions)

    local sql = [[
        UPDATE ys_shops SET 
        name = ?, coords = ?, npc_enabled = ?, npc_model = ?, blip_data = ?, theme_color = ?, 
        items = ?, restrictions = ?, is_player_owned = ?, buy_price = ?
        WHERE identifier = ?
    ]]

    MySQL.prepare(sql, {
        data.name or existing.name,
        coordsJson,
        data.npc_enabled and 1 or 0,
        data.npc_model or 'mp_m_shopkeep_01',
        blipJson,
        data.theme_color or '#00f2fe',
        itemsJson,
        restrJson,
        data.is_player_owned and 1 or 0,
        tonumber(data.buy_price) or 0,
        data.identifier
    }, function(affected)
        ShopsTable[data.identifier] = data
        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        YS_Bridge.Notify(src, _t('shop_updated', data.name), 'success')

        YS_Webhooks.Send('Update', '🟡 MAGASIN MODIFIÉ', ('Admin : **%s** (ID: %s)\nShop : **%s** (`%s`)'):format(
            YS_Bridge.GetName(src), src, data.name, data.identifier
        ))
    end)
end)

-- Event Admin: Suppression d'un magasin
RegisterNetEvent('ys_shopcreator:server:deleteShop', function(identifier)
    local src = source
    if not YS_Bridge.IsAdmin(src) then return end

    local shop = ShopsTable[identifier]
    if not shop then return end

    MySQL.prepare('DELETE FROM ys_shops WHERE identifier = ?', { identifier }, function(affected)
        ShopsTable[identifier] = nil
        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        YS_Bridge.Notify(src, _t('shop_deleted', shop.name), 'success')

        YS_Webhooks.Send('Delete', '🔴 MAGASIN SUPPRIMÉ', ('Admin : **%s** (ID: %s)\nShop Supprimé : **%s** (`%s`)'):format(
            YS_Bridge.GetName(src), src, shop.name, identifier
        ))
    end)
end)

-- Event Joueur: Achat d'articles dans un magasin
RegisterNetEvent('ys_shopcreator:server:buyItems', function(identifier, cartItems, paymentType)
    local src = source
    local shop = ShopsTable[identifier]
    if not shop then return end

    paymentType = (paymentType == 'bank') and 'bank' or 'cash'

    local totalPrice = 0
    local itemsToGive = {}

    -- Calcul et vérification du panier
    for i = 1, #cartItems do
        local cartItem = cartItems[i]
        local count = tonumber(cartItem.count) or 1
        
        -- Chercher l'item original dans le shop pour valider le prix et le stock
        local origItem = nil
        for j = 1, #shop.items do
            if shop.items[j].name == cartItem.name then
                origItem = shop.items[j]
                break
            end
        end

        if origItem then
            -- Application éventuelle d'une promotion
            local pricePerUnit = tonumber(origItem.price) or 0
            if shop.discount_percent and shop.discount_percent > 0 then
                pricePerUnit = math.floor(pricePerUnit * (1 - (shop.discount_percent / 100)))
            end

            -- Vérification du stock si limité (stock >= 0)
            if origItem.stock and origItem.stock >= 0 then
                if origItem.stock < count then
                    YS_Bridge.Notify(src, _t('not_enough_stock'), 'error')
                    return
                end
            end

            -- Vérification si le joueur peut porter l'item
            if not YS_Inventory.CanCarryItem(src, origItem.name, count) then
                YS_Bridge.Notify(src, _t('inventory_full'), 'error')
                return
            end

            totalPrice = totalPrice + (pricePerUnit * count)
            table.insert(itemsToGive, {
                name = origItem.name,
                label = origItem.label or origItem.name,
                count = count,
                price = pricePerUnit
            })
        end
    end

    if totalPrice <= 0 or #itemsToGive == 0 then return end

    -- Vérification de l'argent du joueur
    local playerMoney = YS_Bridge.GetMoney(src, paymentType)
    if playerMoney < totalPrice then
        YS_Bridge.Notify(src, _t('not_enough_money', paymentType), 'error')
        return
    end

    -- Retrait de l'argent
    if YS_Bridge.RemoveMoney(src, paymentType, totalPrice) then
        -- Don des items au joueur
        for i = 1, #itemsToGive do
            local item = itemsToGive[i]
            YS_Inventory.AddItem(src, item.name, item.count)
        end

        -- Si magasin de joueur, transfert des fonds dans la caisse du shop
        if shop.is_player_owned and shop.owner_identifier then
            shop.vault_balance = (shop.vault_balance or 0) + totalPrice
            MySQL.prepare('UPDATE ys_shops SET vault_balance = ? WHERE identifier = ?', { shop.vault_balance, identifier })
        end

        -- Décrémentation du stock en mémoire et BDD si limité
        local stockChanged = false
        for i = 1, #itemsToGive do
            local itemGiven = itemsToGive[i]
            for j = 1, #shop.items do
                if shop.items[j].name == itemGiven.name and shop.items[j].stock and shop.items[j].stock > 0 then
                    shop.items[j].stock = shop.items[j].stock - itemGiven.count
                    stockChanged = true
                end
            end
        end

        if stockChanged then
            MySQL.prepare('UPDATE ys_shops SET items = ? WHERE identifier = ?', { json.encode(shop.items), identifier })
            TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        end

        YS_Bridge.Notify(src, _t('buy_success', #itemsToGive, shop.name, totalPrice), 'success')

        -- Webhook Discord Achat
        YS_Webhooks.Send('Purchase', '🛍️ ACHAT EFFECTUÉ EN MAGASIN', ('Joueur : **%s** (ID: %s)\nMagasin : **%s**\nMontant Total : **$%s** (%s)\nNombre d\'articles : **%s**'):format(
            YS_Bridge.GetName(src), src, shop.name, totalPrice, paymentType, #itemsToGive
        ))
    end
end)

-- Event Joueur: Achat d'un magasin rachetable (Player-Owned Shop)
RegisterNetEvent('ys_shopcreator:server:buyShop', function(identifier)
    local src = source
    local shop = ShopsTable[identifier]
    if not shop or not shop.is_player_owned or shop.owner_identifier then return end

    local buyPrice = tonumber(shop.buy_price) or 0
    if buyPrice <= 0 then return end

    local playerMoney = YS_Bridge.GetMoney(src, 'bank')
    if playerMoney < buyPrice then
        YS_Bridge.Notify(src, _t('not_enough_money', 'bank'), 'error')
        return
    end

    if YS_Bridge.RemoveMoney(src, 'bank', buyPrice) then
        local playerIdentifier = YS_Bridge.GetIdentifier(src)
        local playerName = YS_Bridge.GetName(src)

        shop.owner_identifier = playerIdentifier
        shop.owner_name = playerName
        shop.vault_balance = 0

        MySQL.prepare('UPDATE ys_shops SET owner_identifier = ?, owner_name = ?, vault_balance = 0 WHERE identifier = ?', {
            playerIdentifier, playerName, identifier
        })

        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        YS_Bridge.Notify(src, _t('shop_bought', shop.name, buyPrice), 'success')

        YS_Webhooks.Send('Owner', '🏢 MAGASIN ACHETÉ PAR UN JOUEUR', ('Nouveau Propriétaire : **%s** (`%s`)\nMagasin : **%s**\nPrix d\'achat : **$%s**'):format(
            playerName, playerIdentifier, shop.name, buyPrice
        ))
    end
end)

-- Event Propriétaire: Retrait de fonds depuis la caisse du magasin
RegisterNetEvent('ys_shopcreator:server:withdrawVault', function(identifier, amount)
    local src = source
    amount = tonumber(amount) or 0
    if amount <= 0 then return end

    local shop = ShopsTable[identifier]
    if not shop or not shop.is_player_owned then return end

    local playerIdentifier = YS_Bridge.GetIdentifier(src)
    if shop.owner_identifier ~= playerIdentifier then return end

    if (shop.vault_balance or 0) < amount then
        YS_Bridge.Notify(src, _t('not_enough_money', 'vault'), 'error')
        return
    end

    shop.vault_balance = shop.vault_balance - amount
    MySQL.prepare('UPDATE ys_shops SET vault_balance = ? WHERE identifier = ?', { shop.vault_balance, identifier })

    YS_Bridge.AddMoney(src, 'bank', amount)
    TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
    YS_Bridge.Notify(src, _t('withdraw_success', amount), 'success')
end)

-- Event Propriétaire: Dépôt de fonds dans la caisse du magasin
RegisterNetEvent('ys_shopcreator:server:depositVault', function(identifier, amount)
    local src = source
    amount = tonumber(amount) or 0
    if amount <= 0 then return end

    local shop = ShopsTable[identifier]
    if not shop or not shop.is_player_owned then return end

    local playerIdentifier = YS_Bridge.GetIdentifier(src)
    if shop.owner_identifier ~= playerIdentifier then return end

    local playerMoney = YS_Bridge.GetMoney(src, 'bank')
    if playerMoney < amount then
        YS_Bridge.Notify(src, _t('not_enough_money', 'bank'), 'error')
        return
    end

    if YS_Bridge.RemoveMoney(src, 'bank', amount) then
        shop.vault_balance = (shop.vault_balance or 0) + amount
        MySQL.prepare('UPDATE ys_shops SET vault_balance = ? WHERE identifier = ?', { shop.vault_balance, identifier })

        TriggerClientEvent('ys_shopcreator:client:syncShops', -1, ShopsTable)
        YS_Bridge.Notify(src, _t('deposit_success', amount), 'success')
    end
end)
