import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { courseService, studentService, authService } from '../services/api'
import {
  PageHeader, Modal, FormField, LoadingPage, EmptyState,
  SearchInput, Spinner, ConfirmDialog,
} from '../components/layout/UI'
import { getErrorMessage } from '../utils/helpers'
import { useAuth } from '../contexts/AuthContext'

export default function CoursesPage() {
  const { isRegistrar } = useAuth()
  const qc = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [delCourse, setDelCourse] = useState(null)

  const { data, isLoading } = useQuery(
    ['courses', search],
    () => courseService.list({ search }).then(r => { const d = r.data; return d?.results ?? d ?? [] })
  )

  const deleteMutation = useMutation(
    (id) => courseService.delete(id),
    {
      onSuccess: () => { toast.success('Course deleted'); qc.invalidateQueries('courses'); setDelCourse(null) },
      onError:   (err) => toast.error(getErrorMessage(err)),
    }
  )

  const courses = data ?? []

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} course${courses.length !== 1 ? 's' : ''}`}
        action={isRegistrar && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Course</button>
        )}
      />

      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search courses…" />
      </div>

      {isLoading ? <LoadingPage /> : courses.length === 0 ? (
        <EmptyState icon="📚" title="No courses" message="Add courses to start building your curriculum." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge-blue mb-2">{c.code}</span>
                  <h3 className="font-display font-bold text-slate-900 mt-1">{c.name}</h3>
                </div>
                {isRegistrar && (
                  <button
                    className="btn-ghost btn-sm text-red-400"
                    onClick={() => setDelCourse(c)}
                  >✕</button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description || 'No description.'}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div><span className="text-slate-400">Program:</span> {c.program_name}</div>
                <div><span className="text-slate-400">Year:</span> Year {c.year_level}</div>
                <div><span className="text-slate-400">Units:</span> {c.units}</div>
                <div><span className="text-slate-400">Students:</span> {c.student_count}</div>
              </div>
              {c.teacher_name && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  👩‍🏫 {c.teacher_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCourseModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { qc.invalidateQueries('courses'); setShowAdd(false) }}
        />
      )}

      <ConfirmDialog
        open={!!delCourse}
        onClose={() => setDelCourse(null)}
        onConfirm={() => deleteMutation.mutate(delCourse.id)}
        loading={deleteMutation.isLoading}
        title="Delete Course"
        message={`Delete "${delCourse?.name}"? This cannot be undone.`}
      />
    </div>
  )
}

function AddCourseModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const { data: programs } = useQuery('programs',
    () => studentService.programs().then(r => { const d = r.data; return d?.results ?? d ?? [] })
  )
  const { data: teachers } = useQuery('teachers',
    () => authService.users({ role: 'teacher' }).then(r => { const d = r.data; return d?.results ?? d ?? [] })
  )

  async function onSubmit(data) {
    setLoading(true)
    try {
      await courseService.create(data)
      toast.success('Course created!')
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add New Course" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Course Code" required error={errors.code?.message}>
            <input className="input" placeholder="CS101" {...register('code', { required: 'Required' })} />
          </FormField>
          <FormField label="Units" required>
            <input type="number" min="1" max="6" defaultValue="3" className="input" {...register('units')} />
          </FormField>
        </div>

        <FormField label="Course Name" required error={errors.name?.message}>
          <input className="input" {...register('name', { required: 'Required' })} />
        </FormField>

        <FormField label="Description">
          <textarea className="input" rows={2} {...register('description')} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Program" required error={errors.program?.message}>
            <select className="input" {...register('program', { required: 'Required' })}>
              <option value="">Select…</option>
              {(programs ?? []).map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </FormField>
          <FormField label="Year Level">
            <input type="number" min="1" max="6" defaultValue="1" className="input" {...register('year_level')} />
          </FormField>
        </div>

        <FormField label="Assign Teacher">
          <select className="input" {...register('teacher')}>
            <option value="">None</option>
            {(teachers ?? []).map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </FormField>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Saving…</> : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
