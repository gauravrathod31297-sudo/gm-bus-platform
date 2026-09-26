import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Field, Input, MessageBar, MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, makeStyles, tokens } from '@fluentui/react-components'
import { AddRegular, EditRegular, DeleteRegular, ArrowClockwiseRegular } from '@fluentui/react-icons'
import api from '../services/api'
import Layout from '../components/Layout'

const useStyles = makeStyles({
  wrap: { maxWidth: '1400px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  card: { padding:'8px 0', borderRadius:'14px', border: '1px solid ' + tokens.colorNeutralStroke2 },
  loader: { display:'flex', justifyContent:'center', padding:'60px' },
  empty: { textAlign:'center', padding:'60px', color:tokens.colorNeutralForeground3 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  grid4: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'12px' },
})

const EMPTY_FORM = {
  route_name:'', start_point:'', end_point:'',
  start_lat:'', start_lng:'', end_lat:'', end_lng:'',
  distance_km:'', estimated_minutes:'',
}

export default function Routes() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [msg, setMsg] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/route')
      setItems(Array.isArray(r.data) ? r.data : [])
    } catch(e:any) {
      setItems([])
      setMsg({type:'warning', text:'API शी connection नाही — ' + e.message})
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.route_name) { setMsg({type:'error', text:'Route name आवश्यक आहे'}); return }
    try {
      const payload = {
        route_name: form.route_name,
        start_point: form.start_point || null,
        end_point: form.end_point || null,
        start_lat: form.start_lat ? Number(form.start_lat) : null,
        start_lng: form.start_lng ? Number(form.start_lng) : null,
        end_lat: form.end_lat ? Number(form.end_lat) : null,
        end_lng: form.end_lng ? Number(form.end_lng) : null,
        distance_km: form.distance_km ? Number(form.distance_km) : null,
        estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
      }
      if (editId) await api.put('/api/route/' + editId, payload)
      else await api.post('/api/route', payload)
      setMsg({type:'success', text:'✅ Saved'})
      setOpen(false); setEditId(null); setForm(EMPTY_FORM)
      load()
    } catch(e:any) { setMsg({type:'error', text:e.response?.data?.error || e.message}) }
  }

  const del = async (id:number) => {
    if (!confirm('Delete route ' + id + '? (त्याचे सगळे stops पण delete होतील)')) return
    try { await api.delete('/api/route/' + id); setMsg({type:'success', text:'✅ Deleted'}); load() }
    catch(e:any) { setMsg({type:'error', text:e.message}) }
  }

  return (
    <Layout title="Routes">
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text size={700} weight="bold" style={{ display:'block' }}>🛣️ Routes</Text>
          <Text size={300} style={{ color:tokens.colorNeutralForeground3 }}>{items.length} routes</Text>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={load} />
          <Button appearance="primary" icon={<AddRegular />} onClick={() => { setForm(EMPTY_FORM); setEditId(null); setOpen(true) }}>Add Route</Button>
        </div>
      </div>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        {loading ? <div className={s.loader}><Spinner /></div> :
          items.length === 0 ? <div className={s.empty}><Text>No routes yet — "Add Route" वर क्लिक करा</Text></div> :
          <Table size="small">
            <TableHeader><TableRow>
              <TableHeaderCell style={{width:'50px'}}>ID</TableHeaderCell>
              <TableHeaderCell>Route Name</TableHeaderCell>
              <TableHeaderCell>Start → End</TableHeaderCell>
              <TableHeaderCell>Distance</TableHeaderCell>
              <TableHeaderCell>Est. Time</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it:any, i:number) => (
                <TableRow key={it.id || i}>
                  <TableCell>#{it.id || i+1}</TableCell>
                  <TableCell><Text weight="semibold">{it.route_name || '-'}</Text></TableCell>
                  <TableCell>{(it.start_point || '-') + ' → ' + (it.end_point || '-')}</TableCell>
                  <TableCell>{it.distance_km ? it.distance_km + ' km' : '-'}</TableCell>
                  <TableCell>{it.estimated_minutes ? it.estimated_minutes + ' min' : '-'}</TableCell>
                  <TableCell>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => {
                        setForm({
                          route_name: it.route_name || '',
                          start_point: it.start_point || '',
                          end_point: it.end_point || '',
                          start_lat: it.start_lat || '', start_lng: it.start_lng || '',
                          end_lat: it.end_lat || '', end_lng: it.end_lng || '',
                          distance_km: it.distance_km || '',
                          estimated_minutes: it.estimated_minutes || '',
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
            <DialogTitle>{editId ? 'Edit Route' : 'Add Route'}</DialogTitle>
            <DialogContent>
              <Field label="Route Name *">
                <Input value={form.route_name||''} onChange={(_,d)=>setForm({...form,route_name:d.value})} placeholder="e.g. Nashik → Pune" />
              </Field>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Start Point">
                  <Input value={form.start_point||''} onChange={(_,d)=>setForm({...form,start_point:d.value})} placeholder="Nashik" />
                </Field>
                <Field label="End Point">
                  <Input value={form.end_point||''} onChange={(_,d)=>setForm({...form,end_point:d.value})} placeholder="Pune" />
                </Field>
              </div>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Distance (km)">
                  <Input type="number" value={String(form.distance_km||'')} onChange={(_,d)=>setForm({...form,distance_km:d.value})} placeholder="210" />
                </Field>
                <Field label="Estimated Time (min)">
                  <Input type="number" value={String(form.estimated_minutes||'')} onChange={(_,d)=>setForm({...form,estimated_minutes:d.value})} placeholder="240" />
                </Field>
              </div>

              <Text weight="semibold" style={{marginTop:'20px', display:'block'}}>Start Coordinates (optional)</Text>
              <div className={s.grid2} style={{marginTop:'6px'}}>
                <Field label="Start Lat">
                  <Input value={form.start_lat||''} onChange={(_,d)=>setForm({...form,start_lat:d.value})} placeholder="19.9975" />
                </Field>
                <Field label="Start Lng">
                  <Input value={form.start_lng||''} onChange={(_,d)=>setForm({...form,start_lng:d.value})} placeholder="73.7898" />
                </Field>
              </div>

              <Text weight="semibold" style={{marginTop:'12px', display:'block'}}>End Coordinates (optional)</Text>
              <div className={s.grid2} style={{marginTop:'6px'}}>
                <Field label="End Lat">
                  <Input value={form.end_lat||''} onChange={(_,d)=>setForm({...form,end_lat:d.value})} placeholder="18.5204" />
                </Field>
                <Field label="End Lng">
                  <Input value={form.end_lng||''} onChange={(_,d)=>setForm({...form,end_lng:d.value})} placeholder="73.8567" />
                </Field>
              </div>
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
