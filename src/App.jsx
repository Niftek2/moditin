import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import TrafficAnalytics from '@/lib/TrafficAnalytics'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SchoolsDistricts from './pages/SchoolsDistricts';
import AudioManagement from './pages/AudioManagement';
import FerpaDpa from './pages/FerpaDpa';
import DistrictManagerDashboard from './pages/DistrictManagerDashboard';
import DemoSignups from './pages/DemoSignups';
import QuotesAdmin from './pages/QuotesAdmin';


const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Securing Session…</p>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to our custom Join page instead of platform login
      window.location.replace('/Join');
      return null;
    }
  }

  // Immediately redirect managers to their dashboard — synchronous, no flash
  if (user?.role === 'manager' && window.location.pathname !== '/DistrictManagerDashboard') {
    window.location.replace('/DistrictManagerDashboard');
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/SchoolsDistricts" element={<SchoolsDistricts />} />
      <Route path="/DistrictManagerDashboard" element={<DistrictManagerDashboard />} />
      <Route path="/DemoSignups" element={<DemoSignups />} />
      <Route path="/FerpaDpa" element={<FerpaDpa />} />
      <Route path="/QuotesAdmin" element={<QuotesAdmin />} />
      <Route path="/AudioManagement" element={<AudioManagement />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <TrafficAnalytics />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App