import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../axiosInstance/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { saveOrderReceipt } from "../services/orders.js";

const priceLabel = (price) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: price?.currency ?? "INR",
  maximumFractionDigits: 0,
}).format(price?.amount ?? 0);

const getAvailabilityIssue = (item) => {
  if (item.serverAvailabilityIssue) return item.serverAvailabilityIssue;
  if (!item.details) return "Product details are unavailable.";

  const sizes = Array.isArray(item.details.sizes) ? item.details.sizes : [];
  const selectedSize = sizes.find((entry) => entry.size === item.size);
  if (!selectedSize) return `Size ${item.size} is no longer available.`;
  if (selectedSize.stock < item.quantity) {
    return selectedSize.stock > 0
      ? `Only ${selectedSize.stock} left in size ${item.size}.`
      : `Size ${item.size} is out of stock.`;
  }

  return "";
};

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/cart"), api.get("/products")])
      .then(([cartResponse, productsResponse]) => {
        const products = productsResponse.data.data.products ?? [];
        const productById = new Map(products.map((product) => [product._id, product]));
        const cartItems = cartResponse.data.data.cart.products ?? [];
        setItems(cartItems.map((item) => ({
          ...item,
          details: productById.get(String(item.product?._id ?? item.product)) ?? null,
        })));
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const placeOrder = async () => {
    setPlacingOrder(true);
    setOrderError("");
    try {
      const { data } = await api.post("/order/order");
      const order = data.data.order;
      const receipt = {
        ...order,
        products: order.products.map((line) => {
          const cartItem = items.find((item) =>
            String(item.product?._id ?? item.product) === String(line.product) && item.size === line.size
          );
          return {
            ...line,
            title: cartItem?.details?.title ?? "Product",
            image: cartItem?.details?.images?.[0] ?? null,
            currency: cartItem?.details?.price?.currency ?? null,
          };
        }),
      };
      saveOrderReceipt(user.id, receipt);
      window.dispatchEvent(new Event("snitch:orders-updated"));
      setItems([]);
      navigate("/orders");
    } catch (error) {
      const responseData = error.response?.data;
      const unavailableSize = responseData?.message?.match(/^Size (.+) is not available$/)?.[1];
      if (unavailableSize) {
        setItems((current) => current.map((item) => item.size === unavailableSize
          ? { ...item, serverAvailabilityIssue: responseData.message }
          : item));
      }
      setOrderError(
        responseData?.error
          ? `${responseData.message}: ${responseData.error}`
          : responseData?.message ?? "Could not place the order. Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const unavailableItems = items.filter((item) => getAvailabilityIssue(item));

  return <section className="cart-page">
    <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the edit</Link>
    <div className="cart-heading"><div><span className="eyebrow">YOUR SELECTION</span><h1>Your bag.</h1></div><ShoppingBag size={25} /></div>
    {state === "loading" && <div className="state-block"><span className="loader" />Loading your bag...</div>}
    {state === "error" && <div className="state-block state-error">Could not load your bag from the existing cart API.</div>}
    {state === "ready" && items.length === 0 && <div className="cart-empty"><p>Your bag is taking a breather.</p><Link className="text-link" to="/">Explore the collection <ArrowRight size={16} /></Link></div>}
    {state === "ready" && items.length > 0 && <>
      <div className="cart-items">{items.map((item, index) => <article className="cart-item" key={`${item.product?._id ?? item.product}-${item.size}-${index}`}>
        <div className="cart-image">{item.details?.images?.[0] ? <img src={item.details.images[0]} alt="" /> : <span>S.</span>}</div>
        <div className="cart-item-copy"><h2>{item.details?.title ?? "Product unavailable"}</h2><span>Size {item.size} · Qty {item.quantity}</span>{getAvailabilityIssue(item) && <span className="cart-item-issue">{getAvailabilityIssue(item)}</span>}</div>
        <strong>{item.details ? priceLabel(item.details.price) : "Unavailable"}</strong>
      </article>)}</div>
      {orderError && <p className="form-error order-error" role="alert">{orderError}</p>}
      <div className="order-checkout"><p>{unavailableItems.length ? "Some items no longer match the product sizes or stock. Update inventory before ordering." : "The order total and stock check are confirmed by the server when you place the order."}</p>{unavailableItems.length && user?.role === "seller" ? <Link className="button button-primary" to="/seller">Update inventory <ArrowRight size={17} /></Link> : <button className="button button-primary" type="button" disabled={placingOrder || unavailableItems.length > 0} onClick={placeOrder}>{placingOrder ? "Placing order..." : "Place order"}<ArrowRight size={17} /></button>}</div>
    </>}
  </section>;
}