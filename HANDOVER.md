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
