import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ImagePlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../axiosInstance/axiosInstance";
import { useAuth } from "../context/AuthContext";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const sizeLimit = 1024 * 1024;
const serverMessage = (error) => error.response?.data?.message ?? "Request failed. Please try again.";
const displayPrice = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: price?.currency ?? "INR", maximumFractionDigits: 0 }).format(price?.amount ?? 0);

function ProductForm({ onCreated, onUpdated, onCancel, product = null }) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [amount, setAmount] = useState(product?.price?.amount ?? "");
  const [currency, setCurrency] = useState(product?.price?.currency ?? "INR");
  const [stock, setStock] = useState(() => Object.fromEntries(
    (product?.sizes ?? []).map(({ size, stock: quantity }) => [size, String(quantity)]),
  ));
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleSize = (size) => setStock((current) => {
    const next = { ...current };
    if (size in next) delete next[size];
    else next[size] = "0";
    return next;
  });

  const chooseFiles = (event) => {
    const chosen = Array.from(event.target.files ?? []);
    setError(chosen.length > 5 ? "Choose up to 5 images." : chosen.some((file) => file.size > sizeLimit) ? "Each image must be 1 MB or smaller." : "");
    setFiles(chosen.length <= 5 && chosen.every((file) => file.size <= sizeLimit) ? chosen : []);
  };

  const submit = async (event) => {
    event.preventDefault();
    const titlePattern = /^[A-Za-z ]+$/;
    if (title.trim().length < 2 || title.trim().length > 100 || !titlePattern.test(title.trim())) return setError("Title must be 2-100 letters and spaces only, matching the existing API validator.");
    if (description.trim().length < 20 || description.trim().length > 500) return setError("Description must be between 20 and 500 characters.");
    if (!Object.keys(stock).length) return setError("Select at least one size.");
    setBusy(true);
    setError("");
    const sizesPayload = Object.entries(stock).map(([size, quantity]) => ({ size, stock: Number(quantity) }));
    try {
      if (product) {
        await api.patch(`/products/update/${product._id}`, {
          title: title.trim(),
          description: description.trim(),
          price: { amount: Number(amount), currency },
          sizes: sizesPayload,
        });
        onUpdated();
      } else {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("price", JSON.stringify({ amount: Number(amount), currency }));
        formData.append("sizes", JSON.stringify(sizesPayload));
        files.forEach((file) => formData.append("images", file));
        await api.post("/products", formData);
        onCreated();
      }
    } catch (requestError) {
      setError(serverMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  return <form className="seller-form" onSubmit={submit}>
    <div className="form-section-title"><span className="eyebrow">{product ? "EDIT PIECE" : "NEW PIECE"}</span><span>Product details</span></div>
    <label className="field"><span>Title</span><input className="plain-input" value={title} onChange={(event) => setTitle(event.target.value)} minLength="2" maxLength="100" required placeholder="e.g. Classic Cotton Tee" /></label>
    <label className="field"><span>Description <small>{description.length}/500</small></span><textarea className="plain-input" value={description} onChange={(event) => setDescription(event.target.value)} minLength="20" maxLength="500" required rows="4" placeholder="What makes this piece worth reaching for?" /></label>
    <div className="form-pair"><label className="field"><span>Price</span><input className="plain-input" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label><label className="field"><span>Currency</span><select className="plain-input" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="INR">INR</option><option value="USD">USD</option></select></label></div>
    <fieldset className="size-picker"><legend>Sizes and stock</legend><div className="size-options">{sizes.map((size) => <label className={`size-choice ${size in stock ? "selected" : ""}`} key={size}><input type="checkbox" checked={size in stock} onChange={() => toggleSize(size)} /><span>{size}</span></label>)}</div>{Object.entries(stock).map(([size, quantity]) => <label className="stock-row" key={size}><span>{size} stock</span><input className="plain-input stock-input" type="number" min="0" step="1" value={quantity} onChange={(event) => setStock({ ...stock, [size]: event.target.value })} required /></label>)}</fieldset>
    {product ? <p className="upload-note">Existing images are kept. This update API does not accept image uploads.</p> : <label className="upload-zone"><ImagePlus size={21} /><span><strong>Product images</strong><small>Up to 5 images, 1 MB each</small></span><input type="file" accept="image/*" multiple onChange={chooseFiles} /><span className="upload-count">{files.length ? `${files.length} selected` : "Choose files"}</span></label>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {product && <button className="button button-secondary" disabled={busy} onClick={onCancel} type="button">Cancel</button>}
    <button className="button button-primary" disabled={busy} type="submit">{busy ? product ? "Saving..." : "Publishing..." : product ? "Save changes" : "Create product"}{product ? <Save size={17} /> : <Plus size={17} />}</button>
  </form>;
}

export default function SellerPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products/seller");
      const allProducts = data.data.products ?? [];
      setProducts(allProducts.filter((product) => String(product.seller?._id ?? product.seller) === String(user.id)));
    } catch (requestError) {
      setError(serverMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const setPublished = async (product) => {
    setNotice("");
    try {
      await api.patch(`/products/${product.published ? "unlist" : "list"}/${product._id}`);
      setNotice(product.published ? "Product unpublished." : "Product published.");
      loadProducts();
    } catch (requestError) {
      setError(serverMessage(requestError));
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await api.delete(`/products/delete/${product._id}`);
      setProducts((current) => current.filter((item) => item._id !== product._id));
      setNotice("Product deleted.");
    } catch (requestError) {
      setError(serverMessage(requestError));
    }
  };

  return <section className="seller-page">
    <div className="seller-heading"><div><span className="eyebrow">SELLER STUDIO / {user.name}</span><h1>Your pieces,<br /><em>your point of view.</em></h1></div><div className="seller-count"><span>{products.length.toString().padStart(2, "0")}</span><small>YOUR PIECES</small></div></div>
    <div className="seller-columns"><div className="seller-inventory"><div className="section-heading"><div><span className="eyebrow">INVENTORY</span><h2>Product list</h2></div><button className="text-button" onClick={loadProducts} type="button">Refresh <ArrowUpRight size={15} /></button></div>
      {notice && <p className="form-success" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <div className="state-block"><span className="loader" />Loading inventory...</div> : products.length === 0 ? <div className="empty-inventory"><span>01</span><p>Your pieces will show up here once they are added.</p></div> : <div className="inventory-list">{products.map((product) => <article className="inventory-item" key={product._id}><div className="inventory-thumb">{product.images?.[0] ? <img src={product.images[0]} alt="" /> : <span>S.</span>}</div><div className="inventory-info"><h3>{product.title}</h3><span>{displayPrice(product.price)} · {product.sizes?.length ?? 0} sizes</span></div><span className={`publish-state ${product.published ? "is-live" : "is-draft"}`}>{product.published ? "Live" : "Unlisted"}</span><button className="icon-button edit-icon" type="button" onClick={() => setEditingProduct(product)} title={`Edit ${product.title}`} aria-label={`Edit ${product.title}`}><Pencil size={16} /></button><button className="icon-button subtle-icon" onClick={() => setPublished(product)} title={product.published ? "Unpublish product" : "Publish product"} aria-label={product.published ? "Unpublish product" : "Publish product"}>↗</button><button className="icon-button danger-icon" onClick={() => removeProduct(product)} title="Delete product" aria-label={`Delete ${product.title}`}><Trash2 size={17} /></button></article>)}</div>}
    </div><aside className="create-panel"><ProductForm onCreated={() => { setNotice("Product created."); loadProducts(); }} /></aside></div>
    {editingProduct && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingProduct(null); }}><section className="edit-modal" role="dialog" aria-modal="true" aria-label={`Edit ${editingProduct.title}`}><button className="icon-button modal-close" type="button" onClick={() => setEditingProduct(null)} title="Close edit form" aria-label="Close edit form"><X size={19} /></button><ProductForm key={editingProduct._id} product={editingProduct} onCancel={() => setEditingProduct(null)} onUpdated={() => { setEditingProduct(null); setNotice("Product updated."); loadProducts(); }} /></section></div>}
  </section>;
}