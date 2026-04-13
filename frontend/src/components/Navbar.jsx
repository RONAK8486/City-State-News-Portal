import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FiMenu, FiX, FiSearch, FiUser, FiLogOut, FiSettings, FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isAdmin, isPublisher, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = [
    'politics', 'business', 'technology', 'sports', 
    'entertainment', 'health', 'science', 'world'
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50" style={{minHeight: '72px'}}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            {/* Newspaper Icon */}
            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-primary-700 transition-colors duration-200">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3h5v2h-5V6zm0 4h5v2h-5v-2zm-6-4h4v6H6V6zm0 8h12v2H6v-2zm0 4h8v2H6v-2z"/>
              </svg>
            </div>
            {/* Brand Text */}
            <div className="flex flex-col leading-none gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-primary-600 tracking-tight">
                  City<span className="text-gray-300 font-light mx-0.5">·</span>State
                </span>
                <span className="text-3xl font-bold text-gray-800 tracking-tight">News</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">Portal</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <FiUser className="w-5 h-5" />
                  <span>{user?.name}</span>
                </button>
                <div className="absolute right-0 top-full pt-1 w-48 hidden group-hover:block transition-all duration-200">
                  <div className="bg-white rounded-lg shadow-lg shadow-blue-900/10 py-2 border border-blue-50">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <FiSettings className="mr-3 text-blue-500" /> Admin Panel
                      </Link>
                    )}
                    {isPublisher && (
                      <Link
                        to="/admin/publisher-dashboard"
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <FiSettings className="mr-3 text-blue-500" /> Publisher Panel
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <FiUser className="mr-3 text-blue-500" /> My Profile
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                      <FiHeart className="mr-3 text-blue-500" /> Favorites
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="mr-3" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Categories Bar */}
        <div className="hidden md:flex space-x-7 py-2.5 border-t border-gray-100 overflow-x-auto">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/category/${category}`}
              className="text-sm font-medium text-gray-500 hover:text-primary-600 capitalize whitespace-nowrap transition-colors duration-150 pb-0.5 border-b-2 border-transparent hover:border-primary-500"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t">
          <form onSubmit={handleSearch} className="p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </form>
          <div className="px-4 py-2 space-y-2">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/category/${category}`}
                className="block py-2 text-gray-600 capitalize"
                onClick={() => setIsOpen(false)}
              >
                {category}
              </Link>
            ))}
          </div>
          <div className="px-4 py-4 border-t">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block py-2 text-gray-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                {isPublisher && (
                  <Link
                    to="/admin/publisher-dashboard"
                    className="block py-2 text-gray-600"
                    onClick={() => setIsOpen(false)}
                  >
                    Publisher Panel
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block py-2 text-gray-600"
                  onClick={() => setIsOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/favorites"
                  className="block py-2 text-gray-600"
                  onClick={() => setIsOpen(false)}
                >
                  Favorites
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-600"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
