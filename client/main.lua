local Shops = {}
local CurrentShop = nil
local IsAdminMenuOpen = false

-- Synchronisation des magasins depuis le serveur
RegisterNetEvent('ys_shopcreator:client:syncShops', function(serverShops)
    Shops = serverShops or {}
    
    -- Nettoyer les peds existants pour forcer le respawn propre
    YS_Peds.ClearAll()

    -- Mettre à jour les blips
    YS_Blips.ClearAll()
    for identifier, shop in pairs(Shops) do
        if shop.coords then
            YS_Blips.CreateBlip(identifier, shop.blip_data, shop.coords)
        end
    end
end)

-- Initialisation au spawn du joueur
CreateThread(function()
    Wait(1000)
    TriggerServerEvent('ys_shopcreator:server:requestSync')
end)

-- Ouverture du Menu Admin Creator
RegisterNetEvent('ys_shopcreator:client:openAdminMenu', function(serverShops, serverItems)
    Shops = serverShops or Shops
    IsAdminMenuOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openAdmin',
        shops = Shops,
        serverItems = serverItems or {},
        colorPresets = Config.ColorPresets,
        defaultPeds = Config.DefaultPeds
    })
end)

-- Fonction d'ouverture du shop pour le joueur
local function OpenPlayerShop(shopData)
    CurrentShop = shopData
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openShop',
        shop = shopData,
        inventoryImagePath = YS_Inventory.GetImagePath(),
        currency = '$'
    })
end

-- Fonction d'ouverture du menu de gestion du propriétaire
local function OpenOwnerPanel(shopData)
    CurrentShop = shopData
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openOwner',
        shop = shopData
    })
end

-- Boucle de streaming des PNJ et des interactions (Optimisée à 0.00ms)
CreateThread(function()
    while true do
        local sleep = 1000
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)

        for identifier, shop in pairs(Shops) do
            if shop.coords and shop.coords.x and shop.coords.y and shop.coords.z then
                local sx = tonumber(shop.coords.x)
                local sy = tonumber(shop.coords.y)
                local sz = tonumber(shop.coords.z)

                if sx and sy and sz then
                    local shopCoords = vec3(sx, sy, sz)
                    local dist = #(playerCoords - shopCoords)

                    if dist < 50.0 then
                        sleep = 500

                        -- Gestion du Ped (verification flexible de boolean ou integer)
                        local isNpcEnabled = (shop.npc_enabled == true or shop.npc_enabled == 1 or shop.npc_enabled == '1' or shop.npc_enabled == 'true')
                        if isNpcEnabled then
                            local ped = YS_Peds.GetPed(identifier)
                            if not ped then
                                ped = YS_Peds.SpawnPed(identifier, shop.npc_model, shop.coords)
                                if ped then
                                    YS_Target.AddEntityTarget(ped, shop, OpenPlayerShop, OpenOwnerPanel, function(data)
                                        TriggerServerEvent('ys_shopcreator:server:buyShop', data.identifier)
                                    end)
                                end
                            end
                        end

                        -- Mode Interaction Touche [E] / Text3D
                        if YS_Target.GetTargetType() == 'text3d' and dist < Config.InteractDistance then
                            sleep = 0
                            
                            -- Affichage Help Notification
                            AddTextEntry('YSSHOP_PROMPT', _t('press_to_open', shop.name))
                            DisplayHelpTextThisFrame('YSSHOP_PROMPT', false)

                            if IsControlJustReleased(0, Config.InteractKey) then
                                OpenPlayerShop(shop)
                            end
                        end
                    else
                        -- Nettoyage du ped hors de portée
                        if shop.npc_enabled and YS_Peds.GetPed(identifier) then
                            YS_Peds.RemovePed(identifier)
                        end
                    end
                end
            end
        end

        Wait(sleep)
    end
end)

-- Callbacks NUI
RegisterNUICallback('closeUI', function(data, cb)
    SetNuiFocus(false, false)
    IsAdminMenuOpen = false
    CurrentShop = nil
    cb('ok')
end)

RegisterNUICallback('getCoords', function(data, cb)
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local heading = GetEntityHeading(playerPed)

    cb({
        x = math.floor(coords.x * 100) / 100,
        y = math.floor(coords.y * 100) / 100,
        z = math.floor(coords.z * 100) / 100,
        h = math.floor(heading * 100) / 100
    })
end)

RegisterNUICallback('createShop', function(data, cb)
    TriggerServerEvent('ys_shopcreator:server:createShop', data)
    cb('ok')
end)

RegisterNUICallback('updateShop', function(data, cb)
    TriggerServerEvent('ys_shopcreator:server:updateShop', data)
    cb('ok')
end)

RegisterNUICallback('deleteShop', function(identifier, cb)
    TriggerServerEvent('ys_shopcreator:server:deleteShop', identifier)
    cb('ok')
end)

RegisterNUICallback('buyItems', function(data, cb)
    if not data or not data.identifier or not data.items then
        cb('error')
        return
    end
    TriggerServerEvent('ys_shopcreator:server:buyItems', data.identifier, data.items, data.paymentType)
    cb('ok')
end)

RegisterNUICallback('teleportToShop', function(identifier, cb)
    local shop = Shops[identifier]
    if shop and shop.coords then
        local playerPed = PlayerPedId()
        SetEntityCoords(playerPed, shop.coords.x, shop.coords.y, shop.coords.z)
        if shop.coords.h then
            SetEntityHeading(playerPed, shop.coords.h)
        end
        YS_Bridge.Notify(_t('teleported_to_shop', shop.name), 'info')
    end
    cb('ok')
end)

RegisterNUICallback('buyShop', function(identifier, cb)
    TriggerServerEvent('ys_shopcreator:server:buyShop', identifier)
    cb('ok')
end)

RegisterNUICallback('depositVault', function(data, cb)
    TriggerServerEvent('ys_shopcreator:server:depositVault', data.identifier, data.amount)
    cb('ok')
end)

RegisterNUICallback('withdrawVault', function(data, cb)
    TriggerServerEvent('ys_shopcreator:server:withdrawVault', data.identifier, data.amount)
    cb('ok')
end)
