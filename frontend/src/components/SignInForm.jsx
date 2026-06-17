import { useState } from "react";
import { loginUser } from "../services/api";

function SignInForm({ onUserSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await loginUser(email, password);
      onUserSignedIn(user);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="card">
      <h2>Sign In</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Sign In</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default SignInForm;
