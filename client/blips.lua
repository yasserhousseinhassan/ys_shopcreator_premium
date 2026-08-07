YS_Blips = YS_Blips or {}

local CreatedBlips = {}

function YS_Blips.CreateBlip(identifier, blipData, coords)
    if CreatedBlips[identifier] then
        YS_Blips.RemoveBlip(identifier)
    end

    if not blipData or not blipData.enabled then return end

    local blip = AddBlipForCoord(coords.x, coords.y, coords.z)
    SetBlipSprite(blip, tonumber(blipData.sprite) or 52)
    SetBlipDisplay(blip, 4)
    SetBlipScale(blip, tonumber(blipData.scale) or 0.8)
    SetBlipColor(blip, tonumber(blipData.color) or 2)
    SetBlipAsShortRange(blip, true)

    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(blipData.name or 'Magasin')
    EndTextCommandSetBlipName(blip)

    CreatedBlips[identifier] = blip
end

function YS_Blips.RemoveBlip(identifier)
    local blip = CreatedBlips[identifier]
    if blip and DoesBlipExist(blip) then
        RemoveBlip(blip)
    end
    CreatedBlips[identifier] = nil
end

function YS_Blips.ClearAll()
    for id, blip in pairs(CreatedBlips) do
        if DoesBlipExist(blip) then
            RemoveBlip(blip)
        end
    end
    CreatedBlips = {}
end

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    YS_Blips.ClearAll()
end)
