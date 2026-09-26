import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Field, Input, Dropdown, Option, MessageBar, MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular, EditRegular, DeleteRegular, ArrowClockwiseRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  wrap: { maxWidth: '1400px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  routeBar: { display:'flex', gap:'12px', alignItems:'center', marginBottom:'20px', padding:'16px', borderRadius:'14px', background: tokens.colorNeutralBackground2 },
  card: { padding:'8px 0', borderRadius:'14px', border: '1px solid ' + tokens.colorNeutralStroke2 },
  loader: { display:'flex', justifyContent:'center', padding:'60px' },
  empty: { textAlign:'center', padding:'60px', color:tokens.colorNeutralForeground3 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  grid4: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px' },
})

const EMPTY_FORM = {
  stop_name:'', stop_name_mr:'', stop_name_gu:'', stop_name_hi:'',
  lat:'', lng:'', stop_order:1, announcement_text:''
}

export default function Stops() {
  const s = useStyles()
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState<any[]>([])
  const [routeId, setRouteId] = useState<string>('')
  const [items, setItems] = useState<any[]>([])
  const [msg, setMsg] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  useEffect(() => {
    api.get('/api/route').then(r => setRoutes(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const load = async () => {
    if (!routeId) { setItems([]); return }
    setLoading(true); setMsg(null)
    try {
      const r = await api.get(`/api/route/${routeId}/stops`)
      setItems(Array.isArray(r.data) ? r.data : [])
    } catch(e:any) {
      setItems([])
      setMsg({type:'warning', text:'API शी connection नाही — ' + e.message})
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [routeId])

  const nextOrder = () => {
    if (!items.length) return 1
    return Math.max(...items.map((x:any) => x.stop_order || 0)) + 1
  }

  const save = async () => {
    if (!form.stop_name) { setMsg({type:'error', text:'Stop name आवश्यक आहे'}); return }
    try {
      const payload = {
        stop_name: form.stop_name,
        stop_name_mr: form.stop_name_mr || form.stop_name,
        stop_name_gu: form.stop_name_gu || form.stop_name,
        stop_name_hi: form.stop_name_hi || form.stop_name,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        stop_order: form.stop_order ? Number(form.stop_order) : nextOrder(),
        announcement_text: form.announcement_text || null,
      }
      if (editId) await api.put(`/api/route/${routeId}/stops/${editId}`, payload)
      else await api.post(`/api/route/${routeId}/stops`, payload)
      setMsg({type:'success', text:'✅ Saved'})
      setOpen(false); setEditId(null); setForm(EMPTY_FORM)
      load()
    } catch(e:any) { setMsg({type:'error', text:e.response?.data?.error || e.message}) }
  }

  const del = async (id:number) => {
    if (!confirm('Delete stop ' + id + '?')) return
    try { await api.delete(`/api/route/${routeId}/stops/${id}`); setMsg({type:'success', text:'✅ Deleted'}); load() }
    catch(e:any) { setMsg({type:'error', text:e.message}) }
  }

  const routeName = (id:any) => {
    const r = routes.find(x => String(x.id) === String(id))
    return r ? r.route_name : ('#' + id)
  }

  return (
    <Layout title="Stops">
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text size={700} weight="bold" style={{ display:'block' }}>📍 Stops</Text>
          <Text size={300} style={{ color:tokens.colorNeutralForeground3 }}>
            {routeId ? items.length + ' stops in ' + routeName(routeId) : 'Select a route'}
          </Text>
        </div>
      </div>

      <div className={s.routeBar}>
        <Text weight="semibold">Route:</Text>
        <Dropdown
          placeholder="— Select a route —"
          value={routeId ? routeName(routeId) : ''}
          selectedOptions={routeId ? [routeId] : []}
          onOptionSelect={(_, d) => setRouteId(d.optionValue || '')}
          style={{ minWidth: '280px' }}
        >
          {routes.map((r:any) => <Option key={r.id} value={String(r.id)}>{r.route_name}</Option>)}
        </Dropdown>
        <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={load} disabled={!routeId}>Refresh</Button>
        <div style={{flex:1}} />
        <Button appearance="primary" icon={<AddRegular />} disabled={!routeId}
          onClick={() => { setForm({...EMPTY_FORM, stop_order: nextOrder()}); setEditId(null); setOpen(true) }}>
          Add Stop
        </Button>
      </div>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        {!routeId ? <div className={s.empty}><Text>Select a route first</Text></div> :
          loading ? <div className={s.loader}><Spinner /></div> :
          items.length === 0 ? <div className={s.empty}><Text>No stops yet — "Add Stop" वर क्लिक करा</Text></div> :
          <Table size="small">
            <TableHeader><TableRow>
              <TableHeaderCell style={{width:'60px'}}>#</TableHeaderCell>
              <TableHeaderCell>Name (EN)</TableHeaderCell>
              <TableHeaderCell>मराठी</TableHeaderCell>
              <TableHeaderCell>ગુજરાતી</TableHeaderCell>
              <TableHeaderCell>Lat, Lng</TableHeaderCell>
              <TableHeaderCell style={{width:'120px'}}>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it:any, i:number) => (
                <TableRow key={it.id || i}>
                  <TableCell><Text weight="semibold">{it.stop_order || i+1}</Text></TableCell>
                  <TableCell><Text weight="semibold">{it.stop_name || '-'}</Text></TableCell>
                  <TableCell>{it.stop_name_mr || '-'}</TableCell>
                  <TableCell>{it.stop_name_gu || '-'}</TableCell>
                  <TableCell>{(it.lat && it.lng) ? it.lat + ', ' + it.lng : '-'}</TableCell>
                  <TableCell>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => {
                        setForm({
                          stop_name: it.stop_name || '', stop_name_mr: it.stop_name_mr || '',
                          stop_name_gu: it.stop_name_gu || '', stop_name_hi: it.stop_name_hi || '',
                          lat: it.lat || '', lng: it.lng || '',
                          stop_order: it.stop_order || 1,
                          announcement_text: it.announcement_text || '',
                        }); setEditId(it.id); setOpen(true)
                      }} />
                      <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => del(it.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </Card>

      <Dialog open={open} onOpenChange={(_, d) => { if(!d.open) { setOpen(false); setEditId(null) } }}>
        <DialogSurface style={{ maxWidth:'680px' }}>
          <DialogBody>
            <DialogTitle>{editId ? 'Edit Stop' : 'Add Stop'}</DialogTitle>
            <DialogContent>
              <div className={s.grid2}>
                <Field label="Stop Name (English) *">
                  <Input value={form.stop_name||''} onChange={(_,d)=>setForm({...form,stop_name:d.value})} placeholder="Main Bus Stand" />
                </Field>
                <Field label="Order #">
                  <Input type="number" value={String(form.stop_order||1)} onChange={(_,d)=>setForm({...form,stop_order:d.value})} />
                </Field>
              </div>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="नाव (मराठी)">
                  <Input value={form.stop_name_mr||''} onChange={(_,d)=>setForm({...form,stop_name_mr:d.value})} placeholder="मुख्य बस स्टँड" />
                </Field>
                <Field label="નામ (ગુજરાતી)">
                  <Input value={form.stop_name_gu||''} onChange={(_,d)=>setForm({...form,stop_name_gu:d.value})} placeholder="મુખ્ય બસ સ્ટેન્ડ" />
                </Field>
              </div>
              <Field label="नाम (हिंदी)" style={{marginTop:'12px'}}>
                <Input value={form.stop_name_hi||''} onChange={(_,d)=>setForm({...form,stop_name_hi:d.value})} placeholder="मुख्य बस स्टैंड" />
              </Field>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Latitude">
                  <Input value={form.lat||''} onChange={(_,d)=>setForm({...form,lat:d.value})} placeholder="19.9975" />
                </Field>
                <Field label="Longitude">
                  <Input value={form.lng||''} onChange={(_,d)=>setForm({...form,lng:d.value})} placeholder="73.7898" />
                </Field>
              </div>
              <Field label="Announcement text (optional)" style={{marginTop:'12px'}}>
                <Input value={form.announcement_text||''} onChange={(_,d)=>setForm({...form,announcement_text:d.value})} placeholder="पुढील स्टॉप..." />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={save}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
    </Layout>
  )
}
