import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";
import Checkout from "./pages/Checkout";
import B2B from "./pages/B2B";
import Auth from "./pages/Auth";
import BookDetail from "./pages/BookDetail";
import Download from "./pages/Download";
import OrderSuccess from "./pages/OrderSuccess";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Leads from "./pages/admin/Leads";
import B2BLeads from "./pages/admin/B2BLeads";
import Analytics from "./pages/admin/Analytics";
import EnhancedDashboard from "./pages/admin/EnhancedDashboard";
import Bookings from "./pages/admin/Bookings";
import FAQEdit from "./pages/admin/FAQEdit";
import ServicesAdmin from "./pages/admin/ServicesAdmin";
import CompanyInfo from "./pages/admin/CompanyInfo";
import Invoices from "./pages/admin/Invoices";
import EmailManagement from "./pages/admin/EmailManagement";
import SzamlazzSettings from "./pages/admin/SzamlazzSettings";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import ShippingAdmin from "./pages/admin/ShippingAdmin";
import Unsubscribe from "./pages/Unsubscribe";
import { AuthProvider } from "./contexts/AuthContext";
import { TrackingWrapper } from "./components/TrackingWrapper";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/checkout/:slug" element={<Checkout />} />
            <Route path="/b2b" element={<B2B />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/download/:token" element={<Download />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="b2b-leads" element={<B2BLeads />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="enhanced" element={<EnhancedDashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="faq" element={<FAQEdit />} />
              <Route path="services" element={<ServicesAdmin />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="company" element={<CompanyInfo />} />
              <Route path="email" element={<EmailManagement />} />
              <Route path="szamlazz" element={<SzamlazzSettings />} />
              <Route path="products" element={<ProductsAdmin />} />
              <Route path="orders" element={<OrdersAdmin />} />
              <Route path="shipping" element={<ShippingAdmin />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;