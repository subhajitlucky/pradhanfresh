import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/layout/ErrorBoundary';
import {
  CartLifecycle,
  RedirectIfAuthed,
  RequireAdmin,
  RequireAuth,
  RouteEffects,
} from './components/layout/routing';
import { ToastProvider } from './components/ui/Feedback';

// Public
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Shop
const Products = lazy(() => import('./pages/products/Products'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const Cart = lazy(() => import('./pages/cart/Cart'));
const Checkout = lazy(() => import('./pages/checkout/Checkout'));

// Account
const Orders = lazy(() => import('./pages/orders/Orders'));
const OrderDetail = lazy(() => import('./pages/orders/OrderDetail'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProductForm = lazy(() => import('./pages/admin/ProductForm'));

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-ink-3">
        Loading…
      </p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <CartLifecycle />
          <div className="relative z-[1] flex min-h-dvh flex-col">
            <Navbar />
            <main id="main" className="flex-1 outline-none">
              <RouteEffects>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />

                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route
                      path="/checkout"
                      element={
                        <RequireAuth>
                          <Checkout />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/orders"
                      element={
                        <RequireAuth>
                          <Orders />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/orders/:orderNumber"
                      element={
                        <RequireAuth>
                          <OrderDetail />
                        </RequireAuth>
                      }
                    />

                    <Route
                      path="/login"
                      element={
                        <RedirectIfAuthed>
                          <Login />
                        </RedirectIfAuthed>
                      }
                    />
                    <Route
                      path="/signup"
                      element={
                        <RedirectIfAuthed>
                          <Signup />
                        </RedirectIfAuthed>
                      }
                    />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route
                      path="/profile"
                      element={
                        <RequireAuth>
                          <Profile />
                        </RequireAuth>
                      }
                    />

                    {/* Admin. The dashboard reads the path to pick its initial tab. */}
                    <Route
                      path="/admin"
                      element={
                        <RequireAdmin>
                          <AdminDashboard />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/admin/products"
                      element={
                        <RequireAdmin>
                          <AdminDashboard />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/admin/categories"
                      element={
                        <RequireAdmin>
                          <AdminDashboard />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <RequireAdmin>
                          <AdminDashboard />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/admin/products/new"
                      element={
                        <RequireAdmin>
                          <AdminProductForm />
                        </RequireAdmin>
                      }
                    />
                    <Route
                      path="/admin/products/edit/:id"
                      element={
                        <RequireAdmin>
                          <AdminProductForm />
                        </RequireAdmin>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </RouteEffects>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
