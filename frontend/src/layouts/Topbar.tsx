import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();

  const initials = user?.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-breadcrumb">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name}</span>
            <span className="topbar-user-role">{user?.role}</span>
          </div>
          <div className="avatar">{initials}</div>
        </div>
      </div>
    </header>
  );
}
