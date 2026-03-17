import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { feeService, studentService } from '../services/api'
import {
  PageHeader, Modal, FormField, FeeProgress, LoadingPage,
  EmptyState, SearchInput, Select, Spinner,
} from '../components/layout/UI'
import { fmt, getErrorMessage } from '../utils/helpers'

export default function FeesPage() {
  const qc = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery(
    ['fee-records', search, statusF],
    () => feeService.records({ search, status: statusF || undefined }).then(r => {
      const d = r.data; return d?.results ?? d ?? []
    }),
    { keepPreviousData: true }
  )

  const records = data ?? []

  return (
    <div>
      <PageHeader
        title="Fee Records"
        subtitle={`${records.length} record${records.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + New Fee Record
          </button>
        }
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search student…" />
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: 160 }}>
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </Select>
      </div>

      {isLoading ? <LoadingPage /> : records.length === 0 ? (
        <EmptyState icon="💳" title="No fee records" message="Create a fee record for a student to start tracking." />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee Type</th>
                <th>Year</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>
                    <p className="font-medium text-slate-900">{r.student_name}</p>
                    <p className="text-xs font-mono text-slate-400">{r.student_number}</p>
                  </td>
                  <td>{r.fee_type_name}</td>
                  <td>{r.academic_year}</td>
                  <td className="font-semibold">{fmt.money(r.total_fee)}</td>
                  <td className="text-emerald-600 font-semibold">{fmt.money(r.amount_paid)}</td>
                  <td className="text-red-500 font-semibold">{fmt.money(r.balance)}</td>
                  <td style={{ minWidth: 130 }}>
                    <FeeProgress percentage={r.payment_percentage} showLabel={false} />
                    <p className="text-xs text-slate-400 mt-0.5">{fmt.pct(r.payment_percentage)}</p>
                  </td>
                  <td>
                    <span className={
                      r.status === 'paid'    ? 'badge-green' :
                      r.status === 'partial' ? 'badge-yellow' : 'badge-red'
                    }>{r.status}</span>
                  </td>
                  <td className="text-slate-400 text-xs">{fmt.date(r.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddFeeRecordModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { qc.invalidateQueries('fee-records'); setShowAdd(false) }}
        />
      )}
    </div>
  )
}

function AddFeeRecordModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const { data: students } = useQuery('students-list',
    () => studentService.list({ page_size: 200 }).then(r => { const d = r.data; return d?.results ?? d ?? [] })
  )
  const { data: feeTypes } = useQuery('fee-types',
    () => feeService.types().then(r => { const d = r.data; return d?.results ?? d ?? [] })
  )

  async function onSubmit(data) {
    setLoading(true)
    try {
      await feeService.createRecord(data)
      toast.success('Fee record created!')
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="New Fee Record" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Student" required error={errors.student?.message}>
          <select className="input" {...register('student', { required: 'Required' })}>
            <option value="">Select student…</option>
            {(students ?? []).map(s => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.student_number})</option>
            ))}
          </select>
        </FormField>

        <FormField label="Fee Type" required error={errors.fee_type?.message}>
          <select className="input" {...register('fee_type', { required: 'Required' })}>
            <option value="">Select fee type…</option>
            {(feeTypes ?? []).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Academic Year" required error={errors.academic_year?.message}>
            <input
              className="input" placeholder="2024-2025"
              {...register('academic_year', { required: 'Required' })}
            />
          </FormField>
          <FormField label="Total Fee" required error={errors.total_fee?.message}>
            <input
              type="number" step="0.01" min="0" className="input"
              {...register('total_fee', { required: 'Required' })}
            />
          </FormField>
        </div>

        <FormField label="Due Date" required error={errors.due_date?.message}>
          <input type="date" className="input" {...register('due_date', { required: 'Required' })} />
        </FormField>

        <FormField label="Notes">
          <textarea className="input" rows={2} {...register('notes')} />
        </FormField>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Creating…</> : 'Create Record'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
