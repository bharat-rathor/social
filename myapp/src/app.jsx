import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { PeerProvider } from './context/PeerContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';

import { GroupProvider } from './context/GroupContext';
import { CallProvider } from './context/CallContext';

// Common Components
import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import ToastContainer from './components/common/ToastContainer';
import ProtectedRoute from './components/common/ProtectedRoute';
import PageLoader from './components/common/PageLoader';
import ErrorBoundary from './components/common/ErrorBoundary';
import CallModal from './components/chat/CallModal';

// Lazy-Loaded Pages for Optimal Bundle Size & Fast Initial Load
const Landing = React.lazy(() => import('./pages/Landing'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const CreateProfile = React.lazy(() => import('./pages/CreateProfile'));
const Home = React.lazy(() => import('./pages/Home'));
const Discover = React.lazy(() => import('./pages/Discover'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Likes = React.lazy(() => import('./pages/Likes'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Subscription = React.lazy(() => import('./pages/Subscription'));
const Payment = React.lazy(() => import('./pages/Payment'));
const MyProfile = React.lazy(() => import('./pages/MyProfile'));
const Settings = React.lazy(() => import('./pages/Settings'));

const AppLayout = () => {
  const { currentUser } = useAuth();

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="app-content" style={{ flex: 1 }}>
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={currentUser ? <Navigate to="/home" replace /> : <Landing />} />
            <Route path="/login" element={currentUser ? <Navigate to="/home" replace /> : <Login />} />
            <Route path="/register" element={currentUser ? <Navigate to="/create-profile" replace /> : <Register />} />

            {/* Protected Routes */}
            <Route path="/create-profile" element={
              <ProtectedRoute>
                <CreateProfile />
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/discover" element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            } />
            <Route path="/user/:id" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/chat/:userId" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/likes" element={
              <ProtectedRoute>
                <Likes />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </div>

      {currentUser && <BottomNav />}
      <ToastContainer />
      <CallModal />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <UserProvider>
          <PeerProvider>
            <SubscriptionProvider>
              <ChatProvider>
                <NotificationProvider>
                  <GroupProvider>
                    <CallProvider>
                      <ErrorBoundary>
                        <AppLayout />
                      </ErrorBoundary>
                    </CallProvider>
                  </GroupProvider>
                </NotificationProvider>
              </ChatProvider>
            </SubscriptionProvider>
          </PeerProvider>
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
