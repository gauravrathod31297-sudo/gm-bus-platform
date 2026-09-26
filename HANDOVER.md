# 🚌 GM BUS TRACKING — HANDOVER

Server: 192.168.30.125 | Root: /data/movies/Project/GM BUS STABLE/
PM2: gm-backend(0), gm-client(4), gm-admin(5)

## STRUCTURE
- backend/ — Node+Express+PostgreSQL (5000). Routes: admin.js, authOtp.js, bus.js, driver.js, route.js, stops.js, users.js, tracking.js, trips.js, smtp.js, tts.js, signup.js. Config: database.js, tenantDb.js. Middleware: auth.js, tenant.js.
- admin-dashboard/ — React+Vite+Fluent (8091). Components: DataTable/, Form/, Layout.tsx, Breadcrumbs, EmptyState, Skeletons, KpiCard. Hooks: useForm.ts, useDebounce.ts. Pages: Login, Dashboard, Analytics, Clients, ClientDetail, Subscriptions, SignupRequests, Deployment, Notifications, Settings, Admins, Profile.
- client-dashboard/ — React (8081). Pages: OTPLogin, Layout, Buses, Drivers, Routes, Stops.
- bus-device-app/ — Flutter GPS (stub)
- driver-app/ — Flutter (stub)

## ROLES
Super Admin (GM) — 8091 — OTP email
Client Admin — 8081 — OTP+password
Client — tenant DB only
Bus Device — QR pairing

## DATABASES
Master: clients (id, company_name, owner_name, email, phone, city, db_name, status, license_type, license_expires_at, max_buses, max_drivers, max_users, is_active, approved_at, password_hash), admin_users, signup_requests
Tenant: buses (id, bus_number, driver_name, driver_phone, route_id, capacity), drivers, routes, stops, users, trips, tracking

## API
POST /api/auth-otp/send {email,password}
POST /api/auth-otp/verify {email,otp} -> {token,user}
findUser = ADMIN FIRST, client fallback (IMPORTANT)
GET/PUT /api/admin/clients[/:id]
POST /api/admin/clients/:id/reset-password
GET/PUT/POST /api/admin/clients/:id/smtp[/test]
GET/POST /api/admin/clients/:id/buses (NEW, tenant DB)
DELETE /api/admin/clients/:id/buses/:busId (NEW)
GET /api/admin/signup-requests?status= | /:id/approve | /:id/reject
Tenant: /api/bus /api/drivers /api/route /api/stops /api/users /api/tracking /api/trips

## KEY LOGIC
pairing_token = HMAC-SHA256(bus_number, JWT_SECRET).slice(0,10).toUpperCase()
pairing_url = gm-bus://pair?bus_id=X&bus_number=Y&token=Z
tenantForClient: query db_name -> getTenantDb(dbName), null/missing check + clearTenantCache on error

## TEST DATA
Admin: gauravrathod.31297@gmail.com (OTP only, 8091)
Client: gauravrathod.31297@gmail.com / GMCA107264X
client_id: 13 | tenant DB: client_1790157055610_6345
Some clients have db_name=NULL (pending) — Deployment dropdown filters them

## DONE
Backend: OTP admin-first, multi-tenant+cache, all routes, /api/admin/clients/:id/buses, tenantForClient hardened
Admin UI: Login fixed, all pages, Deployment page (buses+QR+pairing), dropdown filters valid clients
Reusable: DataTable (sort/paginate/select/bulk/onRowClick), useForm (baseline/isDirty/validate), FormField/FormSection/SaveBar, useDebounce
Refactored: Clients+bulk, Subscriptions+onRowClick, ClientDetail+useForm, owner_name bug fixed

## TODO
Sprint 2: ✅ DONE (commit 6f6b49e + 0dd6e63)
Sprint 3: ✅ DONE (commit 4175c58) — device pairing + socket.io live tracking
Sprint 4: Flutter app build + APK distribution, socket polyline trail, TTS stops (4 lang), bulk actions, command palette
Sprint 5: Admin Users CRUD, Reports, Billing, Audit log

## SPRINT 3 — SPRINT 3 DEVICE PAIRING + LIVE TRACKING (commit 4175c58)
Backend:
- devices table (all approved tenants): id, bus_id, device_uuid UNIQUE, platform, app_version, last_seen_at, created_at, revoked_at
- POST /api/bus/pair {client_id, bus_number, pairing_token, device_uuid, platform, app_version}
  → returns {device_token (365d JWT role:device), bus_id, bus_number, client_id, device_id}
  Idempotent on device_uuid. Wrong token → 401. HMAC pairingToken formula matches admin.js exactly.
- socketService.js: driver:join verifies device_token JWT, checks client approved + device revoked, binds identity to socket (socket.clientId/busId/deviceId)
  driver:location ignores payload identity, uses socket identity
  Emits BOTH bus:update + bus:location (LiveMap uses bus:update)

Admin dashboard:
- Deployment.tsx pairing_url now includes client_id: gm-bus://pair?client_id=X&bus_id=Y&bus_number=Z&token=T

Bus device app (Flutter — build locally, not on server):
- pubspec: device_info_plus ^11.0.0 added
- auth_service.dart: pair({clientId, busNumber, pairingToken}) via /api/bus/pair with device UUID from device_info_plus, stores device_token
- socket_service.dart: connect(url, deviceToken), sendLocation(lat,lng,speed,heading), sendSOS(lat,lng,msg)
- login_screen.dart: QR URL paste किंवा manual (client_id, bus_number, token)
- dashboard_screen.dart: device_token auth + socket identity
- main.dart: bootstrap — paired ? dashboard : login

## TEST SCRIPT (Sprint 3)
cd backend
TOKEN=$(node -e 'require("dotenv").config();const c=require("crypto");process.stdout.write(c.createHmac("sha256",process.env.JWT_SECRET||"gm-dev-secret").update("MH12AB1234").digest("hex").slice(0,10).toUpperCase())')
curl -s -X POST http://localhost:5000/api/bus/pair -H "Content-Type: application/json" \
  -d "{\"client_id\":13,\"bus_number\":\"MH12AB1234\",\"pairing_token\":\"$TOKEN\",\"device_uuid\":\"test-device-001\",\"platform\":\"android\"}"

Socket E2E test: backend/sock_test.cjs (delete after)
Expected: 👀 viewer ready → ✅ driver joined → 📡 bus:update RECEIVED

## KEY LEARNINGS (Sprint 3)
13. /tmp/ मध्ये node_modules नाही — test files backend/ मध्येच .cjs extension ने ठेवा
14. client-dashboard package.json मध्ये "type":"module" — तिथे require() fail होतो
15. admin dashboard build: pm2 stop gm-admin && rm -rf dist && npm run build && pm2 start gm-admin
16. vite preview boot होण्यासाठी 2-3 sec लागतो — पहिला curl 502 देऊ शकतो
17. server.js मध्ये /api/bus pair router busRoutes च्या आधी mount करा (auth bypass साठी)

## LEARNINGS
1. Griffel errors (Gap<...>) = normal, vite build not blocked
2. PM2 = vite preview (not dev)
3. Build: pm2 stop gm-admin && rm -rf dist && npm run build && pm2 start gm-admin
4. ENOTEMPTY = pm2 holds dist -> pm2 stop first
5. Fluent icons: ShieldRegular, PhoneRegular (NOT PhoneMobileRegular)
6. bcryptjs (not bcrypt)
7. Python file-write for JSX (bash heredoc fails on JSX)
8. QR = react-qr-code (frontend only)
9. findUser = ADMIN first
10. tenant middleware needs req.user.client_id
11. Client and Admin can share email — order matters
12. Short replies — DeepSeek app hangs on long replies

## COMMANDS
Build admin:
cd /data/movies/Project/GM BUS STABLE/admin-dashboard
pm2 stop gm-admin && rm -rf dist && npm run build && pm2 start gm-admin

Restart backend: pm2 restart gm-backend

DB query:
cd /data/movies/Project/GM BUS STABLE/backend
psql "$(grep MASTER_DB .env | cut -d= -f2-)" -c "SELECT id, company_name, db_name, status FROM clients ORDER BY id DESC LIMIT 10;"

## NEW CHAT START
Send: /data/movies/Project/GM BUS STABLE/HANDOVER.md वाच. Context loaded म्हण, मग APK hosting + device pairing सुरू कर.

## QUICK REF
Admin UI: http://192.168.30.125:8091
Client UI: http://192.168.30.125:8081
Backend: http://192.168.30.125:5000


---

## SPRINT 4 — PLANNED (A + B + C + D एकत्र)

### Priority A — Flutter APK Production
**Goal:** bus-device-app real device वर चालवणं + APK distribute

Steps (local machine वर, server वर Flutter नाही):
1. cd bus-device-app && flutter pub get
2. Real Android device किंवा emulator connect (USB debugging)
3. flutter run — live debug (_Bootstrap मधून pair screen दिसेल)
4. Admin dashboard → Deployment → bus select → QR show → QR URL copy
5. Flutter app मध्ये paste: gm-bus://pair?client_id=13&bus_id=1&bus_number=MH12AB1234&token=XXXX
   → Pair होईल → Dashboard → "सुरू करा" → GPS stream चालू
6. Verify: client-dashboard LiveMap वर bus marker हलतोय का
7. Release APK: flutter build apk --release --split-per-abi
8. Upload: backend/public/apk/gm-bus-device.apk (gitignored)
9. Deployment.tsx मध्ये APK download link update

**Blockers:** Flutter SDK + Android SDK + real device/emulator (server वर नाही)
**Files:** bus-device-app/* (कोड ready, फक्त test/build बाकी)

---

### Priority B — Live Map improvements
**Files:** backend/src/services/socketService.js, backend/src/routes/tracking.js, client-dashboard/src/pages/LiveMap.tsx

#### B1. Polyline trail (शेवटचे 100 points)
Tenant DB मध्ये नवीन table:
  CREATE TABLE location_history (
    id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
    lat NUMERIC(10,7), lng NUMERIC(10,7),
    speed NUMERIC(5,2) DEFAULT 0,
    heading NUMERIC(5,2) DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_loc_hist_bus_time ON location_history(bus_id, recorded_at DESC);

- socketService: driver:location handler मध्ये live_locations सोबत location_history INSERT
- नवीन endpoint: GET /api/tracking/history/:busId?minutes=30 → last 100 points
- LiveMap.tsx: selected bus साठी trail polyline (हिरवा) + toggle

#### B2. Stale timeout (offline detect)
- socketService: setInterval (30 sec) सर्व driver sockets तपासा
- जर last_location_at 45 sec पेक्षा जुना → io.to(client_X).emit('bus:offline', { bus_id, last_update })
- LiveMap.tsx: bus:offline ऐकतो → marker grey + "Offline" badge
- Driver socket वर server-side last_location_at store

#### B3. Reconnect buffer (driver app)
- socket_service.dart: disconnect वेळी Queue<Map> मध्ये pings store (max 200)
- connect झाल्यावर queue flush → driver:location emit
- Optional: server-side dedupe समान ts

#### B4. Admin dashboard Live Map
- नवीन page: admin-dashboard/src/pages/AdminLiveMap.tsx
- सगळ्या clients ची buses एका map वर
- Backend: GET /api/admin/live-buses — सर्व approved clients वरून live_locations aggregate
- Socket: admin room मध्ये join (viewer:join सारखं admin:join)
- socketService: driver:location वर admin room ला पण broadcast

#### B5. Client dashboard polish
- Trail साठी वेगळा रंग
- Selected bus speed history sparkline (बोनस)

---

### Priority C — TTS / Voice fixes
**Files:** backend/src/services/ttsService.js, voiceService.js, backend/src/routes/tts.js, bus-device-app/lib/services/announcement_service.dart

#### C1. 4 language consistency
- EN + HI + MR + GU, primary = clients.preferred_language (default 'en')
- /api/tracking/announcement आधीच 4 langs generate करतो — verify + fallback
- clients.preferred_language सगळ्या approved clients साठी set आहे का तपासा

#### C2. Voice settings per client
- client_settings table structure तपासा
- Expected: voice_speed, voice_volume, announcement_seconds, stop_radius_meters
- client-dashboard settings page + admin ClientDetail sync

#### C3. Manual announce button (driver app)
- dashboard_screen.dart मध्ये आहे — 3 langs delay 3 sec
- Real device वर audio quality + latency test

#### C4. Announcement dedup
- एकाच stop साठी 2 वेळा announce होऊ नये
- announcement_service.dart: lastAnnouncedStopId + cooldown 60 sec

---

### Priority D — Admin dashboard cleanup
**Files:** admin-dashboard/src/pages/*, admin-dashboard/src/components/*

#### D1. AdminLiveMap page (B4 नंतर)
- Layout मध्ये route + sidebar link

#### D2. Notifications page real data
- GET /api/admin/activity आधीच आहे
- Reuse: signup_requests + new clients + failed logins

#### D3. Command palette (Ctrl+K)
- cmdk library किंवा manual (Fluent Dialog + input + keyboard nav)
- Commands: navigate pages, quick actions (add client, show QR, restart services)
- admin-dashboard/src/components/CommandPalette.tsx

#### D4. Audit log
Master DB मध्ये नवीन table:
  CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER, action TEXT, target_type TEXT, target_id INTEGER,
    metadata JSONB, ip TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
  );

- admin.js मध्ये helper: logAudit(req, action, target_type, target_id, metadata)
- Cover: client approve/reject, delete client, reset password, buses CRUD
- Admin UI: नवीन page Audit.tsx + filters

---

## SPRINT 4 ORDER (सुचवलेला)
1. **B1 + B2** — Live Map trail + offline (server + client-dashboard) — सगळ्यात valuable
2. **A** — Flutter APK real device test (parallel — तुम्ही local वर)
3. **B4 + D1** — Admin LiveMap
4. **C** — TTS polish + dedup
5. **D2 + D3 + D4** — Notifications, palette, audit

## SPRINT 4 START COMMAND (नवीन chat साठी)
cd "/data/movies/Project/GM BUS STABLE"
cat HANDOVER.md
# नंतर सांगा: "Sprint 4 B1 सुरू कर"

## SPRINT 3 ARCHIVE
- Commit 4175c58 — pairing + socket auth + Flutter QR flow
- Commit 77b19f7 — HANDOVER update
- files: backend/src/routes/pair.js, backend/src/services/socketService.js rewrite,
  admin-dashboard/src/pages/Deployment.tsx (QR client_id),
  bus-device-app/lib/{main.dart, screens/login_screen.dart, screens/dashboard_screen.dart,
  services/auth_service.dart, services/socket_service.dart}, pubspec.yaml (device_info_plus)
- Admin UI http://192.168.30.125:8091 — HTTP 200
- Backend http://192.168.30.125:5000 — HTTP 200
