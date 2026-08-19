import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary, Layout } from './components/layout';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/admin/Login').then(m => ({ default: m.Login })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const ProtectedRoute = lazy(() => import('./components/admin/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));

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
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));

// Lazy-load admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const Quotes = lazy(() => import('./pages/admin/Quotes').then(m => ({ default: m.Quotes })));
const ConfiguratorRequests = lazy(() => import('./pages/admin/ConfiguratorRequests').then(m => ({ default: m.ConfiguratorRequests })));
const ProductsAdmin = lazy(() => import('./pages/admin/Products').then(m => ({ default: m.ProductsAdmin })));
const ProjectsAdmin = lazy(() => import('./pages/admin/Projects').then(m => ({ default: m.Projects })));
const Analytics = lazy(() => import('./pages/admin/AdminPagePlaceholder').then(m => ({ default: m.Analytics })));
const TestimonialsAdmin = lazy(() => import('./pages/admin/Testimonials').then(m => ({ default: m.Testimonials })));
const Contacts = lazy(() => import('./pages/admin/Contacts').then(m => ({ default: m.Contacts })));
const LiveChatAdmin = lazy(() => import('./pages/admin/LiveChat').then(m => ({ default: m.default })));
const Settings = lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.Settings })));

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={null}>
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
                  <div className="w-full">
                    <Products />
                  </div>
                }
              />
              <Route
                path="products/:category"
                element={
                  <div className="w-full">
                    <Products />
                  </div>
                }
              />
              <Route
                path="products/:category/:slug"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProductDetail />
                  </motion.div>
                }
              />
              <Route
                path="projects"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProjectPortfolio />
                  </motion.div>
                }
              />
              <Route
                path="gallery"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProjectPortfolio />
                  </motion.div>
                }
              />
              <Route
                path="projects/:slug"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProjectDetail />
                  </motion.div>
                }
              />
              <Route
                path="request-quote"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <QuoteRequest />
                  </motion.div>
                }
              />
              {/* Backwards compatibility: support old /quote link as alias */}
              <Route
                path="quote"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <QuoteRequest />
                  </motion.div>
                }
              />
              <Route
                path="configurator"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Configurator />
                  </motion.div>
                }
              />
              <Route
                path="configuration-selector"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Configurator />
                  </motion.div>
                }
              />
              <Route
                path="about"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <About />
                  </motion.div>
                }
              />
              <Route
                path="contact"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Contact />
                  </motion.div>
                }
              />
              <Route
                path="privacy-policy"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <PrivacyPolicy />
                  </motion.div>
                }
              />
              <Route
                path="terms"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Terms />
                  </motion.div>
                }
              />
              <Route
                path="*"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <NotFound />
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
                    <Dashboard />
                  </motion.div>
                }
              />
              <Route
                path="quotes"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Quotes />
                  </motion.div>
                }
              />
              <Route
                path="configurator"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ConfiguratorRequests />
                  </motion.div>
                }
              />
              <Route
                path="testimonials"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <TestimonialsAdmin />
                  </motion.div>
                }
              />
              <Route
                path="contacts"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Contacts />
                  </motion.div>
                }
              />
              <Route
                path="products"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProductsAdmin />
                  </motion.div>
                }
              />
              <Route
                path="projects"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <ProjectsAdmin />
                  </motion.div>
                }
              />
              <Route
                path="analytics"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Analytics />
                  </motion.div>
                }
              />
              <Route
                path="settings"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <Settings />
                  </motion.div>
                }
              />
              <Route
                path="live-chat"
                element={
                  <motion.div {...pageTransition} className="w-full">
                    <LiveChatAdmin />
                  </motion.div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
