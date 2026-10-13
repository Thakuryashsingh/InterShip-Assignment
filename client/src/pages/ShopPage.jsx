import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../axiosInstance/axiosInstance";

const requestMessage = (error) => error.response?.data?.message ?? "Could not load products. Check the server connection and try again.";
const amount = (price) => new Intl.NumberFormat("en-IN", { style: "currency", currency: price?.currency ?? "INR", maximumFractionDigits: 0 }).format(price?.amount ?? 0);

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    api.get("/products")
      .then(({ data }) => setProducts(data.data.products ?? []))
      .catch((requestError) => setError(requestMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const shown = products
    .filter((product) => product.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "low" ? a.price.amount - b.price.amount : sort === "high" ? b.price.amount - a.price.amount : 0);

  return (
    <>
      <section className="shop-heading">
        <div><span className="eyebrow">THE SNITCH SELECTION</span><h1>Wear your<br /><em>own story.</em></h1></div>
        <div className="shop-aside"><p>Considered pieces for wherever the day takes you. Find a fit that feels like yours.</p><a href="#collection" className="text-link">Explore the edit <ArrowDown size={16} /></a></div>
        <div className="heading-stamp" aria-hidden="true">S<br /><span className="pr-4">26</span></div>
      </section>
      <section className="catalog" id="collection">
        <div className="catalog-toolbar"><div><span className="eyebrow">SHOP ALL</span><span className="result-count">{loading ? "Loading" : `${shown.length} pieces`}</span></div><div className="catalog-controls"><label className="search-box"><Search size={16} /><input aria-label="Search products" placeholder="Find a piece" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="sort-select"><span>Sort</span><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div></div>
        {loading ? <div className="state-block"><span className="loader" />Finding the good stuff...</div> : error ? <div className="state-block state-error" role="alert">{error}</div> : shown.length === 0 ? <div className="state-block">{products.length ? "No pieces match that search." : "Nothing in the edit just yet."}</div> : (
          <div className="product-grid">{shown.map((product, index) => <Link className="product-card" to={`/products/${product._id}`} key={product._id}>
            <div className={`product-image image-tone-${index % 4}`}>{product.images?.[0] ? <img src={product.images[0]} alt={product.title} loading="lazy" /> : <div className="image-empty"><span>SNITCH</span><i>—</i></div>}<span className="product-number">{String(index + 1).padStart(2, "0")}</span><span className="product-arrow"><ArrowUpRight size={18} /></span></div>
            <div className="product-meta"><div><h2>{product.title}</h2><span>{product.sizes?.map((item) => item.size).join(" / ") || "One of a kind"}</span></div><strong>{amount(product.price)}</strong></div>
          </Link>)}</div>
        )}
      </section>
      <section className="closing-note"><span>GOOD CLOTHES.<br /><em>GOOD ENERGY.</em></span><span>Made to make<br />the day yours.</span></section>
    </>
  );
}