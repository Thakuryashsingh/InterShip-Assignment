import { useEffect, useState } from "react";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrderReceipts } from "../services/orders.js";

const amountLabel = (amount, currency) => {
  if (!currency) return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(() => getOrderReceipts(user.id));

  useEffect(() => {
    const updateOrders = () => setOrders(getOrderReceipts(user.id));
    window.addEventListener("snitch:orders-updated", updateOrders);
    return () => window.removeEventListener("snitch:orders-updated", updateOrders);
  }, [user.id]);

  return <section className="orders-page">
    <span className="eyebrow">YOUR ACCOUNT</span>
    <div className="orders-empty-icon"><ClipboardList size={26} /></div>
    <h1>Orders</h1>
    {orders.length === 0 ? <>
      <p>No order receipts are saved in this browser yet. Place an order from your bag to see its details here.</p>
      <Link className="text-link" to="/cart">View your bag <ArrowRight size={16} /></Link>
    </> : <>
      <p>Recent orders placed from this browser.</p>
      <div className="orders-list">{orders.map((order) => {
        const currencies = [...new Set(order.products.map((product) => product.currency).filter(Boolean))];
        const totalCurrency = currencies.length === 1 ? currencies[0] : null;
        return <article className="order-card" key={order._id}>
          <header className="order-card-header"><div><span className="eyebrow">ORDER</span><strong>{order._id}</strong></div><time dateTime={order.createdAt}>{order.createdAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)) : "Recently placed"}</time></header>
          <div className="order-lines">{order.products.map((product, index) => <div className="order-line" key={`${product.product}-${product.size}-${index}`}>
            {product.image ? <img src={product.image} alt="" /> : <div className="order-line-placeholder">S.</div>}
            <div className="order-line-details"><strong>{product.title}</strong><span>Size {product.size} · Qty {product.quantity}</span></div>
            <span className="order-line-total">{amountLabel(product.price * product.quantity, product.currency)}</span>
          </div>)}</div>
          <footer className="order-card-total"><span>Total</span><strong>{amountLabel(order.totalAmount, totalCurrency)}</strong></footer>
        </article>;
      })}</div>
      <Link className="text-link" to="/cart">View your bag <ArrowRight size={16} /></Link>
    </>}
  </section>;
}