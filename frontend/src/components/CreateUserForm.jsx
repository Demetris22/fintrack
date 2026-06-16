import { useState } from "react";
import { createUser } from "../services/api";

function CreateUserForm({ onUserCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const user = await createUser({
        email,
        password,
        fullName,
      });

      onUserCreated(user);

      setMessage(`User created successfully. User ID: ${user.id}`);
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2>Create User</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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

        <button type="submit">Create User</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default CreateUserForm;