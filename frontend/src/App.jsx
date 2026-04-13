import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// User Pages
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Category from './pages/Category';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import NewsList from './pages/admin/NewsList';
import NewsForm from './pages/admin/NewsForm';
import AdminRegister from './pages/admin/AdminRegister';
import ReportList from './pages/admin/ReportList';
import CommentReportList from './pages/admin/CommentReportList';
import PublisherManagement from './pages/admin/PublisherManagement';
import PublisherDashboard from './pages/admin/PublisherDashboard';
import ProtectedRoute from './components/ProtectedRoute';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/create" element={<NewsForm />} />
            <Route path="news/:id" element={<NewsForm />} />
            <Route path="publishers" element={<PublisherManagement />} />
            <Route path="publisher-dashboard" element={<PublisherDashboard />} />
            <Route path="reports" element={<ReportList />} />
            <Route path="comment-reports" element={<CommentReportList />} />
          </Route>
          {/* Auth Routes (No Navbar/Footer) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* User Routes (With Navbar/Footer) */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/news/:slug" element={<NewsDetail />} />
                      <Route path="/category/:category" element={<Category />} />
                      <Route path="/favorites" element={<Favorites />} />
                      <Route path="/profile" element={<Profile />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />

        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
