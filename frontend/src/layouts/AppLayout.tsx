import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':      { title: 'Dashboard',      subtitle: 'Overview & key metrics' },
  '/customers':      { title: 'Customers',       subtitle: 'CRM & follow-up management' },
  '/customers/new':  { title: 'New Customer',    subtitle: 'Add a new customer' },
  '/products':       { title: 'Products',        subtitle: 'Product catalog management' },
  '/products/new':   { title: 'New Product',     subtitle: 'Add a new product' },
  '/inventory':      { title: 'Inventory',       subtitle: 'Stock levels & movements' },
  '/challans':       { title: 'Sales Challans',  subtitle: 'Challan management' },
  '/challans/new':   { title: 'New Challan',     subtitle: 'Create a sales challan' },
  '/stock-movements':{ title: 'Stock Log',       subtitle: 'All stock movements' },
};

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const pathKey = Object.keys(PAGE_TITLES).find(k => location.pathname.startsWith(k));
  const pageInfo = pathKey
    ? PAGE_TITLES[pathKey]
    : { title: 'Mini ERP', subtitle: '' };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
