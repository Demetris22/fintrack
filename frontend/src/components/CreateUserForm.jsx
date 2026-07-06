import { useState } from "react";
import { createUser } from "../services/api";
import { Button, FormCard, FormField, TextInput } from "./ui";

function CreateUserForm({ onUserCreated, onNotify }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      await createUser({
        email,
        password,
        fullName,
      });

      setEmail("");
      setPassword("");
      setFullName("");

      setMessage("Account created successfully. Please sign in.");

      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err) {
      const message = err.message || "Could not create your account.";

      setError(message);
      onNotify?.({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      title="Create Account"
      description="Register a user profile, then sign in to access your dashboard."
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <FormField label="Email">
          <TextInput
            type="email"
            placeholder="Example: demetris@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Password">
          <TextInput
            type="password"
            placeholder="Enter a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Full name" fullWidth>
          <TextInput
            type="text"
            placeholder="Example: Demetris Demetriou"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </FormField>

        <div className="form-actions full-width">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </FormCard>
  );
}

export default CreateUserForm;
