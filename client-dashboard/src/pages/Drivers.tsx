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
  name:'', phone:'', email:'', license_no:'', license_expiry:'',
  blood_group:'', address:'', shift:'day', status:'active'
}

export default function Drivers() {
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
      const r = await api.get('/api/drivers')
      setItems(Array.isArray(r.data) ? r.data : [])
    } catch(e:any) {
      setItems([])
      setMsg({type:'warning', text:'API शी connection नाही — ' + e.message})
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name) { setMsg({type:'error', text:'Name आवश्यक आहे'}); return }
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        license_no: form.license_no || null,
        license_expiry: form.license_expiry || null,
        blood_group: form.blood_group || null,
        address: form.address || null,
        shift: form.shift || 'day',
        status: form.status || 'active',
      }
      if (editId) await api.put('/api/drivers/' + editId, payload)
      else await api.post('/api/drivers', payload)
      setMsg({type:'success', text:'✅ Saved'})
      setOpen(false); setEditId(null); setForm(EMPTY_FORM)
      load()
    } catch(e:any) { setMsg({type:'error', text:e.response?.data?.error || e.message}) }
  }

  const del = async (id:number) => {
    if (!confirm('Delete driver ' + id + '?')) return
    try { await api.delete('/api/drivers/' + id); setMsg({type:'success', text:'✅ Deleted'}); load() }
    catch(e:any) { setMsg({type:'error', text:e.message}) }
  }

  const fmtDate = (d:any) => d ? String(d).slice(0,10) : '-'

  return (
    <Layout title="Driver Management">
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <Text size={700} weight="bold" style={{ display:'block' }}>👤 Driver Management</Text>
          <Text size={300} style={{ color:tokens.colorNeutralForeground3 }}>{items.length} drivers</Text>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Button appearance="subtle" icon={<ArrowClockwiseRegular />} onClick={load} />
          <Button appearance="primary" icon={<AddRegular />} onClick={() => { setForm(EMPTY_FORM); setEditId(null); setOpen(true) }}>Add Driver</Button>
        </div>
      </div>

      {msg && <MessageBar intent={msg.type} style={{ marginBottom:'16px' }}><MessageBarBody>{msg.text}</MessageBarBody></MessageBar>}

      <Card className={s.card}>
        {loading ? <div className={s.loader}><Spinner /></div> :
          items.length === 0 ? <div className={s.empty}><Text>No drivers yet — "Add Driver" वर क्लिक करा</Text></div> :
          <Table size="small">
            <TableHeader><TableRow>
              <TableHeaderCell style={{width:'50px'}}>ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>License No.</TableHeaderCell>
              <TableHeaderCell>Expiry</TableHeaderCell>
              <TableHeaderCell>Blood</TableHeaderCell>
              <TableHeaderCell>Shift</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell style={{width:'110px'}}>Actions</TableHeaderCell>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((it:any, i:number) => (
                <TableRow key={it.id || i}>
                  <TableCell>#{it.id || i+1}</TableCell>
                  <TableCell><Text weight="semibold">{it.name || '-'}</Text></TableCell>
                  <TableCell>{it.phone || '-'}</TableCell>
                  <TableCell>{it.license_no || '-'}</TableCell>
                  <TableCell>{fmtDate(it.license_expiry)}</TableCell>
                  <TableCell>{it.blood_group || '-'}</TableCell>
                  <TableCell>{it.shift || '-'}</TableCell>
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
                          name: it.name || '', phone: it.phone || '', email: it.email || '',
                          license_no: it.license_no || '',
                          license_expiry: it.license_expiry ? String(it.license_expiry).slice(0,10) : '',
                          blood_group: it.blood_group || '', address: it.address || '',
                          shift: it.shift || 'day', status: it.status || 'active',
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
            <DialogTitle>{editId ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
            <DialogContent>
              <div className={s.grid2}>
                <Field label="Name *">
                  <Input value={form.name||''} onChange={(_,d)=>setForm({...form,name:d.value})} placeholder="Full name" />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone||''} onChange={(_,d)=>setForm({...form,phone:d.value})} placeholder="9876543210" />
                </Field>
              </div>
              <Field label="Email" style={{marginTop:'12px'}}>
                <Input type="email" value={form.email||''} onChange={(_,d)=>setForm({...form,email:d.value})} placeholder="name@company.com" />
              </Field>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="License No.">
                  <Input value={form.license_no||''} onChange={(_,d)=>setForm({...form,license_no:d.value})} placeholder="MH12-20190001" />
                </Field>
                <Field label="License Expiry">
                  <Input type="date" value={form.license_expiry||''} onChange={(_,d)=>setForm({...form,license_expiry:d.value})} />
                </Field>
              </div>
              <div className={s.grid2} style={{marginTop:'12px'}}>
                <Field label="Blood Group">
                  <Dropdown value={form.blood_group || '—'} selectedOptions={form.blood_group ? [form.blood_group] : ['—']} onOptionSelect={(_,d)=>setForm({...form,blood_group:d.optionValue === '—' ? '' : d.optionValue})}>
                    <Option value="—">—</Option>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <Option key={b} value={b}>{b}</Option>)}
                  </Dropdown>
                </Field>
                <Field label="Shift">
                  <Dropdown value={form.shift || 'day'} selectedOptions={[form.shift || 'day']} onOptionSelect={(_,d)=>setForm({...form,shift:d.optionValue})}>
                    <Option value="day">Day</Option>
                    <Option value="night">Night</Option>
                    <Option value="split">Split</Option>
                  </Dropdown>
                </Field>
              </div>
              <Field label="Address" style={{marginTop:'12px'}}>
                <Input value={form.address||''} onChange={(_,d)=>setForm({...form,address:d.value})} placeholder="Full address" />
              </Field>
              <Field label="Status" style={{marginTop:'12px'}}>
                <Dropdown value={form.status || 'active'} selectedOptions={[form.status || 'active']} onOptionSelect={(_,d)=>setForm({...form,status:d.optionValue})}>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="on_leave">On Leave</Option>
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
