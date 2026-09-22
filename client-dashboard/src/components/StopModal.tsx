import { useState, useEffect } from 'react'
import {
  Button, Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody,
  DialogActions, DialogContent, Field, Input, MessageBar, MessageBarBody,
  makeStyles, tokens, Text, Tab, TabList, Spinner, Badge
} from '@fluentui/react-components'
import { AddRegular, LocationRegular, MapRegular, LinkRegular, SaveRegular, SearchRegular } from '@fluentui/react-icons'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

const useStyles = makeStyles({
  dialog: { maxWidth: '800px', width: '95vw' },
  field: { marginBottom: '16px', width: '100%' },
  mapWrap: { height: '300px', borderRadius: '8px', overflow: 'hidden', marginTop: '12px', border: `1px solid ${tokens.colorNeutralStroke1}` },
  tabContent: { paddingTop: '16px' },
  coords: { display: 'flex', gap: '12px' },
  helpText: { fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '4px' },
  preview: { background: tokens.colorNeutralBackground2, padding: '12px', borderRadius: '8px', marginTop: '12px' },
  searchResults: { maxHeight: '200px', overflowY: 'auto', border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: '8px', marginTop: '12px' },
  resultItem: { padding: '12px', cursor: 'pointer', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, transition: 'background 0.15s' },
  resultTitle: { fontWeight: '600', fontSize: '14px' },
  resultAddress: { fontSize: '12px', color: tokens.colorNeutralForeground3, marginTop: '2px' },
  langBadge: { background: '#e0f2fe', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: '#0369a1' },
})

function LocationMarker({ position, setPosition }: any) {
  useMapEvents({ click(e: any) { setPosition(e.latlng) } })
  return position ? (
    <Marker position={position} icon={new Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="40" height="40"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
      iconSize: [40, 40], iconAnchor: [20, 40],
    })} />
  ) : null
}

function MapMover({ position }: any) {
  const map = useMap()
  useEffect(() => { if (position) map.flyTo(position, 15, { duration: 1 }) }, [position, map])
  return null
}

const LANG_LABELS: Record<string, { name: string; flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  mr: { name: 'मराठी', flag: '🇮🇳' },
  gu: { name: 'ગુજરાતી', flag: '🇮🇳' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
}

interface Props { routeId: string; stopNumber: number; onCreated: () => void }

export default function StopModal({ routeId, stopNumber, onCreated }: Props) {
  const styles = useStyles()
  const { t, lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'search' | 'gps' | 'map' | 'link' | 'manual'>('search')
  const [form, setForm] = useState({
    stop_name: '',        // English
    stop_name_local: '',  // Primary language (mr/gu/hi)
    lat: '', lng: '',
    stop_order: stopNumber,
  })
  const [position, setPosition] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [link, setLink] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [gettingGps, setGettingGps] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { if (tab === 'map') setMapReady(true) }, [tab])

  const primaryLang = lang === 'en' ? 'en' : lang
  const primaryLabel = LANG_LABELS[primaryLang] || LANG_LABELS.en
  const showLocalField = primaryLang !== 'en'

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return
    setSearching(true); setMsg(null); setSearchResults([])
    try {
      const res = await api.get(`/api/geocode/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (res.data.success) {
        setSearchResults(res.data.results)
        if (res.data.results.length === 0) setMsg({ type: 'error', text: t('noData') })
      }
    } catch (e) { setMsg({ type: 'error', text: t('noData') }) }
    finally { setSearching(false) }
  }

  const selectResult = (result: any) => {
    setForm({ ...form, lat: result.lat.toFixed(7), lng: result.lng.toFixed(7), stop_name: form.stop_name || result.name })
    setPosition({ lat: result.lat, lng: result.lng })
    setMsg({ type: 'success', text: `✅ ${result.name}` })
    setTab('map')
  }

  const getGpsLocation = () => {
    if (!navigator.geolocation) { setMsg({ type: 'error', text: 'GPS not supported' }); return }
    setGettingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(7)
        const lng = pos.coords.longitude.toFixed(7)
        setForm({ ...form, lat, lng })
        setPosition({ lat: parseFloat(lat), lng: parseFloat(lng) })
        setMsg({ type: 'success', text: `✅ GPS: ${lat}, ${lng}` })
        setGettingGps(false)
      },
      (err) => { setMsg({ type: 'error', text: `GPS: ${err.message}` }); setGettingGps(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const parseLink = async () => {
    if (!link.trim()) return
    setMsg(null)
    try {
      const res = await api.post('/api/tracking/parse-link', { url: link.trim() })
      if (res.data.success) {
        setForm({ ...form, lat: res.data.lat.toFixed(7), lng: res.data.lng.toFixed(7) })
        setPosition({ lat: res.data.lat, lng: res.data.lng })
        setMsg({ type: 'success', text: '✅ Link parsed' })
        setTab('map')
      }
    } catch (e: any) { setMsg({ type: 'error', text: 'Invalid link' }) }
  }

  const save = async () => {
    if (!form.stop_name.trim()) { setMsg({ type: 'error', text: 'English name required' }); return }
    if (!form.lat || !form.lng) { setMsg({ type: 'error', text: 'Location select करा' }); return }
    setLoading(true); setMsg(null)
    try {
      // Build payload — only 2 languages used
      const payload: any = {
        stop_name: form.stop_name.trim(),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        stop_order: form.stop_order,
      }
      const localName = form.stop_name_local.trim() || form.stop_name.trim()
      if (primaryLang === 'mr') { payload.stop_name_mr = localName; payload.stop_name_gu = form.stop_name.trim() }
      else if (primaryLang === 'gu') { payload.stop_name_gu = localName; payload.stop_name_mr = form.stop_name.trim() }
      else if (primaryLang === 'hi') { payload.stop_name_mr = localName; payload.stop_name_gu = form.stop_name.trim() } // hi uses mr column temporarily
      else { payload.stop_name_mr = form.stop_name.trim(); payload.stop_name_gu = form.stop_name.trim() }

      await api.post(`/api/route/${routeId}/stops`, payload)
      setMsg({ type: 'success', text: '✅ ' + t('save') })
      setTimeout(() => { setOpen(false); resetForm(); onCreated() }, 1200)
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed' }) }
    finally { setLoading(false) }
  }

  const resetForm = () => {
    setForm({ stop_name: '', stop_name_local: '', lat: '', lng: '', stop_order: stopNumber })
    setPosition(null); setLink(''); setSearchQuery(''); setSearchResults([]); setMsg(null); setTab('search')
  }

  return (
    <Dialog open={open} onOpenChange={(_, d) => { setOpen(d.open); if (!d.open) resetForm() }}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="primary" icon={<AddRegular />}>{t('addStop')}</Button>
      </DialogTrigger>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>🚏 {t('addStop')}</DialogTitle>
          <DialogContent>
            {msg && (
              <MessageBar intent={msg.type === 'success' ? 'success' : 'error'} style={{ marginBottom: '16px' }}>
                <MessageBarBody>{msg.text}</MessageBarBody>
              </MessageBar>
            )}

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Text weight="semibold">{t('stopNamesTitle')}</Text>
              <span className={styles.langBadge}>
                {primaryLang === "en" ? `🇬🇧 ${t("englishOnly")}` : `${primaryLabel.flag} ${primaryLabel.name} + 🇬🇧 English`}
              </span>
            </div>

            {/* English field — always */}
            <Field label={t('stopNameEn') + ' *'} className={styles.field}>
              <Input
                value={form.stop_name}
                onChange={(_, d) => setForm({ ...form, stop_name: d.value })}
                placeholder="Shivaji Nagar"
              />
            </Field>

            {/* Local language field — only if not English */}
            {showLocalField && (
              <Field label={t('stopNameLocal')} className={styles.field}>
                <Input
                  value={form.stop_name_local}
                  onChange={(_, d) => setForm({ ...form, stop_name_local: d.value })}
                  placeholder={
                    primaryLang === 'mr' ? 'शिवाजी नगर' :
                    primaryLang === 'gu' ? 'શિવાજી નગર' : 'शिवाजी नगर'
                  }
                />
              </Field>
            )}

            <div className={styles.helpText}>{t('helpText')}</div>

            <Field label={t('stopOrder')} className={styles.field} style={{ marginTop: '16px' }}>
              <Input type="number" value={String(form.stop_order)} onChange={(_, d) => setForm({ ...form, stop_order: parseInt(d.value) || stopNumber })} />
            </Field>

            <Text weight="semibold" style={{ margin: '16px 0 12px', display: 'block' }}>🗺️ {t('location')}</Text>
            <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as any)}>
              <Tab value="search" icon={<SearchRegular />}>{t('search')}</Tab>
              <Tab value="gps" icon={<LocationRegular />}>GPS</Tab>
              <Tab value="map" icon={<MapRegular />}>Map</Tab>
              <Tab value="link" icon={<LinkRegular />}>Link</Tab>
              <Tab value="manual" icon={<SaveRegular />}>{t('manual')}</Tab>
            </TabList>

            <div className={styles.tabContent}>
              {tab === 'search' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <Input value={searchQuery} onChange={(_, d) => setSearchQuery(d.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchPlaces()}
                      placeholder={t('searchPlace')} style={{ flex: 1 }}
                      contentBefore={<SearchRegular />} />
                    <Button appearance="primary" onClick={searchPlaces} disabled={searching}>
                      {searching ? <Spinner size="tiny" /> : t('search')}
                    </Button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                      {searchResults.map((r, i) => (
                        <div key={i} className={styles.resultItem} onClick={() => selectResult(r)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <div className={styles.resultTitle}>📍 {r.name}</div>
                          <div className={styles.resultAddress}>{r.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'gps' && (
                <Button appearance="primary" icon={<LocationRegular />} onClick={getGpsLocation} disabled={gettingGps} style={{ marginTop: '12px' }}>
                  {gettingGps ? '📍...' : '📍 ' + t('currentLocation')}
                </Button>
              )}

              {tab === 'map' && (
                <div className={styles.mapWrap}>
                  {mapReady && (
                    <MapContainer center={[position?.lat || 18.5204, position?.lng || 73.8567]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                      <LocationMarker position={position} setPosition={(p: any) => {
                        setPosition(p); setForm({ ...form, lat: p.lat.toFixed(7), lng: p.lng.toFixed(7) })
                      }} />
                      {position && <MapMover position={position} />}
                    </MapContainer>
                  )}
                </div>
              )}

              {tab === 'link' && (
                <Field className={styles.field} style={{ marginTop: '12px' }}>
                  <Input value={link} onChange={(_, d) => setLink(d.value)} placeholder="https://maps.google.com/..."
                    contentAfter={<Button size="small" appearance="primary" onClick={parseLink}>Parse</Button>} />
                </Field>
              )}

              {tab === 'manual' && (
                <div className={styles.coords}>
                  <Field label="Latitude" className={styles.field}>
                    <Input value={form.lat} onChange={(_, d) => setForm({ ...form, lat: d.value })} placeholder="18.5204000" />
                  </Field>
                  <Field label="Longitude" className={styles.field}>
                    <Input value={form.lng} onChange={(_, d) => setForm({ ...form, lng: d.value })} placeholder="73.8567000" />
                  </Field>
                </div>
              )}
            </div>

            {form.lat && form.lng && (
              <div className={styles.preview}>
                <Text size={200}>📍 {form.lat} , {form.lng}</Text>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => { setOpen(false); resetForm() }}>{t('cancel')}</Button>
            <Button appearance="primary" icon={<SaveRegular />} onClick={save} disabled={loading}>
              {loading ? '...' : t('save')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
