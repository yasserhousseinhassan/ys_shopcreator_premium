YS_Target = YS_Target or {}

local TargetType = 'text3d'

function YS_Target.InitTarget()
    if Config.Target == 'auto' then
        if GetResourceState('ox_target') == 'started' then
            TargetType = 'ox_target'
        elseif GetResourceState('qb-target') == 'started' then
            TargetType = 'qb-target'
        elseif GetResourceState('qtarget') == 'started' then
            TargetType = 'qtarget'
        else
            TargetType = 'text3d'
        end
    else
        TargetType = Config.Target
    end
    if Config.Debug then
        print(('[YS_ShopCreator] Target initialisé : %s'):format(TargetType))
    end
end

YS_Target.InitTarget()

function YS_Target.GetTargetType()
    return TargetType
end

if not IsDuplicityVersion() then

    -- Ajouter une option Target sur un PNJ ou une coordonnée
    function YS_Target.AddEntityTarget(entity, shopData, onOpenShop, onManageShop, onBuyShop)
        local options = {}

        -- Option 1: Ouvrir le Magasin
        table.insert(options, {
            name = 'ys_shop_open_' .. shopData.identifier,
            icon = 'fas fa-shopping-basket',
            label = _t('target_open_shop'),
            onSelect = function()
                onOpenShop(shopData)
            end,
            action = function()
                onOpenShop(shopData)
            end
        })

        -- Option 2: Si Magasin Joueur rachetable et pas encore de proprio
        if shopData.is_player_owned and not shopData.owner_identifier then
            table.insert(options, {
                name = 'ys_shop_buy_' .. shopData.identifier,
                icon = 'fas fa-store',
                label = _t('target_buy_shop', shopData.buy_price or 0),
                onSelect = function()
                    onBuyShop(shopData)
                end,
                action = function()
                    onBuyShop(shopData)
                end
            })
        end

        -- Option 3: Si le joueur actuel est le proprio du magasin
        if shopData.is_player_owned and shopData.isOwner then
            table.insert(options, {
                name = 'ys_shop_manage_' .. shopData.identifier,
                icon = 'fas fa-cog',
                label = _t('target_manage_shop'),
                onSelect = function()
                    onManageShop(shopData)
                end,
                action = function()
                    onManageShop(shopData)
                end
            })
        end

        if TargetType == 'ox_target' then
            exports.ox_target:addLocalEntity(entity, options)
        elseif TargetType == 'qb-target' then
            exports['qb-target']:AddTargetEntity(entity, {
                options = options,
                distance = 2.5
            })
        elseif TargetType == 'qtarget' then
            exports.qtarget:AddTargetEntity(entity, {
                options = options,
                distance = 2.5
            })
        end
    end

    function YS_Target.RemoveEntityTarget(entity)
        if TargetType == 'ox_target' then
            exports.ox_target:removeLocalEntity(entity)
        elseif TargetType == 'qb-target' then
            exports['qb-target']:RemoveTargetEntity(entity)
        elseif TargetType == 'qtarget' then
            exports.qtarget:RemoveTargetEntity(entity)
        end
    end

end
