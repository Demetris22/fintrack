import { useState } from "react";
import { loginUser } from "../services/api";
import { Button, FormCard, FormField, TextInput } from "./ui";

function SignInForm({ onUserSignedIn, onNotify }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await loginUser({
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      onUserSignedIn(data.user);

      setEmail("");
      setPassword("");
    } catch (err) {
      const message =
        err.status === 401
          ? "Invalid email or password."
          : err.message || "Unable to sign in right now.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Sign In"
      description="Enter your email and password to load your FinTrack dashboard."
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <FormField label="Email" fullWidth>
          <TextInput
            type="email"
            placeholder="Example: demetris@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Password" fullWidth>
          <TextInput
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>

        <div className="form-actions full-width">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default SignInForm;
