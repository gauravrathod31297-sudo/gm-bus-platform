#!/bin/bash
echo "🚀 Deploying GM Bus Platform..."
sudo cp deployment/nginx.conf /etc/nginx/sites-available/gm-bus
sudo ln -sf /etc/nginx/sites-available/gm-bus /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Nginx configured"
sudo certbot --nginx -d api.bustracker.gauravmedia.in -d admin.bustracker.gauravmedia.in -d app.bustracker.gauravmedia.in --agree-tos --redirect
echo "✅ SSL configured"
