import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ClipboardList, LogOut, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import SellerPage from "./pages/SellerPage";
import CartPage from "./pages/CartPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="topbar">
      <Link className="wordmark" to="/" aria-label="Snitch home">snitch<span>.</span></Link>
      <nav className="main-nav" aria-label="Main navigation">
        {user && <Link to="/">Shop</Link>}
        {user && <Link to="/cart"><ShoppingBag size={16} /> Bag</Link>}
        {user && <Link to="/orders"><ClipboardList size={16} /> Orders</Link>}
        {user?.role === "seller" && <Link to="/seller"><Store size={16} /> Studio</Link>}
      </nav>
      <div className="nav-account">
        {user ? (
          <>
            <span className="user-greeting">Hi, {user.name?.split(" ")[0]}</span>
            <button className="icon-button" onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={18} /></button>
          </>
        ) : (
          <Link className="nav-login" to="/login">Sign in <ArrowRight size={16} /></Link>
        )}
      </div>
    </header>
  );
}

function RequireAuth({ children, seller = false }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading"><span className="loader" />Checking your session</div>;
  if (!token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (seller && user?.role !== "seller") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { loading, token } = useAuth();
  useEffect(() => {
    document.documentElement.classList.toggle("session-ready", !loading);
  }, [loading]);

  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" replace /> : <AuthPage mode="login" />} />
          <Route path="/register" element={token ? <Navigate to="/" replace /> : <AuthPage mode="register" />} />
          <Route path="/" element={<RequireAuth><ShopPage /></RequireAuth>} />
          <Route path="/products/:id" element={<RequireAuth><ProductPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/seller" element={<RequireAuth seller><SellerPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer"><span>SNITCH / EVERYDAY, CONSIDERED</span><ShoppingBag size={15} /><span>Independent style, made easy.</span></footer>
    </div>
  );
}