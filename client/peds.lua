YS_Peds = YS_Peds or {}

local SpawnedPeds = {}

function YS_Peds.SpawnPed(identifier, pedModel, coords)
    if SpawnedPeds[identifier] then
        YS_Peds.RemovePed(identifier)
    end

    if not coords or not coords.x or not coords.y or not coords.z then
        return nil
    end

    local x = tonumber(coords.x)
    local y = tonumber(coords.y)
    local z = tonumber(coords.z)
    local h = tonumber(coords.h) or 0.0

    if not x or not y or not z then return nil end

    local modelName = (pedModel and pedModel ~= '') and pedModel or 'mp_m_shopkeep_01'
    local hash = type(modelName) == 'number' and modelName or GetHashKey(modelName)

    if not IsModelInCdimage(hash) or not IsModelValid(hash) then
        hash = GetHashKey('mp_m_shopkeep_01')
    end

    RequestModel(hash)
    local timeout = 0
    while not HasModelLoaded(hash) and timeout < 50 do
        Wait(50)
        timeout = timeout + 1
    end

    if not HasModelLoaded(hash) then return nil end

    -- Creation du ped a la hauteur Z exacte choisie par l'administrateur
    local ped = CreatePed(4, hash, x, y, z, h, false, true)
    
    SetEntityHeading(ped, h)
    FreezeEntityPosition(ped, true)
    SetEntityInvincible(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    SetPedCanRagdoll(ped, false)
    SetPedCanPlayAmbientAnims(ped, true)

    -- Scenario au comptoir
    TaskStartScenarioInPlace(ped, 'WORLD_HUMAN_STAND_MOBILE', 0, true)

    SetModelAsNoLongerNeeded(hash)

    SpawnedPeds[identifier] = ped
    return ped
end

function YS_Peds.RemovePed(identifier)
    local ped = SpawnedPeds[identifier]
    if ped and DoesEntityExist(ped) then
        DeleteEntity(ped)
    end
    SpawnedPeds[identifier] = nil
end

function YS_Peds.GetPed(identifier)
    return SpawnedPeds[identifier]
end

function YS_Peds.ClearAll()
    for id, ped in pairs(SpawnedPeds) do
        if DoesEntityExist(ped) then
            DeleteEntity(ped)
        end
    end
    SpawnedPeds = {}
end

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    YS_Peds.ClearAll()
end)
