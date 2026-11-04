import Link from "next/link";
import Image from 'next/image';
import { login } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <section className="login-story">
        <Link className="brand" href="/">
          <Image src="/campus-drop-logo.png" alt="Campus Drop" width={136} height={136} style={{objectFit:'contain',borderRadius:18}}/>
        </Link>
        <div>
          <p className="eyebrow">THE CAMPUS, CONNECTED</p>
          <h1>
            Small shops.
            <br />
            Big possibilities.
          </h1>
          <p>
            One place to run your campus marketplace. Real orders, trusted
            sellers, and a better student day.
          </p>
        </div>
        <small>Campus Drop · Operations console</small>
      </section>
      <section className="login-form">
        <p className="eyebrow">OPERATIONS ACCESS</p>
        <h2>Welcome back.</h2>
        <p className="muted">Sign in with your administrator account.</p>
        {error && <p className="alert">{error}</p>}
        <form action={login}>
          <label>
            Email address
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          <button>Sign in to workspace →</button>
        </form>
        <p className="muted small">
          Use the 8–72 character password set by your Super Admin.
        </p>
      </section>
    </main>
  );
}
