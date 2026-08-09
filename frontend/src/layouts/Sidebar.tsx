import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICON_MAP: Record<string, string> = {
  dashboard: '⊞',
  customers: '👥',
  products:  '📦',
  inventory: '🏪',
  challans:  '📋',
  movements: '📈',
};

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard',    icon: ICON_MAP.dashboard },
  { to: '/customers', label: 'Customers',    icon: ICON_MAP.customers,  roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { to: '/products',  label: 'Products',     icon: ICON_MAP.products,   roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] },
  { to: '/inventory', label: 'Inventory',    icon: ICON_MAP.inventory,  roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] },
  { to: '/challans',  label: 'Challans',     icon: ICON_MAP.challans,   roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  { to: '/stock-movements', label: 'Stock Log', icon: ICON_MAP.movements, roles: ['ADMIN', 'WAREHOUSE', 'SALES'] },
];

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏢</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">Mini ERP</span>
          <span className="sidebar-logo-subtitle">Operations Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main Menu</span>
        {NAV_ITEMS.map(item => {
          if (item.roles && !hasRole(...(item.roles as Parameters<typeof hasRole>))) {
            return null;
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div className="avatar" title={user?.name}>{initials}</div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary w-full" onClick={handleLogout}>
          <span>⎋</span> Logout
        </button>
      </div>
    </aside>
  );
}
