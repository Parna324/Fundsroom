import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './layouts/AppLayout';

// Pages
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CustomersPage from './pages/Customers';
import CustomerDetailPage from './pages/CustomerDetail';
import CustomerFormPage from './pages/CustomerForm';
import ProductsPage from './pages/Products';
import ProductFormPage from './pages/ProductForm';
import InventoryPage from './pages/Inventory';
import StockMovementsPage from './pages/StockMovements';
import AllStockMovementsPage from './pages/AllStockMovements';
import ChallansPage from './pages/Challans';
import ChallanFormPage from './pages/ChallanForm';
import ChallanDetailPage from './pages/ChallanDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — wrapped in AppLayout */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Customers */}
              <Route path="/customers"         element={<CustomersPage />} />
              <Route path="/customers/new"     element={<CustomerFormPage />} />
              <Route path="/customers/:id"     element={<CustomerDetailPage />} />
              <Route path="/customers/:id/edit" element={<CustomerFormPage />} />

              {/* Products */}
              <Route path="/products"          element={<ProductsPage />} />
              <Route path="/products/new"      element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />

              {/* Inventory */}
              <Route path="/inventory"                          element={<InventoryPage />} />
              <Route path="/inventory/:productId/movements"    element={<StockMovementsPage />} />
              <Route path="/stock-movements"                    element={<AllStockMovementsPage />} />

              {/* Challans */}
              <Route path="/challans"       element={<ChallansPage />} />
              <Route path="/challans/new"   element={<ChallanFormPage />} />
              <Route path="/challans/:id"   element={<ChallanDetailPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
