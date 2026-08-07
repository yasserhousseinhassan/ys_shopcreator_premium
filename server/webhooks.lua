YS_Webhooks = YS_Webhooks or {}

function YS_Webhooks.Send(logType, title, description, fields)
    if not Config.Webhooks.Enabled or not Config.Webhooks.URL or Config.Webhooks.URL == 'YOUR_DISCORD_WEBHOOK_HERE' then
        return
    end

    local color = Config.Webhooks.Colors[logType] or 65535

    local embedData = {
        {
            ["title"] = title,
            ["description"] = description,
            ["color"] = color,
            ["fields"] = fields or {},
            ["footer"] = {
                ["text"] = "YS Shop Creator Premium • " .. os.date("%d/%m/%Y %H:%M:%S")
            }
        }
    }

    local payload = json.encode({
        username = Config.Webhooks.BotName,
        avatar_url = Config.Webhooks.AvatarURL,
        embeds = embedData
    })

    PerformHttpRequest(Config.Webhooks.URL, function(err, text, headers) end, 'POST', payload, { ['Content-Type'] = 'application/json' })
end
