import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Field, Input, Dropdown, Option, MessageBar, MessageBarBody, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, Dialog, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, makeStyles, tokens } from '@fluentui/react-components'
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
})

const EMPTY_FORM = {
  bus_number:'', driver_name:'', driver_phone:'', route_id:'', capacity:40, status:'active'
}

export default function Buses() {
  const s = useStyles()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [msg, setMsg] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState<any>(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    try {
      const [b, r] = await Promise.all([
        api.get('/api/bus').catch(() => ({ data: [] })),
        api.get('/api/route').catch(() => ({ data: [] })),
      ])
      setItems(Array.isArray(b.data) ? b.data : [])
      setRoutes(Array.isArray(r.data) ? r.data : [])
    } catch(e:any) {
      setItems([])
      setMsg({type:'warning', text:'API शी connection नाही — ' + e.message})
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const routeName = (id:any) => {
    if (!id) return '-'
    const r = routes.find((x:any) => x.id === id)
    return r ? (r.route_name || r.name || ('#' + id)) : ('#' + id)
  }

  const save = async () => {
    if (!form.bus_number) { setMsg({type:'error', text:'Bus number आवश्यक आहे'}); return }
    try {
      const payload = {
        bus_number: form.bus_number,
        driver_name: form.driver_name || null,
        driver_phone: form.driver_phone || null,
        route_id: form.route_id ? Number(form.route_id) : null,
        capacity: form.capacity ? Number(form.capacity) : 40,
        status: form.status || 'active',
      }
      if (editId) await api.put('/api/bus/' + editId, payload)
      else await api.post('/api/bus', payload)
      setMsg({type:'success', text:'✅ Saved'})
      setOpen(false); setEditId(null); setForm(EMPTY_FORM)
      load()
    } catch(e:any) { setMsg({type:'error', text:e.response?.data?.error || e.message}) }
  }

  const del = async (id:number) => {
    if (!confirm('Delete bus ' + id + '?')) return
    try { await api.delete('/api/bus/' + id); setMsg({type:'success', text:'✅ Deleted'}); load() }
    catch(e:any) { setMsg({type:'error', text:e.message}) }
  }

  return (
    <Layout title="Bus Fleet Management">
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text size={700} weight="bold" style={{ display:'block' }}>🚌 Bus Fleet Management</Text>
          <Text size={300} style={{ color:tokens.colorNeutralForeground3 }}>{items.length} buses</Text>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={load} />
          <Button appearance="primary" icon={<AddRegular />} onClick={() => { setForm(EMPTY_FORM); setEditId(null); setOpen(true) }}>Add Bus</Button>
        </div>
      </div>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        {loading ? <div className={s.loader}><Spinner /></div> :
          items.length === 0 ? <div className={s.empty}><Text>No buses yet — "Add Bus" वर क्लिक करा</Text></div> :
          <Table size="small">
            <TableHeader><TableRow>
              <TableHeaderCell style={{width:'60px'}}>ID</TableHeaderCell>
              <TableHeaderCell>Bus No.</TableHeaderCell>
              <TableHeaderCell>Driver</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Route</TableHeaderCell>
              <TableHeaderCell>Capacity</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell style={{width:'120px'}}>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it:any, i:number) => (
                <TableRow key={it.id || i}>
                  <TableCell>#{it.id || i+1}</TableCell>
                  <TableCell><Text weight="semibold">{it.bus_number || '-'}</Text></TableCell>
                  <TableCell>{it.driver_name || '-'}</TableCell>
                  <TableCell>{it.driver_phone || '-'}</TableCell>
                  <TableCell>{routeName(it.route_id)}</TableCell>
                  <TableCell>{it.capacity || '-'}</TableCell>
                  <TableCell>
                    <span style={{
                      padding:'2px 8px', borderRadius:'10px', fontSize:'12px',
                      background: it.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: it.status === 'active' ? '#166534' : '#991b1b'
                    }}>{it.status || 'active'}</span>
                  </TableCell>
                  <TableCell>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Button size="small" appearance="subtle" icon={<EditRegular />} onClick={() => {
                        setForm({
                          bus_number: it.bus_number || '',
                          driver_name: it.driver_name || '',
                          driver_phone: it.driver_phone || '',
                          route_id: it.route_id || '',
                          capacity: it.capacity || 40,
                          status: it.status || 'active',
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
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editId ? 'Edit Bus' : 'Add Bus'}</DialogTitle>
            <DialogContent>
              <Field label="Bus Number *">
                <Input value={form.bus_number||''} onChange={(_,d)=>setForm({...form,bus_number:d.value})} placeholder="MH12AB1234" />
              </Field>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Driver Name">
                  <Input value={form.driver_name||''} onChange={(_,d)=>setForm({...form,driver_name:d.value})} placeholder="Full name" />
                </Field>
                <Field label="Driver Phone">
                  <Input value={form.driver_phone||''} onChange={(_,d)=>setForm({...form,driver_phone:d.value})} placeholder="9876543210" />
                </Field>
              </div>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Capacity">
                  <Input type="number" value={String(form.capacity||40)} onChange={(_,d)=>setForm({...form,capacity:d.value})} />
                </Field>
                <Field label="Status">
                  <Dropdown value={form.status || 'active'} selectedOptions={[form.status || 'active']} onOptionSelect={(_,d)=>setForm({...form,status:d.optionValue})}>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="maintenance">Maintenance</Option>
                  </Dropdown>
                </Field>
              </div>
              <Field label="Route" style={{marginTop:'12px'}}>
                <Dropdown
                  value={form.route_id ? routeName(form.route_id) : '(no route)'}
                  selectedOptions={form.route_id ? [String(form.route_id)] : []}
                  onOptionSelect={(_,d)=>setForm({...form,route_id:d.optionValue})}
                >
                  <Option value="">(no route)</Option>
                  {routes.map((r:any) => <Option key={r.id} value={String(r.id)}>{r.route_name || r.name || ('#' + r.id)}</Option>)}
                </Dropdown>
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
