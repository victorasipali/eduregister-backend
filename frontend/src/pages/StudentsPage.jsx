import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { studentService } from '../services/api'
import {
  PageHeader, Modal, FormField, FeeProgress, EmptyState,
  LoadingPage, SearchInput, Select, Spinner,
} from '../components/layout/UI'
import { fmt, statusBadgeClass, getErrorMessage, getInitials } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'

export default function StudentsPage() {
  const { isRegistrar } = useAuth()
  const qc = useQueryClient()
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [showAdd,  setShowAdd]  = useState(false)

  const { data: studentsData, isLoading } = useQuery(
    ['students', search, statusF],
    () => studentService.list({ search, status: statusF || undefined }).then(r => r.data),
    { keepPreviousData: true }
  )
  const { data: programs } = useQuery('programs', () => studentService.programs().then(r => r.data))
  const { data: years }    = useQuery('academic-years', () => studentService.academicYears().then(r => r.data))

  const students = studentsData?.results ?? studentsData ?? []

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student${students.length !== 1 ? 's' : ''}`}
        action={isRegistrar && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + Add Student
          </button>
        )}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID…" />
        <Select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: 160 }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      {isLoading ? <LoadingPage /> : students.length === 0 ? (
        <EmptyState icon="🎓" title="No students found" message="Try adjusting your search or add a new student." />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Program</th>
                <th>Year</th>
                <th>Fees Paid</th>
                <th>Registered</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700
                                      flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(s.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{s.full_name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-xs">{s.student_number}</span></td>
                  <td>
                    <span className="badge-blue">{s.program_code}</span>
                  </td>
                  <td className="text-center">{s.year_level}</td>
                  <td style={{ minWidth: 140 }}>
                    <FeeProgress percentage={s.fee_summary?.percentage ?? 0} />
                  </td>
                  <td className="text-center">
                    {s.is_registered
                      ? <span className="badge-green">✓ Yes</span>
                      : <span className="badge-red">✗ No</span>
                    }
                  </td>
                  <td>
                    <span className={statusBadgeClass(s.status)}>{s.status}</span>
                  </td>
                  <td>
                    <Link to={`/students/${s.id}`} className="btn-ghost btn-sm">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          programs={programs?.results ?? programs ?? []}
          years={years?.results ?? years ?? []}
          onSuccess={() => {
            qc.invalidateQueries('students')
            setShowAdd(false)
          }}
        />
      )}
    </div>
  )
}

function AddStudentModal({ onClose, programs, years, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  async function onSubmit(data) {
    setLoading(true)
    try {
      await studentService.create(data)
      toast.success('Student added successfully!')
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add New Student" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required error={errors.first_name?.message}>
            <input className="input" {...register('first_name', { required: 'Required' })} />
          </FormField>
          <FormField label="Last Name" required error={errors.last_name?.message}>
            <input className="input" {...register('last_name', { required: 'Required' })} />
          </FormField>
          <FormField label="Email" required error={errors.email?.message}>
            <input type="email" className="input" {...register('email', { required: 'Required' })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register('phone')} />
          </FormField>
          <FormField label="Date of Birth" required error={errors.date_of_birth?.message}>
            <input type="date" className="input" {...register('date_of_birth', { required: 'Required' })} />
          </FormField>
          <FormField label="Gender" required error={errors.gender?.message}>
            <select className="input" {...register('gender', { required: 'Required' })}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Program" required error={errors.program?.message}>
            <select className="input" {...register('program', { required: 'Required' })}>
              <option value="">Select program…</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Academic Year" required error={errors.academic_year?.message}>
            <select className="input" {...register('academic_year', { required: 'Required' })}>
              <option value="">Select year…</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </FormField>
          <FormField label="Year Level">
            <input type="number" min="1" max="6" defaultValue="1" className="input" {...register('year_level')} />
          </FormField>
          <FormField label="Guardian Name">
            <input className="input" {...register('guardian_name')} />
          </FormField>
          <div className="col-span-2">
            <FormField label="Address">
              <textarea className="input" rows={2} {...register('address')} />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Saving…</> : 'Add Student'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
