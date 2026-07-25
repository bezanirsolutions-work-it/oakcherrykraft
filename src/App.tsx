import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ErrorBoundary, Layout } from './components/layout';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Configurator } from './pages/Configurator';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { ProductDetail } from './pages/ProductDetail';
import { Products } from './pages/Products';
import { ProjectPortfolio } from './pages/ProjectPortfolio';
import { ProjectDetail } from './pages/ProjectDetail';
import { QuoteRequest } from './pages/QuoteRequest';
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Quotes } from './pages/admin/Quotes';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { Analytics, Contacts, Settings } from './pages/admin/AdminPagePlaceholder';
import { ProductsAdmin } from './pages/admin/Products';

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
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
                  <Products />
                </motion.div>
              }
            />
            <Route
              path="products/:category"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <Products />
                </motion.div>
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
              path="projects/:projectId"
              element={
                <motion.div {...pageTransition} className="w-full">
                  <ProjectDetail />
                </motion.div>
              }
            />
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
          </Route>
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
