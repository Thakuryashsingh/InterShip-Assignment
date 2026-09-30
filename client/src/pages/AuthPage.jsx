import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const messageFrom = (error) => error.response?.data?.message ?? "Something went wrong. Please try again.";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      else await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-art" aria-hidden="true">
        <span className="art-index">ISSUE 01 / 26</span>
        <div className="art-composition"><span className="art-big">S</span><span className="art-side">STYLE<br />ON YOUR<br />OWN TERMS</span></div>
        <span className="art-caption">A new point of view on getting dressed.</span>
      </div>
      <div className="auth-panel">
        <span className="eyebrow">YOUR EVERYDAY EDIT</span>
        <h1>{isRegister ? "Make it yours." : "Good to see you."}</h1>
        <p className="auth-intro">{isRegister ? "Create an account and find your new favourites." : "Sign in to pick up where your style left off."}</p>
        <form className="form-stack" onSubmit={submit}>
          {isRegister && <label className="field"><span>Name</span><div className="input-wrap"><UserRound size={18} /><input name="name" autoComplete="name" value={form.name} onChange={update} minLength="2" maxLength="50" required /></div></label>}
          <label className="field"><span>Email address</span><div className="input-wrap"><Mail size={18} /><input name="email" type="email" autoComplete="email" value={form.email} onChange={update} required /></div></label>
          <label className="field"><span>Password</span><div className="input-wrap"><LockKeyhole size={18} /><input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update} minLength="6" required /></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" disabled={busy} type="submit">{busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}<ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{isRegister ? "Already have an account?" : "New around here?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p>
        {isRegister && <p className="role-note">New accounts use the backend's default role. Seller tools appear only for accounts already assigned the seller role.</p>}
      </div>
    </section>
  );
}