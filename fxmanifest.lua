fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'YS Development'
description 'YS Shop Creator Premium - Multi-Framework & Multi-Inventory Shop Creator System'
version '1.0.0'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/style.css',
    'html/js/app.js',
    'html/js/admin.js',
    'html/js/shop.js',
    'html/js/owner.js'
}

shared_scripts {
    'config.lua',
    'locales/fr.lua',
    'locales/en.lua',
    'locales/es.lua',
    'bridge/framework.lua',
    'bridge/inventory.lua',
    'bridge/target.lua'
}

client_scripts {
    'client/placement.lua',
    'client/peds.lua',
    'client/blips.lua',
    'client/main.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/webhooks.lua',
    'server/main.lua'
}

escrow_ignore {
    'config.lua',
    'locales/*.lua',
    'sql/*.sql'
}
