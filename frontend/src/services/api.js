const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || "/api");

function normalizeApiUrl(url) {
  const trimmedUrl = String(url || "").trim();

  if (!trimmedUrl || trimmedUrl === "/") {
    return "";
  }

  return trimmedUrl.replace(/\/+$/, "");
}

function buildApiUrl(endpoint) {
  const safeEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${API_URL}${safeEndpoint}`;
}

function flattenValidationErrors(errors) {
  if (!errors || typeof errors !== "object") {
    return "";
  }

  return Object.values(errors)
    .flat()
    .filter(Boolean)
    .join(" ");
}

function getProblemMessage(status, data) {
  const validationMessage = flattenValidationErrors(data?.errors);
  const serverMessage =
    data?.message ||
    data?.title ||
    data?.detail ||
    (typeof data === "string" ? data : "");

  if (validationMessage) {
    return validationMessage;
  }

  if (serverMessage && !String(serverMessage).includes("One or more validation errors")) {
    return serverMessage;
  }

  if (status === 400) {
    return "Please check the information and try again.";
  }

  if (status === 401) {
    return "Your session expired. Please sign out and sign in again.";
  }

  if (status === 403) {
    return "You are not allowed to perform this action.";
  }

  if (status === 404) {
    return "We could not find that record. Refresh the page and try again.";
  }

  if (status === 409) {
    return "That item already exists.";
  }

  if (status === 422) {
    return "This action cannot be completed with the current data.";
  }

  if (status >= 500) {
    return "The FinTrack service had a problem. Please try again in a moment.";
  }

  return `Request failed with status ${status}.`;
}

function createApiError(message, status, data) {
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

async function request(endpoint, options = {}, config = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(buildApiUrl(endpoint), {
      ...options,
      headers,
    });
  } catch {
    throw createApiError(
      "Could not reach the FinTrack API. Check your connection and try again.",
      0,
      null
    );
  }

  const rawText = await response.text();

  let data;

  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = rawText;
  }

  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.warn("API error:", {
        endpoint,
        status: response.status,
        data,
      });
    }

    if (response.status === 401) {
      throw createApiError(
        config.unauthorizedMessage ||
          getProblemMessage(response.status, data),
        response.status,
        data
      );
    }

    throw createApiError(
      getProblemMessage(response.status, data),
      response.status,
      data
    );
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
