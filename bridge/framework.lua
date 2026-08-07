YS_Bridge = YS_Bridge or {}

local FrameworkName = nil
local ESX = nil
local QBCore = nil

-- Helper d'affichage de traduction
function _t(key, ...)
    local lang = Config.Locale or 'fr'
    local dict = Locales[lang] or Locales['fr']
    local str = dict[key] or key
    if select('#', ...) > 0 then
        return string.format(str, ...)
    end
    return str
end

-- Detection Framework
function YS_Bridge.InitFramework()
    if Config.Framework == 'auto' then
        if GetResourceState('es_extended') == 'started' then
            FrameworkName = 'esx'
            ESX = exports['es_extended']:getSharedObject()
        elseif GetResourceState('qb-core') == 'started' then
            FrameworkName = 'qbcore'
            QBCore = exports['qb-core']:GetCoreObject()
        else
            FrameworkName = 'esx'
            ESX = exports['es_extended']:getSharedObject()
        end
    elseif Config.Framework == 'qbcore' then
        FrameworkName = 'qbcore'
        QBCore = exports['qb-core']:GetCoreObject()
    else
        FrameworkName = 'esx'
        ESX = exports['es_extended']:getSharedObject()
    end
    
    if Config.Debug then
        print(('[YS_ShopCreator] Framework initialisé : %s'):format(FrameworkName))
    end
end

YS_Bridge.InitFramework()

function YS_Bridge.GetFrameworkName()
    return FrameworkName
end

-- Methodes Joueur Serveur
if IsDuplicityVersion() then

    function YS_Bridge.GetPlayer(source)
        if FrameworkName == 'esx' then
            return ESX.GetPlayerFromId(source)
        elseif FrameworkName == 'qbcore' then
            return QBCore.Functions.GetPlayer(source)
        end
    end

    function YS_Bridge.GetIdentifier(source)
        local xPlayer = YS_Bridge.GetPlayer(source)
        if not xPlayer then return nil end
        if FrameworkName == 'esx' then
            return xPlayer.identifier
        elseif FrameworkName == 'qbcore' then
            return xPlayer.PlayerData.citizenid
        end
    end

    function YS_Bridge.GetName(source)
        local xPlayer = YS_Bridge.GetPlayer(source)
        if not xPlayer then return GetPlayerName(source) end
        if FrameworkName == 'esx' then
            return xPlayer.getName()
        elseif FrameworkName == 'qbcore' then
            return xPlayer.PlayerData.charinfo.firstname .. ' ' .. xPlayer.PlayerData.charinfo.lastname
        end
    end

    function YS_Bridge.GetMoney(source, accountType)
        local xPlayer = YS_Bridge.GetPlayer(source)
        if not xPlayer then return 0 end
        if FrameworkName == 'esx' then
            local acc = accountType == 'bank' and 'bank' or 'money'
            local account = xPlayer.getAccount(acc)
            return account and account.money or 0
        elseif FrameworkName == 'qbcore' then
            local acc = accountType == 'bank' and 'bank' or 'cash'
            return xPlayer.PlayerData.money[acc] or 0
        end
    end

    function YS_Bridge.RemoveMoney(source, accountType, amount)
        local xPlayer = YS_Bridge.GetPlayer(source)
        if not xPlayer then return false end
        if FrameworkName == 'esx' then
            local acc = accountType == 'bank' and 'bank' or 'money'
            if xPlayer.getAccount(acc).money >= amount then
                xPlayer.removeAccountMoney(acc, amount)
                return true
            end
        elseif FrameworkName == 'qbcore' then
            local acc = accountType == 'bank' and 'bank' or 'cash'
            if xPlayer.PlayerData.money[acc] >= amount then
                xPlayer.Functions.RemoveMoney(acc, amount)
                return true
            end
        end
        return false
    end

    function YS_Bridge.AddMoney(source, accountType, amount)
        local xPlayer = YS_Bridge.GetPlayer(source)
        if not xPlayer then return end
        if FrameworkName == 'esx' then
            local acc = accountType == 'bank' and 'bank' or 'money'
            xPlayer.addAccountMoney(acc, amount)
        elseif FrameworkName == 'qbcore' then
            local acc = accountType == 'bank' and 'bank' or 'cash'
            xPlayer.Functions.AddMoney(acc, amount)
        end
    end

    function YS_Bridge.IsAdmin(source)
        if FrameworkName == 'esx' then
            local xPlayer = ESX.GetPlayerFromId(source)
            if not xPlayer then return false end
            local group = xPlayer.getGroup()
            return Config.AdminGroups[group] == true or IsPlayerAceAllowed(source, 'command')
        elseif FrameworkName == 'qbcore' then
            return QBCore.Functions.HasPermission(source, 'admin') or IsPlayerAceAllowed(source, 'command')
        end
        return false
    end

    function YS_Bridge.Notify(source, msg, type)
        type = type or 'info'
        if FrameworkName == 'esx' then
            TriggerClientEvent('esx:showNotification', source, msg)
        elseif FrameworkName == 'qbcore' then
            TriggerClientEvent('QBCore:Notify', source, msg, type)
        end
    end

else
    -- Client side notification
    function YS_Bridge.Notify(msg, type)
        type = type or 'info'
        if FrameworkName == 'esx' then
            ESX.ShowNotification(msg)
        elseif FrameworkName == 'qbcore' then
            QBCore.Functions.Notify(msg, type)
        end
    end
end
