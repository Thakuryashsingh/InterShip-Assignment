import { useEffect, useState } from "react";
import { ArrowLeft, CircleCheck, Package, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../axiosInstance/axiosInstance";

const priceLabel = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: price?.currency ?? "INR", maximumFractionDigits: 0 }).format(price?.amount ?? 0);

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [state, setState] = useState("loading");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get("/products")
      .then(({ data }) => {
        const found = data.data.products?.find((item) => item._id === id);
        setProduct(found ?? null);
        setState(found ? "ready" : "missing");
      })
      .catch(() => setState("error"));
  }, [id]);

  const addToCart = async () => {
    setCartMessage("");
    const availableSizes = product.sizes?.filter(({ stock }) => Number(stock) > 0) ?? [];
    const selectedSizeData = product.sizes?.find(({ size }) => size === selectedSize);
    const requestedQuantity = Number(quantity);

    if (!selectedSizeData || Number(selectedSizeData.stock) < 1) {
      setCartMessage(availableSizes.length ? "Choose an in-stock size first." : "This product is currently out of stock.");
      return;
    }
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > Number(selectedSizeData.stock)) {
      setCartMessage(`Choose a quantity between 1 and ${selectedSizeData.stock}.`);
      return;
    }

    setAdding(true);
    try {
      await api.post("/cart", {
        productID: product._id,
        quantity: requestedQuantity,
        size: selectedSize,
      });
      setCartMessage("Added to your bag.");
    } catch (error) {
      setCartMessage(error.response?.data?.message ?? "The existing cart endpoint could not add this item.");
    } finally {
      setAdding(false);
    }
  };

  if (state === "loading") return <div className="state-block"><span className="loader" />Loading piece...</div>;
  if (state !== "ready") return <div className="state-block state-error">{state === "missing" ? "This piece is not available in the current collection." : "Could not load this piece."}<Link className="text-link" to="/">Back to the collection <ArrowLeft size={16} /></Link></div>;

  const availableSizes = product.sizes?.filter(({ stock }) => Number(stock) > 0) ?? [];
  const selectedSizeStock = Number(product.sizes?.find(({ size }) => size === selectedSize)?.stock ?? 0);

  return <section className="detail-layout">
    <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to the edit</Link>
    <div className="detail-media">{product.images?.length ? product.images.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${product.title} view ${index + 1}`} />) : <div className="detail-no-image">SNITCH <span>—</span></div>}</div>
    <div className="detail-copy"><span className="eyebrow">THE SNITCH SELECTION</span><h1>{product.title}</h1><p className="detail-price">{priceLabel(product.price)}</p><p className="detail-description">{product.description}</p><div className="detail-rule" /><span className="eyebrow">AVAILABLE SIZES</span><div className="size-list">{product.sizes?.map(({ size, stock }) => <div className="size-row" key={size}><span>{size}</span><span>{stock > 0 ? <><CircleCheck size={15} /> In stock</> : "Out of stock"}</span></div>)}</div><div className="cart-add"><label className="field"><span>Size</span><select className="plain-input" value={selectedSize} onChange={(event) => { setSelectedSize(event.target.value); setCartMessage(""); }}><option value="">Choose a size</option>{product.sizes?.map(({ size, stock }) => <option key={size} value={size} disabled={Number(stock) < 1}>{size}{Number(stock) < 1 ? " · unavailable" : ""}</option>)}</select></label><label className="field"><span>Quantity</span><input className="plain-input" type="number" min="1" max={selectedSizeStock || undefined} value={quantity} onChange={(event) => { setQuantity(event.target.value); setCartMessage(""); }} /></label><button className="button button-primary" type="button" disabled={!availableSizes.length || adding} onClick={addToCart}>{adding ? "Adding..." : "Add to bag"}<ShoppingBag size={17} /></button>{!availableSizes.length && <p className="cart-message" role="status">This product is currently out of stock.</p>}{cartMessage && <p className="cart-message" role="status">{cartMessage}</p>}</div><div className="detail-footnote"><Package size={18} /><span>Thoughtfully picked for your everyday rotation.</span></div><p className="detail-api-note">Product information comes directly from the Snitch catalogue.</p></div>
  </section>;
}