Config = {}

-- =================================================================
-- 🌐 CONFIGURATION GÉNÉRALE
-- =================================================================
Config.Locale = 'en' -- 'en' (default), 'fr', 'es', 'ar', 'so'
Config.Debug = false

-- Auto-détection du framework ('auto', 'esx', 'qbcore')
Config.Framework = 'auto'

-- Auto-détection de l'inventaire ('auto', 'ox_inventory', 'qs-inventory', 'codem-inventory', 'default')
Config.Inventory = 'auto'
-- Chemin d'images d'inventaire ('auto' / laisser vide '' pour détection automatique : nui://ox_inventory/web/images/)
Config.InventoryImagePath = ''

-- Auto-détection du target ('auto', 'ox_target', 'qb-target', 'qtarget', 'text3d')
Config.Target = 'auto'

-- Commande d'accès au Creator Panel Admin
Config.AdminCommand = 'shopcreator'
Config.AdminGroups = {
    ['admin'] = true,
    ['superadmin'] = true,
    ['god'] = true,
    ['_dev'] = true
}

-- Touche d'interaction pour le mode Text3D / HelpNotification
Config.InteractKey = 38 -- 38 = Touche [E]
Config.InteractDistance = 2.5 -- Distance d'interaction en mètres

-- =================================================================
-- 🎨 PALETTES DE COULEURS & DÉFAUTS NUI
-- =================================================================
Config.DefaultThemeColor = '#00f2fe' -- Cyan néon par défaut

Config.ColorPresets = {
    { label = 'Cyan Néon', hex = '#00f2fe' },
    { label = 'Émeraude Green', hex = '#10b981' },
    { label = 'Cyber Violet', hex = '#a855f7' },
    { label = 'Or Rose / Luxury', hex = '#fbbf24' },
    { label = 'Ruby Rouge', hex = '#ef4444' },
    { label = 'Bleu Royal', hex = '#3b82f6' },
    { label = 'Sunset Orange', hex = '#f97316' },
    { label = 'Titanium Dark', hex = '#64748b' }
}

-- =================================================================
-- 🕴️ LISTE DES PEDS / NPC PRÉCONFIGURÉS
-- =================================================================
Config.DefaultPeds = {
    { label = 'Épicier Classique', model = 'mp_m_shopkeep_01' },
    { label = 'Armurier Pro', model = 's_m_y_ammucity_01' },
    { label = 'Homme d\'affaires', model = 'a_m_y_business_01' },
    { label = 'Pharmaciene / Doc', model = 's_f_y_scrubs_01' },
    { label = 'Vendeur Hardware', model = 'a_m_m_salton_01' },
    { label = 'Femme Chic', model = 'a_f_y_business_01' },
    { label = 'Mécano', model = 'mp_m_waremech_01' }
}

-- =================================================================
-- 📢 DISCORD WEBHOOKS
-- =================================================================
Config.Webhooks = {
    Enabled = true,
    URL = 'YOUR_DISCORD_WEBHOOK_HERE', -- Remplacez par votre URL de webhook Discord
    BotName = 'YS Shop Creator Log',
    AvatarURL = 'https://i.imgur.com/vH1W17i.png',
    
    -- Couleurs des embeds (Décimales)
    Colors = {
        Create = 65280,   -- Vert
        Update = 16776960, -- Jaune
        Delete = 16711680, -- Rouge
        Purchase = 65535,  -- Cyan
        Owner = 10181046   -- Violet
    }
}

-- =================================================================
-- 🛍️ OPTIONS DES MAGASINS DE JOUEURS (Player-Owned Shops)
-- =================================================================
Config.PlayerOwnedShops = {
    Enabled = true,
    TaxRate = 0.05, -- 5% de taxe sur la vente du magasin à la ville
    MinPriceMultiplier = 0.5, -- Prix minimum réglable par le proprio (50% du prix de base)
    MaxPriceMultiplier = 3.0 -- Prix maximum réglable par le proprio (300% du prix de base)
}
