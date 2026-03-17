import { useState } from 'react'
import { useQuery } from 'react-query'
import { feeService } from '../services/api'
import { PageHeader, LoadingPage, EmptyState, Select } from '../components/layout/UI'
import { fmt } from '../utils/helpers'

export default function PaymentsPage() {
  const [methodF, setMethodF] = useState('')

  const { data, isLoading } = useQuery(
    ['payments', methodF],
    () => feeService.payments({ method: methodF || undefined }).then(r => {
      const d = r.data; return d?.results ?? d ?? []
    }),
    { keepPreviousData: true }
  )

  const payments = data ?? []

  const totalCash = payments.filter(p => p.payment_method === 'cash' && p.payment_status === 'completed')
                            .reduce((s, p) => s + parseFloat(p.amount), 0)
  const totalCard = payments.filter(p => p.payment_method === 'card' && p.payment_status === 'completed')
                            .reduce((s, p) => s + parseFloat(p.amount), 0)

  return (
    <div>
      <PageHeader title="Payment Transactions" subtitle="All recorded payment transactions" />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="card text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-display font-bold text-slate-900 mt-1">{payments.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-emerald-500 uppercase tracking-wider">💵 Cash</p>
          <p className="text-2xl font-display font-bold text-emerald-600 mt-1">{fmt.money(totalCash)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-blue-500 uppercase tracking-wider">💳 Card</p>
          <p className="text-2xl font-display font-bold text-blue-600 mt-1">{fmt.money(totalCard)}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <Select value={methodF} onChange={e => setMethodF(e.target.value)} style={{ width: 160 }}>
          <option value="">All methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </Select>
      </div>

      {isLoading ? <LoadingPage /> : payments.length === 0 ? (
        <EmptyState icon="💰" title="No payments" message="Payments will appear here once recorded." />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Card Info</th>
                <th>Date</th>
                <th>Processed By</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td><span className="font-mono text-xs text-brand-600">{p.receipt_number}</span></td>
                  <td>
                    <p className="font-medium">{p.fee_record_student_name ?? '—'}</p>
                  </td>
                  <td className="font-bold text-emerald-600 text-base">{fmt.money(p.amount)}</td>
                  <td>
                    <span className={p.payment_method === 'cash' ? 'badge-green' : 'badge-blue'}>
                      {p.payment_method === 'cash' ? '💵 Cash' : '💳 Card'}
                    </span>
                  </td>
                  <td>
                    <span className={
                      p.payment_status === 'completed' ? 'badge-green' :
                      p.payment_status === 'failed'    ? 'badge-red'   :
                      p.payment_status === 'refunded'  ? 'badge-yellow' : 'badge-slate'
                    }>{p.payment_status}</span>
                  </td>
                  <td className="text-xs text-slate-400">
                    {p.payment_method === 'card'
                      ? `${p.card_type || ''} ••••${p.card_last_four}`
                      : '—'
                    }
                  </td>
                  <td className="text-slate-400 text-xs">{fmt.datetime(p.payment_date)}</td>
                  <td className="text-sm">{p.processed_by_name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
