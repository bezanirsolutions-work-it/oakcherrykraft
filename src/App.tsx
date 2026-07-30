import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary, Layout } from './components/layout';
import { Home } from './pages/Home';
import { Login } from './pages/admin/Login';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

// Lazy-load non-critical public pages
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Configurator = lazy(() => import('./pages/Configurator').then(m => ({ default: m.Configurator })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Products = lazy(() => import('./pages/Products').then(m => ({ default: m.Products })));
const ProjectPortfolio = lazy(() => import('./pages/ProjectPortfolio').then(m => ({ default: m.ProjectPortfolio })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const QuoteRequest = lazy(() => import('./pages/QuoteRequest').then(m => ({ default: m.QuoteRequest })));

// Lazy-load admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const Quotes = lazy(() => import('./pages/admin/Quotes').then(m => ({ default: m.Quotes })));
const ConfiguratorRequests = lazy(() => import('./pages/admin/ConfiguratorRequests').then(m => ({ default: m.ConfiguratorRequests })));
const ProductsAdmin = lazy(() => import('./pages/admin/Products').then(m => ({ default: m.ProductsAdmin })));
const ProjectsAdmin = lazy(() => import('./pages/admin/Projects').then(m => ({ default: m.Projects })));
const Analytics = lazy(() => import('./pages/admin/AdminPagePlaceholder').then(m => ({ default: m.Analytics })));
const Contacts = lazy(() => import('./pages/admin/Contacts').then(m => ({ default: m.Contacts })));
const Settings = lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.Settings })));

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

const LoadingFallback = () => (
  <div className="flex h-96 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-bark/20 border-t-bark" />
  </div>
);

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location}>
          <Route element={<Layout />}>
            <Route
              index
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Home />
                </motion.div>
              }
            />
            <Route
              path="products"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Products />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="products/:category"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Products />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="products/:category/:slug"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductDetail />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="projects"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProjectPortfolio />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="projects/:slug"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProjectDetail />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="request-quote"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <QuoteRequest />
                  </Suspense>
                </motion.div>
              }
            />
            {/* Backwards compatibility: support old /quote link as alias */}
            <Route
              path="quote"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <QuoteRequest />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="configurator"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Configurator />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="configuration-selector"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Configurator />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="about"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <About />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="contact"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Contact />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="*"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <NotFound />
                  </Suspense>
                </motion.div>
              }
            />
          </Route>

          <Route
            path="/admin/login"
            element={
              <motion.div {...pageTransition} className="w-full">
                <Login />
              </motion.div>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Dashboard />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="quotes"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Quotes />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="configurator"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ConfiguratorRequests />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="contacts"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Contacts />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="products"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductsAdmin />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="projects"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <ProjectsAdmin />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="analytics"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Analytics />
                  </Suspense>
                </motion.div>
              }
            />
            <Route
              path="settings"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Suspense fallback={<LoadingFallback />}>
                    <Settings />
                  </Suspense>
                </motion.div>
              }
            />
          </Route>
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
