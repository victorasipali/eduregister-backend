import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials, roleBadgeClass } from '../../utils/helpers'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',         label: 'Dashboard',  icon: '📊', roles: ['registrar','teacher','student'] },
  { to: '/students', label: 'Students',   icon: '🎓', roles: ['registrar','teacher'] },
  { to: '/fees',     label: 'Fee Records',icon: '💳', roles: ['registrar'] },
  { to: '/payments', label: 'Payments',   icon: '💰', roles: ['registrar'] },
  { to: '/courses',  label: 'Courses',    icon: '📚', roles: ['registrar','teacher'] },
  { to: '/users',    label: 'Users',      icon: '👥', roles: ['registrar'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visibleNav = NAV.filter(n => n.roles.includes(user?.role))

  async function handleLogout() {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="flex flex-col w-[260px] flex-shrink-0 bg-white border-r border-slate-100 h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-base font-display font-bold shadow-sm shadow-brand-200">
              E
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 leading-none text-base">Angoram School Register</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">School Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
              }
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center
                            justify-center text-xs font-bold flex-shrink-0">
              {getInitials(user?.full_name ?? '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
              <span className={`${roleBadgeClass(user?.role)} mt-0.5`}>{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-red-500 transition-colors text-base"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
