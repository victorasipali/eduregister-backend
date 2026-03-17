import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authService } from '../services/api'
import {
  PageHeader, Modal, FormField, LoadingPage, EmptyState,
  SearchInput, Select, Spinner, ConfirmDialog,
} from '../components/layout/UI'
import { fmt, getInitials, roleBadgeClass, getErrorMessage } from '../utils/helpers'

export default function UsersPage() {
  const qc = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [roleF,   setRoleF]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [delUser, setDelUser] = useState(null)

  const { data, isLoading } = useQuery(
    ['users', search, roleF],
    () => authService.users({ search, role: roleF || undefined }).then(r => {
      const d = r.data; return d?.results ?? d ?? []
    })
  )

  const deleteMutation = useMutation(
    (id) => authService.deleteUser(id),
    {
      onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries('users'); setDelUser(null) },
      onError:   (err) => toast.error(getErrorMessage(err)),
    }
  )

  const users = data ?? []

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
        }
      />

      <div className="flex gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
        <Select value={roleF} onChange={e => setRoleF(e.target.value)} style={{ width: 160 }}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="registrar">Registrars</option>
        </Select>
      </div>

      {isLoading ? <LoadingPage /> : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700
                                      flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getInitials(u.full_name)}
                      </div>
                      <span className="font-medium">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{u.email}</td>
                  <td><span className={roleBadgeClass(u.role)}>{u.role}</span></td>
                  <td className="text-slate-500">{u.phone || '—'}</td>
                  <td>
                    <span className={u.is_active ? 'badge-green' : 'badge-red'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400">{fmt.date(u.created_at)}</td>
                  <td>
                    <button
                      className="btn-ghost btn-sm text-red-500 hover:text-red-700"
                      onClick={() => setDelUser(u)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { qc.invalidateQueries('users'); setShowAdd(false) }}
        />
      )}

      <ConfirmDialog
        open={!!delUser}
        onClose={() => setDelUser(null)}
        onConfirm={() => deleteMutation.mutate(delUser.id)}
        loading={deleteMutation.isLoading}
        title="Delete User"
        message={`Are you sure you want to delete "${delUser?.full_name}"? This action cannot be undone.`}
      />
    </div>
  )
}

function AddUserModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  async function onSubmit(data) {
    setLoading(true)
    try {
      await authService.createUser(data)
      toast.success('User created!')
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Add New User" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required error={errors.first_name?.message}>
            <input className="input" {...register('first_name', { required: 'Required' })} />
          </FormField>
          <FormField label="Last Name" required error={errors.last_name?.message}>
            <input className="input" {...register('last_name', { required: 'Required' })} />
          </FormField>
        </div>

        <FormField label="Email" required error={errors.email?.message}>
          <input type="email" className="input" {...register('email', { required: 'Required' })} />
        </FormField>

        <FormField label="Role" required error={errors.role?.message}>
          <select className="input" {...register('role', { required: 'Required' })}>
            <option value="">Select role…</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="registrar">Registrar</option>
          </select>
        </FormField>

        <FormField label="Phone">
          <input className="input" {...register('phone')} />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <input
            type="password"
            className="input"
            {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
          />
        </FormField>

        <FormField label="Confirm Password" required error={errors.password2?.message}>
          <input
            type="password" className="input"
            {...register('password2', { required: 'Required' })}
          />
        </FormField>

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Creating…</> : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
