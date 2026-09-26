# GM Bus Tracking Platform — Documentation

**Version:** 1.0.0 | **Date:** Sept 2026
**Domain:** bustracker.gauravmedia.in | **IP:** 103.216.236.194
**Path:** /data/movies/Project/GM BUS STABLE

---

## 1. Overview

Multi-tenant SaaS for bus fleet management with real-time GPS tracking and multilingual voice announcements.

- Multi-tenant (separate DB per client)
- 4 languages: English, Marathi, Gujarati, Hindi
- Real-time GPS tracking
- Automated TTS announcements
- Admin + Client + Driver + Passenger apps

### URLs
- Backend: https://api.bustracker.gauravmedia.in
- Client:  https://app.bustracker.gauravmedia.in
- Admin:   https://admin.bustracker.gauravmedia.in
- Local:   5000 (backend), 5173 (admin), 5174 (client)

---

## 2. Architecture

Admin Panel → Backend (Node.js + PostgreSQL) → Client Dashboard + Driver App
                          ↓
                    ESP32 GPS Tracker

---

## 3. Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT, google-tts-api, PM2
- **Frontend:** React 18 + TypeScript, Vite, Fluent UI, Leaflet, Recharts
- **Mobile:** Flutter 3.x
- **Infra:** Nginx Proxy Manager, Let's Encrypt, Cloudflare

---

## 4. Implemented Features

**Admin Panel:** Login, Client List, Add Client (auto DB), Language Set, Toggle Active, Delete, Subscriptions, Analytics

**Client Dashboard:** KPIs, Live Map, Activity, Chart, Buses/Routes/Stops CRUD, Voice Settings, Drivers, Trip History, CSV Export, Dark Mode, 4-language UI, Toast, Search

**Voice:** Google TTS (4 langs), Rules (GU→GU+HI+EN), Cache 24h, Preview Player

---

## 5. Roadmap

- **Critical:** WebSocket, Driver App, Auto announcement, Geofencing
- **High:** Email/SMS/Push, WhatsApp, PDF/Excel, Roles, 2FA
- **Medium:** Maintenance log, Document alerts, Fuel tracking, Passenger app
- **Low:** Multi-branch, White-label, Public API, Payment, GST

---

## 6. Database

- **Master (gm_master):** clients
- **Tenant (per client):** buses, routes, stops, live_locations, trips, settings

---

## 7. API Endpoints

- **Admin:** /api/admin/login, /clients, /stats, /api/billing/*
- **Client:** /api/auth/login, /api/bus, /api/route, /api/tracking/*, /api/trips

---

## 8. Hardware — ESP32 Tracker

**BOM (~Rs 1020-1550):**
- ESP32 Dev Board: 340-450
- NEO-6M GPS: 230-350
- SIM800L GSM: 250-400
- LM2596 Buck: 100-150
- Wires/Case: 100-200

**Wiring:**
- ESP32 ↔ GPS: GPIO16(RX2)→TX, GPIO17(TX2)→RX, 3.3V, GND
- ESP32 ↔ SIM800L: GPIO4→TX, GPIO2→RX, 5V, GND

**AIS-140:** Commercial साठी certified VLTD अनिवार्य.

---

## 9. Deployment

- **PM2:** 3 apps (backend 5000, client 5174, admin 5173)
- **Commands:** pm2 list / logs / restart all / monit / save
- **NPM Setup:** DNS 3 A records + 3 proxy hosts with SSL
- **Backup:** scripts/backup.sh (daily, 7-day retention)

---

## 10. Operations

**Credentials:**
- Admin:  admin@gmbus.com / Admin@123
- Client: gaurav@test.com / Gaurav@123

**Troubleshoot:**
- Login fail → check backend/.env
- Port in use → pkill -f "vite --port XXXX"
- PM2 down → pm2 resurrect

---

## 11. Statistics

- Features Done: 60+
- Features Planned: 70+
- Languages: 4
- API Endpoints: 30+
- DB Tables: 8
- PM2 Services: 3

---

## Contact

- Repo: github.com/gauravrathod31297-sudo/gm-bus-platform
- Dev: Gaurav Rathod
- Email: gauravrathod31297@gmail.com

© 2026 GM Media
