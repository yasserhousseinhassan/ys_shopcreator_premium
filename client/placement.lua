YS_Placement = YS_Placement or {}

local isPlacingPed = false
local ghostPed = nil
local currentCoords = vector3(0, 0, 0)
local currentHeading = 0.0

local function DisplayPlacementHelpText()
    BeginTextCommandDisplayHelp('THREEDS_HELP')
    AddTextComponentSubstringPlayerName(
        "~g~[ENTRÉE]~s~ Valider ~r~[ECHAP]~s~ Annuler\n" ..
        "~b~[W/A/S/D]~s~ Déplacer ~y~[Q/E]~s~ Tourner"
    )
    EndTextCommandDisplayHelp(0, false, true, -1)
end

function YS_Placement.Start(modelName, initialCoords, callback)
    if isPlacingPed then return end
    isPlacingPed = true

    -- Fermer temporairement le NUI
    SetNuiFocus(false, false)

    local playerPed = PlayerPedId()
    local pCoords = GetEntityCoords(playerPed)
    local pHeading = GetEntityHeading(playerPed)

    -- Coordonnées initiales (devant le joueur si non définies)
    if initialCoords and initialCoords.x and tonumber(initialCoords.x) ~= 0 then
        currentCoords = vector3(tonumber(initialCoords.x), tonumber(initialCoords.y), tonumber(initialCoords.z))
        currentHeading = tonumber(initialCoords.h) or pHeading
    else
        local forward = GetEntityForwardVector(playerPed)
        currentCoords = pCoords + (forward * 2.0)
        currentHeading = (pHeading + 180.0) % 360.0
    end

    -- Charger le modèle du PNJ fantôme
    modelName = modelName or 'mp_m_shopkeep_01'
    local modelHash = GetHashKey(modelName)
    if not IsModelInCdimage(modelHash) then
        modelHash = GetHashKey('mp_m_shopkeep_01')
    end

    RequestModel(modelHash)
    local timeout = 0
    while not HasModelLoaded(modelHash) and timeout < 100 do
        Wait(50)
        timeout = timeout + 1
    end

    -- Création du Ped fantôme local
    ghostPed = CreatePed(4, modelHash, currentCoords.x, currentCoords.y, currentCoords.z, currentHeading, false, false)
    SetEntityAlpha(ghostPed, 200, false)
    SetEntityCollision(ghostPed, false, false)
    SetEntityInvincible(ghostPed, true)
    FreezeEntityPosition(ghostPed, true)
    SetBlockingOfNonTemporaryEvents(ghostPed, true)

    -- Animation d'attente vendeur
    RequestAnimDict('mini@strip_club@idles@bouncer@base')
    while not HasAnimDictLoaded('mini@strip_club@idles@bouncer@base') do
        Wait(10)
    end
    TaskPlayAnim(ghostPed, 'mini@strip_club@idles@bouncer@base', 'base', 8.0, -8.0, -1, 1, 0, false, false, false)

    -- Boucle interactive 3D en temps réel
    CreateThread(function()
        local moveSpeed = 0.04

        while isPlacingPed do
            Wait(0)

            DisplayPlacementHelpText()

            -- Bloquer les tirs et les actions conflictuelles du joueur
            DisableControlAction(0, 24, true) -- Attaque
            DisableControlAction(0, 25, true) -- Viser
            DisableControlAction(0, 140, true) -- Melee
            DisableControlAction(0, 141, true)
            DisableControlAction(0, 142, true)

            local dx, dy = 0.0, 0.0

            -- Contrôles Déplacement WASD / Flèches
            if IsControlPressed(0, 32) or IsControlPressed(0, 172) then -- W / Flèche Haut
                dy = dy + moveSpeed
            end
            if IsControlPressed(0, 33) or IsControlPressed(0, 173) then -- S / Flèche Bas
                dy = dy - moveSpeed
            end
            if IsControlPressed(0, 34) or IsControlPressed(0, 174) then -- A / Flèche Gauche
                dx = dx - moveSpeed
            end
            if IsControlPressed(0, 35) or IsControlPressed(0, 175) then -- D / Flèche Droite
                dx = dx + moveSpeed
            end

            -- Application du déplacement relatif au Ped
            if dx ~= 0.0 or dy ~= 0.0 then
                local camHeading = GetGameplayCamRot(2).z
                local rad = math.rad(camHeading)
                local nx = currentCoords.x + (dx * math.cos(rad) - dy * math.sin(rad))
                local ny = currentCoords.y + (dx * math.sin(rad) + dy * math.cos(rad))

                local foundGround, groundZ = GetGroundZFor_3dCoord(nx, ny, currentCoords.z + 1.0, false)
                local nz = foundGround and groundZ or currentCoords.z

                currentCoords = vector3(nx, ny, nz)
                SetEntityCoords(ghostPed, currentCoords.x, currentCoords.y, currentCoords.z, false, false, false, false)
            end

            -- Rotation Q / E (Heading)
            if IsControlPressed(0, 44) or IsControlPressed(0, 52) then -- Q / Molette bas
                currentHeading = (currentHeading + 2.0) % 360.0
                SetEntityHeading(ghostPed, currentHeading)
            end
            if IsControlPressed(0, 38) or IsControlPressed(0, 51) then -- E / Molette haut
                currentHeading = (currentHeading - 2.0) % 360.0
                SetEntityHeading(ghostPed, currentHeading)
            end

            -- Valider avec [ENTRÉE] (Control 18 ou 201)
            if IsControlJustReleased(0, 18) or IsControlJustReleased(0, 201) then
                isPlacingPed = false
                if DoesEntityExist(ghostPed) then
                    DeleteEntity(ghostPed)
                    ghostPed = nil
                end

                PlaySoundFrontend(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET", true)

                if callback then
                    callback({
                        x = math.floor(currentCoords.x * 100) / 100,
                        y = math.floor(currentCoords.y * 100) / 100,
                        z = math.floor(currentCoords.z * 100) / 100,
                        h = math.floor(currentHeading * 100) / 100
                    })
                end
                break
            end

            -- Annuler avec [ECHAP] ou [BACKSPACE] (Control 177 / 200)
            if IsControlJustReleased(0, 177) or IsControlJustReleased(0, 200) then
                isPlacingPed = false
                if DoesEntityExist(ghostPed) then
                    DeleteEntity(ghostPed)
                    ghostPed = nil
                end

                PlaySoundFrontend(-1, "CANCEL", "HUD_FRONTEND_DEFAULT_SOUNDSET", true)

                if callback then
                    callback(nil)
                end
                break
            end
        end
    end)
end
