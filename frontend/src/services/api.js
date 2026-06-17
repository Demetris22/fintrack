const API_URL = "http://localhost:8080/api";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
}

export function createUser(user) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
export function createAccount(account) {
  return request("/accounts", {
    method: "POST",
    body: JSON.stringify(account),
  });
}

export function getAccounts(userId) {
  return request(`/accounts?userId=${userId}`);
}
export function createTransaction(transaction) {
  return request("/transactions", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export function getTransactions(userId) {
  return request(`/transactions?userId=${userId}`);
}
export function createBudget(budget) {
  return request("/budgets", {
    method: "POST",
    body: JSON.stringify(budget),
  });
}

export function getBudgets(userId) {
  return request(`/budgets?userId=${userId}`);
}
export function getSpendingByCategory(userId) {
  return request(`/analytics/spending-by-category?userId=${userId}`);
}
export function getUserById(userId) {
  return request(`/users/${userId}`);
}

export function loginUser(email, password) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}