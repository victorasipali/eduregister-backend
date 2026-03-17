import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { studentService, feeService } from '../services/api'
import {
  LoadingPage, FeeProgress, Modal, FormField, Spinner,
} from '../components/layout/UI'
import { fmt, statusBadgeClass, getInitials, getErrorMessage } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isRegistrar } = useAuth()
  const [showPayment, setShowPayment] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { data: student, isLoading } = useQuery(
    ['student', id],
    () => studentService.detail(id).then(r => r.data)
  )
  const { data: feeRecords } = useQuery(
    ['fee-records', id],
    () => feeService.records({ student: id }).then(r => {
      const d = r.data; return d?.results ?? d ?? []
    })
  )

  const registerMutation = useMutation(
    () => studentService.register(id),
    {
      onSuccess: () => {
        toast.success('Student registered successfully!')
        qc.invalidateQueries(['student', id])
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    }
  )

  if (isLoading) return <LoadingPage />
  if (!student)  return <p className="text-slate-500">Student not found.</p>

  const feeSummary = student.fee_summary ?? {}

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/students')}>← Back</button>
      </div>

      <div className="card flex items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700
                        flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {getInitials(student.full_name)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-900">{student.full_name}</h1>
              <p className="text-sm text-slate-400 mt-0.5 font-mono">{student.student_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={statusBadgeClass(student.status)}>{student.status}</span>
              {student.is_registered
                ? <span className="badge-green text-sm">✓ Registered</span>
                : <span className="badge-red text-sm">Not Registered</span>
              }
              {isRegistrar && !student.is_registered && (
                <button
                  className="btn-success btn-sm"
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isLoading}
                >
                  {registerMutation.isLoading ? 'Registering…' : 'Register Now'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
            <InfoItem label="Email"    value={student.email} />
            <InfoItem label="Phone"    value={student.phone || '—'} />
            <InfoItem label="Program"  value={student.program_name} />
            <InfoItem label="Year"     value={`Year ${student.year_level}`} />
            <InfoItem label="Gender"   value={student.gender} />
            <InfoItem label="DOB"      value={fmt.date(student.date_of_birth)} />
            <InfoItem label="Guardian" value={student.guardian_name || '—'} />
            <InfoItem label="Enrolled" value={fmt.date(student.enrolled_at)} />
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-slate-800">Fee Summary</h2>
          {isRegistrar && (
            <button className="btn-primary btn-sm" onClick={() => { setSelectedRecord(null); setShowPayment(true) }}>
              + Record Payment
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 rounded-xl bg-slate-50">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Due</p>
            <p className="text-xl font-display font-bold text-slate-900 mt-1">{fmt.money(feeSummary.total_due)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-50">
            <p className="text-xs text-emerald-500 uppercase tracking-wider">Paid</p>
            <p className="text-xl font-display font-bold text-emerald-600 mt-1">{fmt.money(feeSummary.total_paid)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50">
            <p className="text-xs text-red-400 uppercase tracking-wider">Balance</p>
            <p className="text-xl font-display font-bold text-red-500 mt-1">{fmt.money(feeSummary.balance)}</p>
          </div>
        </div>

        <FeeProgress percentage={feeSummary.percentage ?? 0} />
      </div>

      {/* Fee Records */}
      {feeRecords?.length > 0 && (
        <div className="card">
          <h2 className="font-display font-bold text-slate-800 mb-4">Fee Records</h2>
          <div className="space-y-3">
            {feeRecords.map(record => (
              <div key={record.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{record.fee_type_name}</p>
                    <p className="text-xs text-slate-400">{record.academic_year} · Due {fmt.date(record.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{fmt.money(record.total_fee)}</p>
                    <span className={record.status === 'paid' ? 'badge-green' : record.status === 'partial' ? 'badge-yellow' : 'badge-red'}>
                      {record.status}
                    </span>
                  </div>
                </div>
                <FeeProgress percentage={record.payment_percentage} />

                {/* Payment history */}
                {record.payments?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    {record.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono">{p.receipt_number}</span>
                        <span>{fmt.datetime(p.payment_date)}</span>
                        <span className={p.payment_method === 'cash' ? 'badge-green' : 'badge-blue'}>
                          {p.payment_method}
                        </span>
                        <span className="font-semibold text-emerald-600">{fmt.money(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isRegistrar && (
                  <button
                    className="btn-ghost btn-sm mt-2"
                    onClick={() => { setSelectedRecord(record); setShowPayment(true) }}
                  >
                    + Add Payment
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && (
        <PaymentModal
          studentId={id}
          record={selectedRecord}
          feeRecords={feeRecords ?? []}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            qc.invalidateQueries(['fee-records', id])
            qc.invalidateQueries(['student', id])
            setShowPayment(false)
          }}
        />
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5 capitalize">{value}</p>
    </div>
  )
}

function PaymentModal({ studentId, record, feeRecords, onClose, onSuccess }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { fee_record: record?.id ?? '', payment_method: 'cash' }
  })
  const [loading, setLoading] = useState(false)
  const method = watch('payment_method')

  async function onSubmit(data) {
    setLoading(true)
    try {
      await feeService.createPayment({ ...data, amount: parseFloat(data.amount) })
      toast.success('Payment recorded!')
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!record && (
          <FormField label="Fee Record" required error={errors.fee_record?.message}>
            <select className="input" {...register('fee_record', { required: 'Required' })}>
              <option value="">Select fee record…</option>
              {feeRecords.filter(r => r.status !== 'paid').map(r => (
                <option key={r.id} value={r.id}>
                  {r.fee_type_name} · Balance: {fmt.money(r.balance)}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="Amount" required error={errors.amount?.message}>
          <input
            type="number" step="0.01" min="0.01"
            className="input"
            {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be positive' } })}
          />
        </FormField>

        <FormField label="Payment Method" required>
          <div className="flex gap-3">
            {['cash', 'card'].map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={m} {...register('payment_method')} />
                <span className="text-sm font-medium capitalize">
                  {m === 'cash' ? '💵 Cash' : '💳 Card'}
                </span>
              </label>
            ))}
          </div>
        </FormField>

        {method === 'card' && (
          <>
            <FormField label="Card Last 4 Digits" required error={errors.card_last_four?.message}>
              <input
                maxLength={4} placeholder="1234"
                className="input"
                {...register('card_last_four', { required: 'Required for card', pattern: { value: /^\d{4}$/, message: '4 digits only' } })}
              />
            </FormField>
            <FormField label="Card Type">
              <select className="input" {...register('card_type')}>
                <option value="">Select…</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">American Express</option>
              </select>
            </FormField>
            <FormField label="Reference / Auth Number">
              <input className="input" {...register('reference_number')} />
            </FormField>
          </>
        )}

        <FormField label="Notes">
          <textarea className="input" rows={2} {...register('notes')} />
        </FormField>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Processing…</> : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
