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

  [...queueCards.filter((c) => c.paymentStatus === 'paid').map((c) => ({
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
  [...queueCards.filter((c) => c.paymentStatus === 'paid').map((c) => ({
    date: c.commissionDate,
    amount: c.price * c.quantity,
    isFromQueue: true,
  }))].forEach((e) => {
    const key = format(startOfMonth(parseISO(e.date)), 'MMM yy');
    monthlyMap[key] = (monthlyMap[key] || 0) + e.amount;
  });
  const monthlyData = Object.entries(monthlyMap).map(([month, income]) => ({ month, income })).slice(-12);

  const commissionIncomeTotal = queueCards
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((s, c) => s + (c.price * c.quantity), 0);
  
  const manualIncomeTotal = incomeEntries
    .filter(e => !e.isFromQueue)
    .reduce((s, e) => s + e.amount, 0);

  const accountingTotalIncome = commissionIncomeTotal + manualIncomeTotal;
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
            <div className="grid-responsive-3">
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
            {[
              { label: 'Commission Income', value: `${settings.currency}${commissionIncomeTotal.toLocaleString()}`, color: 'var(--success)' },
              { label: 'Total Commissions', value: queueCards.length, color: '#fbbf24' },
            ].map((s) => (
              <div key={s.label} className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem' }}>
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

          <div className="grid-responsive-3" style={{ gap: '1.5rem' }}>
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
  const { incomeEntries, addIncomeEntry, updateIncomeEntry, removeIncomeEntry, expenseEntries, addExpenseEntry, removeExpenseEntry, updateExpenseEntry, taxDeductionTypes, queueCards, settings, workTypes } = useAppStore();
  const { toast } = useToast();
  const supabase = createClient();
  const [showIncForm, setShowIncForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [incForm, setIncForm] = useState<{ id?: string, date: string, amount: number, source: string, category: string }>({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, source: '', category: 'Other' });
  const [expForm, setExpForm] = useState<{ id?: string, date: string, amount: number, category: string, description: string, customCategory?: string }>({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, category: 'Software', description: '' });

  const commissionIncomeTotal = queueCards
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((s, c) => s + (c.price * c.quantity), 0);
  
  const manualIncomeTotal = incomeEntries
    .filter(e => !e.isFromQueue)
    .reduce((s, e) => s + e.amount, 0);

  const accountingTotalIncome = commissionIncomeTotal + manualIncomeTotal;
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);

  const totalDeductible = taxDeductionTypes.reduce((sum, t) => {
    let amount = 0;
    if (t.appliesToCategory) {
       amount = expenseEntries.filter((e) => e.category === t.appliesToCategory).reduce((s, e) => s + e.amount, 0);
    } else if (t.type === 'percentage') {
       amount = (accountingTotalIncome * t.value / 100);
    } else {
       amount = t.value;
    }
    let effective = amount * (t.multiplier || 1);
    if (t.maxLimit && t.maxLimit > 0) effective = Math.min(effective, t.maxLimit);
    return sum + effective;
  }, 0);

  const queueIncome = queueCards.filter(c => c.paymentStatus === 'paid').map(c => ({
    id: `q-${c.id}`,
    date: c.commissionDate,
    amount: c.price * c.quantity,
    source: `Order: ${c.customerName} (${workTypes.find(w => w.id === c.workTypeId)?.title || c.workTypeId})`,
    category: 'Commission',
    isFromQueue: true
  }));
  
  const manualIncome = incomeEntries.filter((e) => !e.isFromQueue);
  const allIncome = [...manualIncome, ...queueIncome].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Financial Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 23);
    const pdfCurrency = settings.currency === '฿' ? 'THB ' : settings.currency;
    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Source/Description', 'Category', 'Amount']],
      body: allIncome.map((e) => [e.date, e.source, e.category, `${pdfCurrency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [99, 102, 241] },
    });
    const afterIncome = (doc as any).lastAutoTable.finalY + 8;
    doc.text('Expenses', 14, afterIncome);
    autoTable(doc, {
      startY: afterIncome + 4,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: expenseEntries.map((e) => [e.date, e.description, e.category, `${pdfCurrency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [168, 85, 247] },
    });
    doc.save('financial-report.pdf');
    toast('PDF exported!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Cards from Tax Tab */}
      <div className="grid-responsive-4">
        {[
          { label: 'Total Business Income', value: `${settings.currency}${accountingTotalIncome.toLocaleString()}`, color: 'var(--success)' },
          { label: 'Total Expenses', value: `${settings.currency}${totalExpenses.toLocaleString()}`, color: 'var(--danger)' },
          { label: 'Net Profit', value: `${settings.currency}${(accountingTotalIncome - totalExpenses).toLocaleString()}`, color: 'var(--accent)' },
          { label: 'Total Deductible', value: `${settings.currency}${totalDeductible.toLocaleString()}`, color: 'var(--warning)' },
          { label: 'Net Taxable Income', value: `${settings.currency}${(accountingTotalIncome - totalDeductible).toLocaleString()}`, color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

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
                
                if (incForm.id) {
                  const { error } = await supabase.from('income_entries').update({
                    date: incForm.date, amount: incForm.amount, source: incForm.source, category: incForm.category
                  }).eq('id', incForm.id);
                  if (error) return toast(`DB Error: ${error.message}`, 'error');
                  updateIncomeEntry(incForm.id, { date: incForm.date, amount: incForm.amount, source: incForm.source, category: incForm.category });
                  toast('Income updated', 'success');
                } else {
                  const { data, error } = await supabase.from('income_entries').insert({
                    user_id: user.id, date: incForm.date, amount: incForm.amount, source: incForm.source, category: incForm.category, is_from_queue: false
                  }).select('id').single();
                  if (error) return toast(`DB Error: ${error.message}`, 'error');
                  addIncomeEntry({ id: data.id, date: incForm.date, amount: incForm.amount, source: incForm.source, category: incForm.category, isFromQueue: false });
                  toast('Income added', 'success');
                }
                
                setShowIncForm(false);
                setIncForm({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, source: '', category: 'Other' });
              }}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowIncForm(false); setIncForm({ date: format(new Date(), 'yyyy-MM-dd'), amount: 0, source: '', category: 'Other' }); }}><X size={13} /></button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {allIncome.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No income entries yet.</p>}
          {allIncome.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{e.date}</span>
              <span style={{ flex: 1 }}>{e.source}</span>
              <span className="badge badge-purple">{e.category}</span>
              {e.isFromQueue && <span className="badge badge-gray">Queue</span>}
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{settings.currency}{e.amount.toLocaleString()}</span>
              {!e.isFromQueue && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn-icon" onClick={() => {
                    setIncForm({ id: e.id, date: e.date, amount: e.amount, source: e.source, category: e.category });
                    setShowIncForm(true);
                  }}><Edit2 size={12} /></button>
                  <button className="btn-icon" onClick={async () => {
                    await supabase.from('income_entries').delete().eq('id', e.id);
                    removeIncomeEntry(e.id);
                  }}><Trash2 size={12} /></button>
                </div>
              )}
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
const TAX_PRESETS = [
  { name: 'Personal (ส่วนตัว)', value: 60000, type: 'flat' as const, multiplier: 1 },
  { name: 'Social Security (ประกันสังคม)', value: 9000, type: 'flat' as const, multiplier: 1, maxLimit: 9000 },
  { name: 'Life Insurance (ประกันชีวิต)', value: 0, type: 'flat' as const, multiplier: 1, maxLimit: 100000 },
  { name: 'Parent Support (เลี้ยงดูพ่อแม่)', value: 30000, type: 'flat' as const, multiplier: 1 },
  { name: 'Child Allowance (บุตร)', value: 30000, type: 'flat' as const, multiplier: 1 },
  { name: 'SSF (กองทุน)', value: 0, type: 'percentage' as const, value_percent: 30, multiplier: 1, maxLimit: 200000 },
  { name: 'RMF (กองทุน)', value: 0, type: 'percentage' as const, value_percent: 30, multiplier: 1, maxLimit: 500000 },
  { name: 'Mortgage Interest (ดอกเบี้ยบ้าน)', value: 0, type: 'flat' as const, multiplier: 1, maxLimit: 100000 },
  { name: 'Education Donation (บริจาคการศึกษา)', value: 0, type: 'flat' as const, multiplier: 2, maxLimit: 0 },
  { name: 'General Donation (บริจาคทั่วไป)', value: 0, type: 'flat' as const, multiplier: 1, maxLimit: 0 },
];

function TaxTab() {
  const { taxDeductionTypes, addTaxType, removeTaxType, expenseEntries, incomeEntries, queueCards, settings, workTypes } = useAppStore();
  const { toast } = useToast();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'flat' as 'percentage' | 'flat', value: 0, appliesToCategory: '', multiplier: 1, maxLimit: 0 });

  const commissionIncomeTotal = queueCards
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((s, c) => s + (c.price * c.quantity), 0);
  
  const manualIncomeTotal = incomeEntries
    .filter(e => !e.isFromQueue)
    .reduce((s, e) => s + e.amount, 0);

  const accountingTotalIncome = commissionIncomeTotal + manualIncomeTotal;
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0);

  const totalDeductible = taxDeductionTypes.reduce((sum, t) => {
    let amount = 0;
    if (t.appliesToCategory) {
       amount = expenseEntries.filter((e) => e.category === t.appliesToCategory).reduce((s, e) => s + e.amount, 0);
    } else if (t.type === 'percentage') {
       amount = (accountingTotalIncome * t.value / 100);
    } else {
       amount = t.value;
    }
    let effective = amount * (t.multiplier || 1);
    if (t.maxLimit && t.maxLimit > 0) effective = Math.min(effective, t.maxLimit);
    return sum + effective;
  }, 0);

  const netTaxable = Math.max(0, accountingTotalIncome - totalDeductible);

  // ── Progressive Tax Calculation (Thailand) ──────────────────────────────────
  const calculateTax = (taxable: number) => {
    const brackets = [
      { min: 0, max: 150000, rate: 0 },
      { min: 150001, max: 300000, rate: 0.05 },
      { min: 300001, max: 500000, rate: 0.10 },
      { min: 500001, max: 750000, rate: 0.15 },
      { min: 750001, max: 1000000, rate: 0.20 },
      { min: 1000001, max: 2000000, rate: 0.25 },
      { min: 2000001, max: 5000000, rate: 0.30 },
      { min: 5000001, max: Infinity, rate: 0.35 },
    ];

    let remaining = taxable;
    let totalTax = 0;
    const breakdown = [];

    for (const b of brackets) {
      if (remaining <= 0) break;
      const bracketRange = b.max - b.min + 1;
      const taxableInBracket = Math.min(remaining, bracketRange);
      const tax = taxableInBracket * b.rate;
      
      if (taxableInBracket > 0) {
        breakdown.push({
          range: `${b.min.toLocaleString()} - ${b.max === Infinity ? 'More' : b.max.toLocaleString()}`,
          rate: `${(b.rate * 100).toFixed(0)}%`,
          taxable: taxableInBracket,
          tax: tax
        });
      }
      
      totalTax += tax;
      remaining -= taxableInBracket;
    }

    return { totalTax, breakdown };
  };

  const { totalTax, breakdown: taxBreakdown } = calculateTax(netTaxable);

  const queueIncome = queueCards.filter(c => c.paymentStatus === 'paid').map(c => ({
    id: `q-${c.id}`,
    date: c.commissionDate,
    amount: c.price * c.quantity,
    source: `Order: ${c.customerName} (${workTypes.find(w => w.id === c.workTypeId)?.title || c.workTypeId})`,
    category: 'Commission',
    isFromQueue: true
  }));
  
  const manualIncome = incomeEntries.filter((e) => !e.isFromQueue);
  const allIncome = [...manualIncome, ...queueIncome].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pdfCurrency = settings.currency === '฿' ? 'THB ' : settings.currency;
    
    doc.setFontSize(16);
    doc.text('Tax & Financial Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 23);

    // Summary Section
    doc.setFontSize(12);
    doc.text('Executive Summary', 14, 32);
    autoTable(doc, {
      startY: 35,
      head: [['Description', 'Amount']],
      body: [
        ['ESTIMATED TAX TO PAY', `${pdfCurrency}${totalTax.toLocaleString()}`],
        ['Total Business Income', `${pdfCurrency}${accountingTotalIncome.toLocaleString()}`],
        ['Total Expenses', `${pdfCurrency}${totalExpenses.toLocaleString()}`],
        ['Net Profit', `${pdfCurrency}${(accountingTotalIncome - totalExpenses).toLocaleString()}`],
        ['Net Taxable Income', `${pdfCurrency}${netTaxable.toLocaleString()}`],
        ['Total Deductions/Allowances', `${pdfCurrency}${totalDeductible.toLocaleString()}`],
      ],
      headStyles: { fillColor: [239, 68, 68] },
      styles: { cellPadding: 3 }
    });

    // Tax Breakdown
    const afterSum = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Thailand Progressive Tax Brackets Breakdown', 14, afterSum);
    autoTable(doc, {
      startY: afterSum + 4,
      head: [['Bracket', 'Rate', 'Taxable Amount', 'Tax']],
      body: taxBreakdown.map(b => [b.range, b.rate, `${pdfCurrency}${b.taxable.toLocaleString()}`, `${pdfCurrency}${b.tax.toLocaleString()}`]),
      headStyles: { fillColor: [168, 85, 247] },
    });

    // Income History
    doc.addPage();
    doc.text('Income History', 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Source', 'Category', 'Amount']],
      body: allIncome.map(e => [e.date, e.source, e.category, `${pdfCurrency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Expense History
    const afterInc = (doc as any).lastAutoTable.finalY + 10;
    if (afterInc > 250) doc.addPage();
    const expStart = afterInc > 250 ? 20 : afterInc + 5;
    doc.text('Expense History', 14, expStart);
    autoTable(doc, {
      startY: expStart + 5,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: expenseEntries.map(e => [e.date, e.description, e.category, `${pdfCurrency}${e.amount.toLocaleString()}`]),
      headStyles: { fillColor: [147, 51, 234] },
    });

    doc.save('tax-report.pdf');
    toast('Tax PDF exported!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary */}
      <div className="grid-responsive-4">
        {[
          { label: 'Estimated Tax', value: `${settings.currency}${totalTax.toLocaleString()}`, color: '#ef4444' },
          { label: 'Total Business Income', value: `${settings.currency}${accountingTotalIncome.toLocaleString()}`, color: 'var(--success)' },
          { label: 'Total Expenses', value: `${settings.currency}${totalExpenses.toLocaleString()}`, color: 'var(--danger)' },
          { label: 'Net Profit', value: `${settings.currency}${(accountingTotalIncome - totalExpenses).toLocaleString()}`, color: 'var(--accent)' },
          { label: 'Net Taxable Income', value: `${settings.currency}${netTaxable.toLocaleString()}`, color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Tax Breakdown Table */}
          <div className="glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
               <h3 style={{ fontWeight: 700, color: 'var(--accent)' }}>Tax Calculation Breakdown</h3>
               <button className="btn btn-ghost btn-sm" onClick={exportPDF}><Download size={14} /> Export Tax PDF</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Step 1: Total Annual Income</span>
                  <span style={{ fontWeight: 600 }}>{settings.currency}{accountingTotalIncome.toLocaleString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Step 2: Total Deductions & Allowances</span>
                  <span style={{ fontWeight: 600, color: 'var(--danger)' }}>- {settings.currency}{totalDeductible.toLocaleString()}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(168,85,247,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 700 }}>Step 3: Net Taxable Income</span>
                  <span style={{ fontWeight: 700, color: '#a855f7' }}>{settings.currency}{netTaxable.toLocaleString()}</span>
               </div>
            </div>

            <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
               <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                     <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem' }}>Income Bracket</th>
                     <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>Rate</th>
                     <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>Taxable Amount</th>
                     <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>Tax</th>
                  </tr>
               </thead>
               <tbody>
                  {taxBreakdown.length > 0 ? taxBreakdown.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                       <td style={{ padding: '0.75rem 0.5rem' }}>{b.range}</td>
                       <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}><span className="badge badge-purple">{b.rate}</span></td>
                       <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>{settings.currency}{b.taxable.toLocaleString()}</td>
                       <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: b.tax > 0 ? 'var(--danger)' : 'inherit' }}>
                          {b.tax > 0 ? `${settings.currency}${b.tax.toLocaleString()}` : 'Exempted'}
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No taxable income yet.
                       </td>
                    </tr>
                  )}
               </tbody>
               {taxBreakdown.length > 0 && (
                 <tfoot>
                    <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                       <td colSpan={3} style={{ padding: '1rem 0.5rem', fontWeight: 700, textAlign: 'right' }}>Total Estimated Tax:</td>
                       <td style={{ padding: '1rem 0.5rem', fontWeight: 800, textAlign: 'right', color: '#ef4444', fontSize: '1.1rem' }}>
                          {settings.currency}{totalTax.toLocaleString()}
                       </td>
                    </tr>
                 </tfoot>
               )}
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {/* Tax Guide Table */}
           <div className="glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 📋 Thailand Tax Brackets
              </h3>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {[
                   { range: '0 - 150,000', rate: '0% (Exempt)', color: 'var(--text-muted)' },
                   { range: '150,001 - 300,000', rate: '5%', color: 'var(--success)' },
                   { range: '300,001 - 500,000', rate: '10%', color: 'var(--warning)' },
                   { range: '500,001 - 750,000', rate: '15%', color: 'var(--accent)' },
                   { range: '750,001 - 1,000,000', rate: '20%', color: '#6366f1' },
                   { range: '1,000,001 - 2,000,000', rate: '25%', color: '#8b5cf6' },
                   { range: '2,000,001 - 5,000,000', rate: '30%', color: '#ec4899' },
                   { range: 'Over 5,000,000', rate: '35%', color: '#f43f5e' },
                 ].map(row => (
                   <div key={row.range} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                      <span>{row.range}</span>
                      <span style={{ fontWeight: 700, color: row.color }}>{row.rate}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Deductions helper */}
           <div className="glass" style={{ padding: '1.5rem', background: 'rgba(168,85,247,0.03)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>💡 Pro Tip</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 Add your personal allowances, social security, and other deductions below to lower your taxable income. 
                 The system will automatically recalculate your estimated tax.
              </p>
           </div>
        </div>
      </div>

      {/* Deduction types */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontWeight: 700 }}>Tax Deductions & Allowances</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Add your personal allowances, insurance, and donations here.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <select className="select select-sm" style={{ width: 'auto' }} onChange={(e) => {
                const preset = TAX_PRESETS.find(p => p.name === e.target.value);
                if (preset) {
                   setForm({ 
                     name: preset.name.split(' (')[0], 
                     type: preset.type, 
                     value: (preset as any).value_percent || preset.value, 
                     appliesToCategory: '',
                     multiplier: preset.multiplier,
                     maxLimit: preset.maxLimit || 0
                   });
                   setShowForm(true);
                }
             }}>
                <option value="">Quick Add Preset...</option>
                {TAX_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
             </select>
             <button className="btn btn-primary btn-sm" onClick={() => {
                setForm({ name: '', type: 'flat', value: 0, appliesToCategory: '', multiplier: 1, maxLimit: 0 });
                setShowForm(true);
             }}><Plus size={14} /> Custom</button>
          </div>
        </div>
        
        {showForm && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8 }}>
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'flat' })}>
              <option value="percentage">% of Income</option>
              <option value="flat">Fixed Amount</option>
            </select>
            <input className="input" type="number" placeholder="Value/Rate" value={form.value || ''} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, value: e.target.value === '' ? 0 : +e.target.value })} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
               <span style={{ fontSize: '0.7rem' }}>x</span>
               <input className="input" type="number" placeholder="Mult" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: +e.target.value })} />
            </div>
            <input className="input" type="number" placeholder="Max Limit" value={form.maxLimit || ''} onChange={(e) => setForm({ ...form, maxLimit: +e.target.value })} />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary btn-sm" onClick={async () => { 
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return toast('Not logged in', 'error');
                
                const { data, error } = await supabase.from('tax_deduction_types').insert({
                  user_id: user.id, name: form.name, type: form.type, value: form.value, applies_to_category: form.appliesToCategory || null,
                  multiplier: form.multiplier, max_limit: form.maxLimit
                }).select('id').single();
                
                if (error) return toast(`DB Error: ${error.message}`, 'error');
                
                addTaxType({ id: data.id, ...form }); 
                setShowForm(false); 
                toast('Deduction added', 'success'); 
              }}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={13} /></button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {taxDeductionTypes.map((t) => {
             let amount = 0;
             if (t.appliesToCategory) {
               amount = expenseEntries.filter((e) => e.category === t.appliesToCategory)
                 .reduce((s, e) => s + e.amount, 0);
             } else if (t.type === 'percentage') {
                amount = (accountingTotalIncome * t.value / 100);
             } else {
               amount = t.value;
             }
             let effective = amount * (t.multiplier || 1);
             if (t.maxLimit && t.maxLimit > 0) effective = Math.min(effective, t.maxLimit);

             return (
               <div key={t.id} className="glass" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontWeight: 600 }}>{t.name}</span>
                   <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {t.type === 'percentage' ? `${t.value}% of income` : `${settings.currency}${t.value.toLocaleString()}`}
                      {t.multiplier && t.multiplier > 1 ? ` x ${t.multiplier}` : ''}
                      {t.maxLimit ? ` (Max ${settings.currency}${t.maxLimit.toLocaleString()})` : ''}
                   </span>
                 </div>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <span style={{ fontWeight: 700, color: 'var(--danger)' }}>- {settings.currency}{effective.toLocaleString()}</span>
                   <button className="btn-icon" onClick={async () => {
                     await supabase.from('tax_deduction_types').delete().eq('id', t.id);
                     removeTaxType(t.id);
                   }}><Trash2 size={14} /></button>
                 </div>
               </div>
             );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
         {/* Income Table (from Ledger) */}
         <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Income History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
               {allIncome.map((e: any) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{e.source}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.date} • {e.category}</div>
                     </div>
                     <span style={{ fontWeight: 700, color: 'var(--success)' }}>{settings.currency}{e.amount.toLocaleString()}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Expense Table (from Ledger) */}
         <div className="glass" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Expense History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
               {expenseEntries.map((e) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{e.description}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.date} • {e.category}</div>
                     </div>
                     <span style={{ fontWeight: 700, color: 'var(--danger)' }}>- {settings.currency}{e.amount.toLocaleString()}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
