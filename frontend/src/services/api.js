const API_URL = "http://localhost:8080/api";

async function request(endpoint, options = {}, config = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const rawText = await response.text();

  let data;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    console.error("API error:", {
      endpoint,
      status: response.status,
      data,
    });

    if (response.status === 401) {
      const error = new Error(
        config.unauthorizedMessage ||
          "Your session expired. Please sign out and sign in again."
      );
      error.status = response.status;
      throw error;
    }

    if (response.status === 403) {
      const error = new Error("You are not allowed to perform this action.");
      error.status = response.status;
      throw error;
    }

    if (response.status === 409) {
      const error = new Error(
        data?.message || data?.title || "Wallet already exists."
      );
      error.status = response.status;
      throw error;
    }

    const error = new Error(
      data?.message ||
        data?.title ||
        data?.detail ||
        data ||
        `Request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

/* =========================
   Auth / Users
   ========================= */

export function createUser(user) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function loginUser(credentials) {
  return request(
    "/users/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    {
      unauthorizedMessage: "Invalid email or password.",
    }
  );
}

/* =========================
   Wallets
   ========================= */

export function createWallet(wallet) {
  return request("/wallets", {
    method: "POST",
    body: JSON.stringify(wallet),
  });
}

export function getWallets() {
  return request("/wallets");
}

export function getWalletById(walletId) {
  return request(`/wallets/${walletId}`);
}

export function depositToWallet(walletId, amount) {
  return request(`/wallets/${walletId}/deposit`, {
    method: "POST",
    body: JSON.stringify({
      amount: Number(amount),
    }),
  });
}

export function transferBetweenWallets(transfer) {
  return request("/wallets/transfer", {
    method: "POST",
    body: JSON.stringify({
      sourceWalletId: transfer.sourceWalletId.trim(),
      destinationWalletId: transfer.destinationWalletId.trim(),
      amount: Number(transfer.amount),
      currency: transfer.currency,
      description: transfer.description,
    }),
  });
}

export function lookupWalletByEmail(email, currency) {
  const params = new URLSearchParams({ email: email.trim(), currency });
  return request(`/wallets/lookup?${params.toString()}`);
}

export function getWalletTransactions(walletId) {
  return request(`/wallets/${walletId}/transactions`);
}

export function getLedgerTransaction(transactionId) {
  return request(`/ledger-transactions/${transactionId}`);
}

/* =========================
   Old finance endpoints
   Keep temporarily until we fully migrate the UI
   ========================= */

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
