import { useEffect } from "react";
import { createBrowserRouter, Link, NavLink, Outlet, redirect, useNavigate, useRouteError } from "react-router-dom";
import { ArrowRight, ClipboardList, LogOut, ShoppingBag, Store } from "lucide-react";
import { hydrateSession, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import SellerPage from "./pages/SellerPage";
import CartPage from "./pages/CartPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";

async function requireSession({ request }) {
  const session = await hydrateSession();
  if (!session?.token) {
    const returnTo = new URL(request.url).pathname;
    throw redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return session;
}

async function redirectSignedInUser() {
  const session = await hydrateSession();
  if (session?.token) throw redirect("/");
  return null;
}

async function requireSeller(args) {
  const session = await requireSession(args);
  if (session.user?.role !== "seller") throw redirect("/");
  return session;
}

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
        {user && <NavLink to="/" end>Shop</NavLink>}
        {user && <NavLink to="/cart"><ShoppingBag size={16} /> Bag</NavLink>}
        {user && <NavLink to="/orders"><ClipboardList size={16} /> Orders</NavLink>}
        {user?.role === "seller" && <NavLink to="/seller"><Store size={16} /> Studio</NavLink>}
      </nav>
      <div className="nav-account">
        {user ? (
          <>
            <span className="user-greeting">Hi, {user.name?.split(" ")[0] ?? "there"}</span>
            <button className="icon-button" onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={18} /></button>
          </>
        ) : (
          <Link className="nav-login" to="/login">Sign in <ArrowRight size={16} /></Link>
        )}
      </div>
    </header>
  );
}

function RouteErrorPage() {
  const error = useRouteError();
  const message = error?.status === 404
    ? "That page or piece could not be found."
    : "We couldn't load this page. Please try again.";

  return (
    <div className="route-error">
      <span className="eyebrow">A SMALL DETOUR</span>
      <h1>We lost the thread.</h1>
      <p>{message}</p>
      <Link className="button button-primary" to="/">Back to the collection <ArrowRight size={17} /></Link>
    </div>
  );
}

export function SessionFallback() {
  return <div className="app-shell"><div className="page-loading" role="status"><span className="loader" />Restoring your session...</div></div>;
}

function AppLayout() {
  const { loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle("session-ready", !loading);
  }, [loading]);

  if (loading) {
    return <SessionFallback />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main><Outlet /></main>
      <footer className="site-footer"><span>SNITCH / EVERYDAY, CONSIDERED</span><ShoppingBag size={15} /><span>Independent style, made easy.</span></footer>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    HydrateFallback: SessionFallback,
    children: [
      { path: "/login", loader: redirectSignedInUser, element: <AuthPage mode="login" /> },
      { path: "/register", loader: redirectSignedInUser, element: <AuthPage mode="register" /> },
      { path: "/", loader: requireSession, element: <ShopPage /> },
      { path: "/products/:id", loader: requireSession, element: <ProductPage /> },
      { path: "/cart", loader: requireSession, element: <CartPage /> },
      { path: "/orders", loader: requireSession, element: <OrdersPage /> },
      { path: "/seller", loader: requireSeller, element: <SellerPage /> },
      { path: "*", loader: () => redirect("/") },
    ],
  },
]);
