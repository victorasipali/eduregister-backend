import { useQuery } from 'react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { authService, feeService } from '../services/api'
import { StatCard, LoadingPage, FeeProgress } from '../components/layout/UI'
import { fmt } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981']

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: stats,     isLoading: statsLoading }     = useQuery('dashboard', () => authService.dashboard().then(r => r.data))
  const { data: analytics, isLoading: analyticsLoading } = useQuery('fee-analytics', () => feeService.analytics().then(r => r.data), {
    enabled: user?.role !== 'student',
  })

  if (statsLoading) return <LoadingPage />

  const byStatus = analytics ? [
    { name: 'Unpaid',   value: analytics.by_status.unpaid,   color: '#ef4444' },
    { name: 'Partial',  value: analytics.by_status.partial,  color: '#f59e0b' },
    { name: 'Fully Paid',value: analytics.by_status.paid,   color: '#10b981' },
  ] : []

  const byMethod = analytics?.by_method ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Good {timeOfDay()}, {user?.first_name} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon="🎓" label="Total Students"
          value={stats?.total_students ?? 0}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon="✅" label="Registered"
          value={stats?.registered_students ?? 0}
          sub={`${stats?.pending_registration ?? 0} pending`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon="👩‍🏫" label="Teachers"
          value={stats?.total_teachers ?? 0}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon="💰" label="Fees Collected"
          value={fmt.money(stats?.total_fees_collected ?? 0)}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Charts row */}
      {user?.role !== 'student' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fee status donut */}
          <div className="card">
            <h3 className="font-display font-bold text-slate-800 mb-4">Fee Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {byStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Students']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment method bar */}
          <div className="card col-span-2">
            <h3 className="font-display font-bold text-slate-800 mb-1">Collections by Payment Method</h3>
            <p className="text-xs text-slate-400 mb-4">Total amount collected per method</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byMethod} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="payment_method" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [fmt.money(v), 'Collected']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fee overview */}
      {user?.role !== 'student' && analytics && (
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 mb-1">Revenue Overview</h3>
          <p className="text-xs text-slate-400 mb-5">Overall fee collection progress</p>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Billed</p>
              <p className="text-xl font-display font-bold text-slate-900">
                {fmt.money(analytics.totals?.total_billed ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Collected</p>
              <p className="text-xl font-display font-bold text-emerald-600">
                {fmt.money(analytics.totals?.total_collected ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Outstanding</p>
              <p className="text-xl font-display font-bold text-red-500">
                {fmt.money((analytics.totals?.total_billed ?? 0) - (analytics.totals?.total_collected ?? 0))}
              </p>
            </div>
          </div>

          <FeeProgress
            percentage={
              analytics.totals?.total_billed
                ? (analytics.totals.total_collected / analytics.totals.total_billed) * 100
                : 0
            }
            showLabel
          />
        </div>
      )}

      {/* Recent payments */}
      {user?.role !== 'student' && analytics?.recent_payments?.length > 0 && (
        <div className="card">
          <h3 className="font-display font-bold text-slate-800 mb-4">Recent Payments</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Processed By</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_payments.map(p => (
                  <tr key={p.id}>
                    <td><span className="font-mono text-xs">{p.receipt_number}</span></td>
                    <td className="font-semibold text-emerald-600">{fmt.money(p.amount)}</td>
                    <td>
                      <span className={p.payment_method === 'cash' ? 'badge-green' : 'badge-blue'}>
                        {p.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}
                      </span>
                    </td>
                    <td className="text-slate-400">{fmt.datetime(p.payment_date)}</td>
                    <td>{p.processed_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
