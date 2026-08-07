YS_Inventory = YS_Inventory or {}

local InventoryType = 'default'

function YS_Inventory.InitInventory()
    if Config.Inventory == 'auto' then
        if GetResourceState('ox_inventory') == 'started' then
            InventoryType = 'ox_inventory'
        elseif GetResourceState('qs-inventory') == 'started' then
            InventoryType = 'qs-inventory'
        elseif GetResourceState('codem-inventory') == 'started' then
            InventoryType = 'codem-inventory'
        else
            InventoryType = 'default'
        end
    else
        InventoryType = Config.Inventory
    end
    if Config.Debug then
        print(('[YS_ShopCreator] Inventaire initialisé : %s'):format(InventoryType))
    end
end

YS_Inventory.InitInventory()

function YS_Inventory.GetImagePath()
    if Config.InventoryImagePath and Config.InventoryImagePath ~= '' then
        return Config.InventoryImagePath
    end
    if InventoryType == 'ox_inventory' then
        return 'nui://ox_inventory/web/images/'
    elseif InventoryType == 'qs-inventory' then
        return 'nui://qs-inventory/html/images/'
    elseif InventoryType == 'codem-inventory' then
        return 'nui://codem-inventory/html/images/'
    else
        return 'nui://ox_inventory/web/images/'
    end
end

if IsDuplicityVersion() then

    function YS_Inventory.CanCarryItem(source, itemName, count)
        count = tonumber(count) or 1
        if InventoryType == 'ox_inventory' then
            return exports.ox_inventory:CanCarryItem(source, itemName, count)
        elseif InventoryType == 'qs-inventory' then
            return exports['qs-inventory']:CanCarryItem(source, itemName, count)
        else
            local framework = YS_Bridge.GetFrameworkName()
            if framework == 'esx' then
                local xPlayer = YS_Bridge.GetPlayer(source)
                if xPlayer and xPlayer.canCarryItem then
                    return xPlayer.canCarryItem(itemName, count)
                end
            elseif framework == 'qbcore' then
                return true -- QBCore handles weight checks in AddItem
            end
            return true
        end
    end

    function YS_Inventory.AddItem(source, itemName, count, metadata)
        count = tonumber(count) or 1
        if InventoryType == 'ox_inventory' then
            return exports.ox_inventory:AddItem(source, itemName, count, metadata)
        elseif InventoryType == 'qs-inventory' then
            return exports['qs-inventory']:AddItem(source, itemName, count, nil, metadata)
        elseif InventoryType == 'codem-inventory' then
            return exports['codem-inventory']:AddItem(source, itemName, count, nil, metadata)
        else
            local framework = YS_Bridge.GetFrameworkName()
            local xPlayer = YS_Bridge.GetPlayer(source)
            if not xPlayer then return false end
            if framework == 'esx' then
                xPlayer.addInventoryItem(itemName, count)
                return true
            elseif framework == 'qbcore' then
                return xPlayer.Functions.AddItem(itemName, count, nil, metadata)
            end
        end
        return false
    end

    function YS_Inventory.GetItemCount(source, itemName)
        if InventoryType == 'ox_inventory' then
            return exports.ox_inventory:Search(source, 'count', itemName) or 0
        else
            local framework = YS_Bridge.GetFrameworkName()
            local xPlayer = YS_Bridge.GetPlayer(source)
            if not xPlayer then return 0 end
            if framework == 'esx' then
                local item = xPlayer.getInventoryItem(itemName)
                return item and item.count or 0
            elseif framework == 'qbcore' then
                local item = xPlayer.Functions.GetItemByName(itemName)
                return item and item.amount or 0
            end
        end
        return 0
    end

end
