'use client';
import { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Edit2, Check, X, Download } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { IncomeEntry, ExpenseEntry, TaxDeductionType } from '@/lib/types';
import { format, parseISO, startOfMonth } from 'date-fns';

type Tab = 'overview' | 'ledger' | 'tax';

const COLORS = ['#a855f7', '#6366f1', '#22d3a5', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function AnalyticsPage() {
  const { role, queueCards, workTypes, platforms, incomeEntries, expenseEntries,
    addIncomeEntry, updateIncomeEntry, removeIncomeEntry,
    addExpenseEntry, updateExpenseEntry, removeExpenseEntry,
    taxDeductionTypes, addTaxType, updateTaxType, removeTaxType, settings } = useAppStore();
  const { toast } = useToast();

  if (role === 'guest') return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem', color: 'var(--text-muted)' }}>
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Access Restricted</h2>
      <p>Analytics is only available to the site owner.</p>
    </div>
  );

  const [tab, setTab] = useState<Tab>('overview');

  // ── Charts data ──────────────────────────────────────────────────────────
  const workTypeSales = workTypes.map((wt) => ({
    name: wt.title,
    count: queueCards.filter((c) => c.workTypeId === wt.id).length,
    revenue: queueCards.filter((c) => c.workTypeId === wt.id && c.paymentStatus === 'paid')
      .reduce((s, c) => s + c.price * c.quantity, 0),
  })).filter((d) => d.count > 0);

  const platformData = platforms.map((p) => ({
    name: p.name,
    value: queueCards.filter((c) => c.platformId === p.id).length,
  })).filter((d) => d.value > 0);

  // Daily income (last 30 days)
  const dailyMap: Record<string, number> = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyMap[format(d, 'yyyy-MM-dd')] = 0;
  }

  [...incomeEntries, ...queueCards.filter((c) => c.paymentStatus === 'paid').map((c) => ({
    date: c.commissionDate,
    amount: c.price * c.quantity,
    isFromQueue: true,
  }))].forEach((e) => {
    if (dailyMap[e.date] !== undefined) {
      dailyMap[e.date] += e.amount;
    }
  });
  const dailyData = Object.entries(dailyMap).map(([date, income]) => ({ 
    date: format(parseISO(date), 'dd MMM'), 
    fullDate: date,
    income 
  }));

  // Hourly ordering peak
  const hourlyMap: Record<string, number> = {};
  for (let i = 0; i < 24; i++) hourlyMap[i.toString().padStart(2, '0')] = 0;
  
  queueCards.forEach(c => {
    if (c.commissionTime) {
      const hour = c.commissionTime.split(':')[0];
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    } else {
      // Fallback to createdAt hour if no commissionTime
      const hour = format(new Date(c.createdAt), 'HH');
      hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
    }
  });
  const hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({ hour: `${hour}:00`, count }));

  // Monthly income (last 12 months)
  const monthlyMap: Record<string, number> = {};
  [...incomeEntries, ...queueCards.filter((c) => c.paymentStatus === 'paid').map((c) => ({
    date: c.commissionDate,
    amount: c.price * c.quantity,
    isFromQueue: true,
  }))].forEach((e) => {
    const key = format(startOfMonth(parseISO(e.date)), 'MMM yy');
    monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, income]) => ({ month, income })).slice(-12);

  const totalIncome = incomeEntries.filter(e => !e.isFromQueue).reduce((s, e) => s + e.amount, 0)
    + queueCards.filter((c) => c.paymentStatus === 'paid').reduce((s, c) => s + c.price * c.quantity, 0);
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title"><span className="gradient-text">Analytics</span></h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Business insights & financial tracking</p>
      </div>

      <div className="tab-bar" style={{ marginBottom: '2rem', maxWidth: 400 }}>
        {(['overview', 'ledger', 'tax'] as Tab[]).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Rankings */}
          <div style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               🏆 Top Work Types This Month
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[...workTypeSales].sort((a, b) => b.count - a.count).slice(0, 3).map((wt, i) => {
                const crowns = ['👑', '🥈', '🥉'];
                const bgColors = [
                  'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.02) 100%)',
                  'linear-gradient(135deg, rgba(226,232,240,0.1) 0%, rgba(226,232,240,0.02) 100%)',
                  'linear-gradient(135deg, rgba(180,83,9,0.1) 0%, rgba(180,83,9,0.02) 100%)'
                ];
                const borders = [
                   '1px solid rgba(251,191,36,0.3)',
                   '1px solid rgba(226,232,240,0.3)',
                   '1px solid rgba(180,83,9,0.3)'
                ];
                return (
                  <div key={wt.name} className="glass" style={{ 
                    padding: '1.5rem', 
                    textAlign: 'center', 
                    background: bgColors[i],
                    border: borders[i],
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{crowns[i]}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                       {i === 0 ? 'Champion' : i === 1 ? 'Runner Up' : '3rd Place'}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{wt.name}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700, marginTop: '0.5rem' }}>{wt.count} orders</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Income', value: `${settings.currency}${totalIncome.toLocaleString()}`, color: 'var(--success)' },
              { label: 'Total Expenses', value: `${settings.currency}${totalExpenses.toLocaleString()}`, color: 'var(--danger)' },
              { label: 'Net Profit', value: `${settings.currency}${(totalIncome - totalExpenses).toLocaleString()}`, color: 'var(--accent)' },
              { label: 'Total Commissions', value: queueCards.length, color: '#fbbf24' },
            ].map((s) => (
              <div key={s.label} className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
            {/* Daily Trend */}
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Daily Income Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#160d28', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Line type="monotone" dataKey="income" stroke="var(--accent)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Chart */}
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Monthly Income (Last 12 Months)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#160d28', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="income" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Order Time Peak */}
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Order Peak Hours</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#160d28', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--success)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                Analyze what time customers usually place orders.
              </p>
            </div>

            {/* Work type sales */}
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Sales by Work Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workTypeSales}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: '#160d28', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform pie chart */}
            <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Clients by Platform</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#160d28', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'ledger' && <LedgerTab />}
      {tab === 'tax' && <TaxTab />}
    </div>
  );
}

// ── Ledger ────────────────────────────────────────────────────────────────────
function LedgerTab() {
  const { incomeEntries, addIncomeEntry, removeIncomeEntry, expenseEntries, addExpenseEntry, removeExpenseEntry, updateExpenseEntry, settings } = useAppStore();
  const { toast } = useToast();
  const supabase = createClient();
  const [showIncForm, setShowIncForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [incForm, setIncForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, source: '', category: 'Other' });
  const [expForm, setExpForm] = useState<{ id?: string, date: string, amount: number, category: string, description: string, customCategory?: string }>({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, category: 'Software', description: '' });

  const queueIncome = incomeEntries.filter((e) => e.isFromQueue);
  const manualIncome = incomeEntries.filter((e) => !e.isFromQueue);

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Financial Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 23);
    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Source/Description', 'Category', 'Amount']],
      body: incomeEntries.map((e) => [e.date, e.source, e.category, `${settings.currency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [99, 102, 241] },
    });
    const afterIncome = (doc as any).lastAutoTable.finalY + 8;
    doc.text('Expenses', 14, afterIncome);
    autoTable(doc, {
      startY: afterIncome + 4,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: expenseEntries.map((e) => [e.date, e.description, e.category, `${settings.currency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [168, 85, 247] },
    });
    doc.save('financial-report.pdf');
    toast('PDF exported!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={exportPDF}><Download size={14} /> Export PDF</button>
      </div>

      {/* Income */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>Income</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowIncForm(true)}><Plus size={14} /> Add</button>
        </div>
        {showIncForm && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8 }}>
            <input className="input" type="date" value={incForm.date} onChange={(e) => setIncForm({ ...incForm, date: e.target.value })} />
            <input className="input" type="number" placeholder="Amount" value={incForm.amount || ''} onFocus={(e) => e.target.select()} onChange={(e) => setIncForm({ ...incForm, amount: e.target.value === '' ? 0 : +e.target.value })} />
            <input className="input" placeholder="Source" value={incForm.source} onChange={(e) => setIncForm({ ...incForm, source: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return toast('Not logged in', 'error');
                const { data, error } = await supabase.from('income_entries').insert({
                  user_id: user.id, date: incForm.date, amount: incForm.amount, source: incForm.source, category: incForm.category, is_from_queue: false
                }).select('id').single();
                if (error) return toast(`DB Error: ${error.message}`, 'error');
                
                addIncomeEntry({ id: data.id, ...incForm, isFromQueue: false });
                setShowIncForm(false);
                toast('Income added', 'success');
              }}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowIncForm(false)}><X size={13} /></button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {incomeEntries.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No income entries yet.</p>}
          {incomeEntries.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{e.date}</span>
              <span style={{ flex: 1 }}>{e.source}</span>
              <span className="badge badge-purple">{e.category}</span>
              {e.isFromQueue && <span className="badge badge-gray">Queue</span>}
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{settings.currency}{e.amount.toLocaleString()}</span>
              {!e.isFromQueue && <button className="btn-icon" onClick={async () => {
                await supabase.from('income_entries').delete().eq('id', e.id);
                removeIncomeEntry(e.id);
              }}><Trash2 size={12} /></button>}
            </div>
          ))}
        </div>
      </div>

      {/* Expenses */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>Expenses</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExpForm(true)}><Plus size={14} /> Add</button>
        </div>
        {showExpForm && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8 }}>
            <input className="input" type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} />
            <input className="input" type="number" placeholder="Amount" value={expForm.amount || ''} onFocus={(e) => e.target.select()} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value === '' ? 0 : +e.target.value })} />
            <input className="input" placeholder="Description" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <select className="select" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Fees">Platform Fees</option>
                <option value="Other">Other (Custom)</option>
              </select>
              {expForm.category === 'Other' && (
                <input className="input" placeholder="Custom category..." value={expForm.customCategory || ''} onChange={(e) => setExpForm({ ...expForm, customCategory: e.target.value })} style={{ marginTop: '0.25rem' }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return toast('Not logged in', 'error');
                
                const finalCategory = expForm.category === 'Other' && expForm.customCategory ? expForm.customCategory : expForm.category;
                
                if (expForm.id) {
                  const { error } = await supabase.from('expense_entries').update({
                    date: expForm.date, amount: expForm.amount, category: finalCategory, description: expForm.description
                  }).eq('id', expForm.id);
                  if (error) return toast(`DB Error: ${error.message}`, 'error');
                  updateExpenseEntry(expForm.id, { date: expForm.date, amount: expForm.amount, category: finalCategory, description: expForm.description });
                  toast('Expense updated', 'success');
                } else {
                  const { data, error } = await supabase.from('expense_entries').insert({
                    user_id: user.id, date: expForm.date, amount: expForm.amount, category: finalCategory, description: expForm.description
                  }).select('id').single();
                  if (error) return toast(`DB Error: ${error.message}`, 'error');
                  addExpenseEntry({ id: data.id, date: expForm.date, amount: expForm.amount, category: finalCategory, description: expForm.description });
                  toast('Expense added', 'success');
                }
                setShowExpForm(false);
                setExpForm({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, category: 'Software', description: '' });
              }}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowExpForm(false); setExpForm({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, category: 'Software', description: '' }); }}><X size={13} /></button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {expenseEntries.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No expenses yet.</p>}
          {expenseEntries.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{e.date}</span>
              <span style={{ flex: 1, fontStyle: e.description ? 'normal' : 'italic', color: e.description ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {e.description || '-'}
              </span>
              <span className="badge badge-orange">{e.category}</span>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{settings.currency}{e.amount.toLocaleString()}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn-icon" onClick={() => { 
                  setExpForm({ id: e.id, date: e.date, amount: e.amount, category: e.category, description: e.description || '', customCategory: e.category }); 
                  setShowExpForm(true); 
                }}><Edit2 size={12} /></button>
                <button className="btn-icon" onClick={async () => {
                  await supabase.from('expense_entries').delete().eq('id', e.id);
                  removeExpenseEntry(e.id);
                }}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tax Tab ───────────────────────────────────────────────────────────────────
function TaxTab() {
  const { taxDeductionTypes, addTaxType, removeTaxType, expenseEntries, incomeEntries, queueCards, settings } = useAppStore();
  const { toast } = useToast();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<TaxDeductionType, 'id'>>({ name: '', type: 'percentage', value: 50, appliesToCategory: '' });

  const totalIncome = incomeEntries.filter(e => !e.isFromQueue).reduce((s, e) => s + e.amount, 0)
    + queueCards.filter((c) => c.paymentStatus === 'paid').reduce((s, c) => s + c.price * c.quantity, 0);
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);

  const totalDeductible = taxDeductionTypes.reduce((sum, t) => {
    const catExpenses = expenseEntries.filter((e) => !t.appliesToCategory || e.category === t.appliesToCategory)
      .reduce((s, e) => s + e.amount, 0);
    return sum + (t.type === 'percentage' ? catExpenses * t.value / 100 : Math.min(t.value, catExpenses));
  }, 0);

  const netTaxable = totalIncome - totalDeductible;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Income', value: `${settings.currency}${totalIncome.toLocaleString()}`, color: 'var(--success)' },
          { label: 'Total Deductible', value: `${settings.currency}${totalDeductible.toLocaleString()}`, color: 'var(--warning)' },
          { label: 'Net Taxable Income', value: `${settings.currency}${netTaxable.toLocaleString()}`, color: 'var(--accent)' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Deduction types */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700 }}>Tax Deduction Types</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Add</button>
        </div>
        {showForm && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8 }}>
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'flat' })}>
              <option value="percentage">%</option>
              <option value="flat">Flat</option>
            </select>
            <input className="input" type="number" placeholder="Value" value={form.value || ''} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, value: e.target.value === '' ? 0 : +e.target.value })} />
            <input className="input" placeholder="Category (optional)" value={form.appliesToCategory} onChange={(e) => setForm({ ...form, appliesToCategory: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary btn-sm" onClick={async () => { 
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return toast('Not logged in', 'error');
                const { data, error } = await supabase.from('tax_deduction_types').insert({
                  user_id: user.id, name: form.name, type: form.type, value: form.value, applies_to_category: form.appliesToCategory
                }).select('id').single();
                if (error) return toast(`DB Error: ${error.message}`, 'error');
                
                addTaxType({ id: data.id, ...form }); 
                setShowForm(false); 
                toast('Tax type added', 'success'); 
              }}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={13} /></button>
            </div>
          </div>
        )}
        {taxDeductionTypes.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No deduction types. Add some to calculate your tax estimate.</p>}
        {taxDeductionTypes.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span style={{ flex: 1, fontWeight: 600 }}>{t.name}</span>
            <span className="badge badge-orange">{t.value}{t.type === 'percentage' ? '%' : ` ${settings.currency}`}</span>
            {t.appliesToCategory && <span className="badge badge-gray">{t.appliesToCategory}</span>}
            <button className="btn-icon" onClick={async () => {
              await supabase.from('tax_deduction_types').delete().eq('id', t.id);
              removeTaxType(t.id);
            }}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
