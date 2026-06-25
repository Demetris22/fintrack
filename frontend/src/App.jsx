import { useEffect, useState } from "react";
import "./App.css";

import CreateUserForm from "./components/CreateUserForm";
import SignInForm from "./components/SignInForm";
import CreateWalletForm from "./components/CreateWalletForm";
import DepositWalletForm from "./components/DepositWalletForm";
import TransferWalletForm from "./components/TransferWalletForm";
import WalletActivityPanel from "./components/WalletActivityPanel";
import CreateAccountForm from "./components/CreateAccountForm";
import CreateTransactionForm from "./components/CreateTransactionForm";
import CreateBudgetForm from "./components/CreateBudgetForm";
import AnalyticsPanel from "./components/AnalyticsPanel";
import SummaryCards from "./components/SummaryCards";

import {
  getWallets,
  getAccounts,
  getTransactions,
  getBudgets,
} from "./services/api";

import { getCategoryStyle } from "./utils/categoryStyles";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("token");

    if (!savedUser || !savedToken) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      return null;
    }
  });

  const [wallets, setWallets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [authMode, setAuthMode] = useState("register");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [walletActivityRefreshKey, setWalletActivityRefreshKey] = useState(0);
  const [copiedWalletId, setCopiedWalletId] = useState("");

  const [showWalletForm, setShowWalletForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] =
    useState("All");
  const [transactionSort, setTransactionSort] = useState("newest");

  const [activeSection, setActiveSection] = useState("user");

  useEffect(() => {
    async function loadUserData() {
      if (!currentUser) {
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      setIsLoadingData(true);
      setDataError("");

      function handleLoadError(resourceName, err) {
        console.error(`Failed to load ${resourceName}:`, err);

        if (err.status === 401) {
          setDataError("Your session expired. Please sign out and sign in again.");
        }
      }

      try {
        const walletsData = await getWallets();
        setWallets(walletsData);
      } catch (err) {
        handleLoadError("wallets", err);
      }

      try {
        const accountsData = await getAccounts(currentUser.id);
        setAccounts(accountsData);
      } catch (err) {
        handleLoadError("accounts", err);
      }

      try {
        const transactionsData = await getTransactions(currentUser.id);
        setTransactions(transactionsData);
      } catch (err) {
        handleLoadError("transactions", err);
      }

      try {
        const budgetsData = await getBudgets(currentUser.id);
        setBudgets(budgetsData);
      } catch (err) {
        handleLoadError("budgets", err);
      }

      setIsLoadingData(false);
    }

    loadUserData();
  }, [currentUser]);

  function formatCurrency(amount, currency = "EUR") {
    try {
      return new Intl.NumberFormat("en-CY", {
        style: "currency",
        currency,
      }).format(Number(amount || 0));
    } catch {
      return `${Number(amount || 0).toFixed(2)} ${currency}`;
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No date";
    }

    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getSpentForCategory(category) {
    return transactions
      .filter(
        (transaction) =>
          (transaction.category || "Uncategorized").toLowerCase() ===
          String(category || "").toLowerCase()
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  }

  function getUserInitials() {
    const name = currentUser?.fullName || currentUser?.email || "User";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getDisplayName() {
    if (currentUser?.fullName) {
      return currentUser.fullName;
    }

    if (currentUser?.email) {
      return currentUser.email.split("@")[0];
    }

    return "User";
  }

  function getAccountIcon(accountType) {
    const type = (accountType || "").toLowerCase();

    if (type.includes("wallet")) {
      return "W";
    }

    if (type.includes("bank")) {
      return "B";
    }

    if (type.includes("saving")) {
      return "S";
    }

    if (type.includes("card")) {
      return "C";
    }

    return "A";
  }

  function getWalletIcon(currency) {
    return (currency || "EUR").slice(0, 3).toUpperCase();
  }

  function getWalletStatusText(status) {
    if (!status) {
      return "Active";
    }

    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  function getWalletBalance(wallet) {
    return (
      wallet.balance ??
      wallet.availableBalance ??
      wallet.currentBalance ??
      wallet.amount ??
      0
    );
  }

  async function copyWalletId(walletId) {
    try {
      await navigator.clipboard.writeText(walletId);
      setCopiedWalletId(walletId);

      window.setTimeout(() => {
        setCopiedWalletId((currentId) =>
          currentId === walletId ? "" : currentId
        );
      }, 1800);
    } catch (err) {
      console.error("Failed to copy wallet ID:", err);
      setDataError("Could not copy wallet ID. You can select it manually.");
    }
  }

  function handleProtectedActionError(actionName, err) {
    console.error(`Failed to ${actionName}:`, err);

    if (err.status === 401) {
      setDataError("Your session expired. Please sign out and sign in again.");
    }
  }

  function handleWalletCreated(wallet) {
    setWallets((currentWallets) => [wallet, ...currentWallets]);
    setShowWalletForm(false);
  }

  async function handleDepositCompleted() {
    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      setShowDepositForm(false);
      setWalletActivityRefreshKey((currentKey) => currentKey + 1);
    } catch (err) {
      handleProtectedActionError("refresh wallets after deposit", err);
    }
  }

  async function handleTransferCompleted() {
    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      setShowTransferForm(false);
      setWalletActivityRefreshKey((currentKey) => currentKey + 1);
    } catch (err) {
      handleProtectedActionError("refresh wallets after transfer", err);
    }
  }

  function handleAccountCreated(account) {
    setAccounts((currentAccounts) => [account, ...currentAccounts]);
    setShowAccountForm(false);
  }

  function handleTransactionCreated(transaction) {
    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
    setShowTransactionForm(false);
  }

  function handleBudgetCreated(budget) {
    setBudgets((currentBudgets) => [budget, ...currentBudgets]);
    setShowBudgetForm(false);
  }

  function handleClearCurrentUser() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");

    setCurrentUser(null);

    setWallets([]);
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);

    setShowWalletForm(false);
    setShowDepositForm(false);
    setShowTransferForm(false);
    setShowAccountForm(false);
    setShowTransactionForm(false);
    setShowBudgetForm(false);

    setTransactionSearch("");
    setTransactionCategoryFilter("All");
    setTransactionSort("newest");
    setDataError("");
    setCopiedWalletId("");
    setWalletActivityRefreshKey(0);

    setActiveSection("user");
    setAuthMode("register");
  }

  const transactionCategories = [
    "All",
    ...new Set(
      transactions.map(
        (transaction) => transaction.category || "Uncategorized"
      )
    ),
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const category = transaction.category || "Uncategorized";
    const description = transaction.description || "";
    const amount = String(transaction.amount);
    const date = transaction.transactionDate || "";

    const search = transactionSearch.toLowerCase();

    const matchesSearch =
      category.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      amount.includes(transactionSearch) ||
      date.includes(transactionSearch);

    const matchesCategory =
      transactionCategoryFilter === "All" ||
      category === transactionCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const sortedFilteredTransactions = [...filteredTransactions].sort((a, b) => {
    if (transactionSort === "newest") {
      return new Date(b.transactionDate || 0) - new Date(a.transactionDate || 0);
    }

    if (transactionSort === "oldest") {
      return new Date(a.transactionDate || 0) - new Date(b.transactionDate || 0);
    }

    if (transactionSort === "highest") {
      return Number(b.amount) - Number(a.amount);
    }

    if (transactionSort === "lowest") {
      return Number(a.amount) - Number(b.amount);
    }

    return 0;
  });

  const filteredTransactionTotal = filteredTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-badge">Smart finance dashboard</div>

        <h1>FinTrack</h1>

        <p>
          Track wallets, deposits, transfers, budgets, transactions and spending
          insights in one clean dashboard.
        </p>
      </header>

      <nav className="top-nav">
        <a
          href="#user"
          className={activeSection === "user" ? "active" : ""}
          onClick={() => setActiveSection("user")}
        >
          User
        </a>

        {currentUser && (
          <>
            <a
              href="#wallets"
              className={activeSection === "wallets" ? "active" : ""}
              onClick={() => setActiveSection("wallets")}
            >
              Wallets
            </a>

            <a
              href="#wallet-activity"
              className={activeSection === "wallet-activity" ? "active" : ""}
              onClick={() => setActiveSection("wallet-activity")}
            >
              Wallet Activity
            </a>

            <a
              href="#analytics"
              className={activeSection === "analytics" ? "active" : ""}
              onClick={() => setActiveSection("analytics")}
            >
              Analytics
            </a>

            <a
              href="#accounts"
              className={activeSection === "accounts" ? "active" : ""}
              onClick={() => setActiveSection("accounts")}
            >
              Accounts
            </a>
          </>
        )}

        {accounts.length > 0 && (
          <>
            <a
              href="#transactions"
              className={activeSection === "transactions" ? "active" : ""}
              onClick={() => setActiveSection("transactions")}
            >
              Transactions
            </a>

            <a
              href="#budgets"
              className={activeSection === "budgets" ? "active" : ""}
              onClick={() => setActiveSection("budgets")}
            >
              Budgets
            </a>
          </>
        )}
      </nav>

      <section id="user">
        {!currentUser && (
          <>
            <div className="auth-toggle">
              <button
                type="button"
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>

              <button
                type="button"
                className={authMode === "signin" ? "active" : ""}
                onClick={() => setAuthMode("signin")}
              >
                Sign In
              </button>
            </div>

            {authMode === "register" ? (
              <CreateUserForm onUserCreated={() => setAuthMode("signin")} />
            ) : (
              <SignInForm onUserSignedIn={setCurrentUser} />
            )}
          </>
        )}

        {currentUser && (
          <div className="card profile-card">
            <div className="profile-main">
              <div className="profile-avatar">{getUserInitials()}</div>

              <div className="profile-info">
                <p className="welcome-label">Welcome back</p>
                <h2>{getDisplayName()}</h2>
                <p>{currentUser.email}</p>
              </div>

              <button
                type="button"
                className="sign-out-button"
                onClick={handleClearCurrentUser}
              >
                Sign Out
              </button>
            </div>

            <div className="profile-stats">
              <div>
                <span>{wallets.length}</span>
                <p>Wallets</p>
              </div>

              <div>
                <span>{new Set(wallets.map((wallet) => wallet.currency)).size}</span>
                <p>Currencies</p>
              </div>

              <div>
                <span>{budgets.length}</span>
                <p>Budgets</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {isLoadingData && (
        <div className="card status-card">
          <p>Loading user data...</p>
        </div>
      )}

      {dataError && (
        <div className="session-alert">
          <p>{dataError}</p>
        </div>
      )}

      {currentUser && (
        <section className="dashboard-summary">
          <h2 className="section-title">Wallet Summary</h2>

          <SummaryCards
            wallets={wallets}
            transactions={transactions}
            budgets={budgets}
          />
        </section>
      )}

      {currentUser && (
        <>
          <section id="wallets">
            <div className="section-header wallet-section-header">
              <div className="section-title-block">
                <h2>Wallets</h2>
                <p>Create currency wallets, deposit funds, and move money.</p>
              </div>

              <div className="section-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowWalletForm(!showWalletForm);
                    setShowDepositForm(false);
                    setShowTransferForm(false);
                  }}
                >
                  {showWalletForm ? "Cancel" : "+ Add Wallet"}
                </button>

                <button
                  type="button"
                  disabled={wallets.length === 0}
                  onClick={() => {
                    if (wallets.length === 0) {
                      return;
                    }

                    setShowDepositForm(!showDepositForm);
                    setShowWalletForm(false);
                    setShowTransferForm(false);
                  }}
                >
                  {showDepositForm ? "Cancel" : "Deposit"}
                </button>

                <button
                  type="button"
                  disabled={wallets.length === 0}
                  onClick={() => {
                    if (wallets.length === 0) {
                      return;
                    }

                    setShowTransferForm(!showTransferForm);
                    setShowWalletForm(false);
                    setShowDepositForm(false);
                  }}
                >
                  {showTransferForm ? "Cancel" : "Transfer"}
                </button>
              </div>
            </div>

            {showWalletForm && (
              <CreateWalletForm onWalletCreated={handleWalletCreated} />
            )}

            {showDepositForm && (
              <DepositWalletForm
                wallets={wallets}
                onDepositCompleted={handleDepositCompleted}
              />
            )}

            {showTransferForm && (
              <TransferWalletForm
                wallets={wallets}
                onTransferCompleted={handleTransferCompleted}
              />
            )}

            <div className="card dashboard-card wallet-dashboard-card">
              {wallets.length === 0 ? (
                <div className="empty-state">
                  <h3>No wallets yet</h3>
                  <p>Create your first wallet to start using wallet transfers.</p>
                </div>
              ) : (
                <div className="wallet-grid">
                  {wallets.map((wallet) => {
                    const statusText = getWalletStatusText(wallet.status);
                    const statusClass =
                      statusText.toLowerCase() === "active" ? "active" : "muted";

                    return (
                      <article className="wallet-card" key={wallet.id}>
                        <div className="wallet-card-header">
                          <div className="wallet-title-group">
                            <div className="wallet-icon">
                              {getWalletIcon(wallet.currency)}
                            </div>

                            <div>
                              <h3>{wallet.currency} Wallet</h3>
                              <p>Currency wallet</p>
                            </div>
                          </div>

                          <span className={`wallet-status ${statusClass}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="wallet-balance-block">
                          <span>Available balance</span>
                          <strong>
                            {formatCurrency(
                              getWalletBalance(wallet),
                              wallet.currency
                            )}
                          </strong>
                        </div>

                        <div className="wallet-meta-grid">
                          <div className="wallet-id-block">
                            <span>Wallet ID</span>
                            <code title={wallet.id}>{wallet.id}</code>
                          </div>

                          <button
                            type="button"
                            className="copy-button wallet-copy-button"
                            onClick={() => copyWalletId(wallet.id)}
                          >
                            {copiedWalletId === wallet.id ? "Copied" : "Copy ID"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section id="wallet-activity">
            <div className="section-header">
              <div className="section-title-block">
                <h2>Wallet Activity</h2>
                <p>View deposits and transfers recorded for each wallet.</p>
              </div>
            </div>

            <WalletActivityPanel
              wallets={wallets}
              refreshKey={walletActivityRefreshKey}
            />
          </section>

          <section id="analytics">
            <div className="section-header">
              <div className="section-title-block">
                <h2>Analytics</h2>
                <p>Visual insights based on your transaction categories.</p>
              </div>
            </div>

            <AnalyticsPanel
              userId={currentUser.id}
              transactions={transactions}
            />
          </section>

          <section id="accounts" className="legacy-section">
            <div className="section-header">
              <div className="section-title-block">
                <h2>Accounts</h2>
                <p>Legacy account tools kept below the wallet workspace.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountForm(!showAccountForm)}
              >
                {showAccountForm ? "Cancel" : "+ Add Account"}
              </button>
            </div>

            {showAccountForm && (
              <CreateAccountForm
                userId={currentUser.id}
                onAccountCreated={handleAccountCreated}
              />
            )}

            <div className="card dashboard-card">
              {accounts.length === 0 ? (
                <div className="empty-state">
                  <h3>No accounts yet</h3>
                  <p>Add your first wallet, bank account, or savings account.</p>
                </div>
              ) : (
                <div className="data-list">
                  {accounts.map((account) => (
                    <div className="data-row account-row" key={account.id}>
                      <div className="account-left">
                        <div className="account-icon">
                          {getAccountIcon(account.accountType)}
                        </div>

                        <div>
                          <h3>{account.name}</h3>

                          <p>
                            {account.institution || "No institution"} -{" "}
                            {account.accountType} account
                          </p>

                          <small>Created {formatDate(account.createdAt)}</small>
                        </div>
                      </div>

                      <span className="badge">{account.currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {accounts.length > 0 && (
            <>
              <section id="transactions" className="legacy-section">
                <div className="section-header">
                  <div className="section-title-block">
                    <h2>Transactions</h2>
                    <p>Track, search, filter and sort your spending activity.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowTransactionForm(!showTransactionForm)
                    }
                  >
                    {showTransactionForm ? "Cancel" : "+ Add Transaction"}
                  </button>
                </div>

                {showTransactionForm && (
                  <CreateTransactionForm
                    userId={currentUser.id}
                    accounts={accounts}
                    onTransactionCreated={handleTransactionCreated}
                  />
                )}

                <div className="card dashboard-card">
                  {transactions.length === 0 ? (
                    <div className="empty-state">
                      <h3>No transactions yet</h3>
                      <p>Add your first transaction to start tracking spending.</p>
                    </div>
                  ) : (
                    <>
                      <div className="transaction-tools">
                        <input
                          type="text"
                          placeholder="Search transactions..."
                          value={transactionSearch}
                          onChange={(e) =>
                            setTransactionSearch(e.target.value)
                          }
                        />

                        <select
                          value={transactionCategoryFilter}
                          onChange={(e) =>
                            setTransactionCategoryFilter(e.target.value)
                          }
                        >
                          {transactionCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>

                        <select
                          value={transactionSort}
                          onChange={(e) => setTransactionSort(e.target.value)}
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                          <option value="highest">Highest amount</option>
                          <option value="lowest">Lowest amount</option>
                        </select>
                      </div>

                      <div className="transaction-stats">
                        <span>
                          Showing {filteredTransactions.length} of{" "}
                          {transactions.length} transactions
                        </span>

                        <strong>
                          Filtered total:{" "}
                          {formatCurrency(filteredTransactionTotal)}
                        </strong>
                      </div>

                      {filteredTransactions.length === 0 ? (
                        <div className="empty-state">
                          <h3>No matching transactions</h3>
                          <p>Try changing your search or category filter.</p>
                        </div>
                      ) : (
                        <div className="data-list">
                          {sortedFilteredTransactions.map((transaction) => {
                            const categoryStyle = getCategoryStyle(
                              transaction.category
                            );

                            return (
                              <div
                                className="data-row transaction-row"
                                key={transaction.id}
                              >
                                <div>
                                  <div className="row-title">
                                    <span
                                      className="category-icon"
                                      style={{
                                        backgroundColor:
                                          categoryStyle.background,
                                        color: categoryStyle.color,
                                      }}
                                    >
                                      {categoryStyle.icon}
                                    </span>

                                    <h3>
                                      {transaction.category ||
                                        "Uncategorized"}
                                    </h3>
                                  </div>

                                  <p>
                                    {transaction.description || "No description"}
                                  </p>

                                  <small>
                                    {formatDate(transaction.transactionDate)}
                                  </small>
                                </div>

                                <strong className="amount">
                                  {formatCurrency(
                                    transaction.amount,
                                    transaction.currency || "EUR"
                                  )}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              <section id="budgets" className="legacy-section">
                <div className="section-header">
                  <div className="section-title-block">
                    <h2>Budgets</h2>
                    <p>Set monthly limits and monitor how much budget remains.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBudgetForm(!showBudgetForm)}
                  >
                    {showBudgetForm ? "Cancel" : "+ Add Budget"}
                  </button>
                </div>

                {showBudgetForm && (
                  <CreateBudgetForm
                    userId={currentUser.id}
                    onBudgetCreated={handleBudgetCreated}
                  />
                )}

                <div className="card dashboard-card">
                  {budgets.length === 0 ? (
                    <div className="empty-state">
                      <h3>No budgets yet</h3>
                      <p>Create monthly category limits for your spending.</p>
                    </div>
                  ) : (
                    <div className="data-list">
                      {budgets.map((budget) => {
                        const spent = getSpentForCategory(budget.category);
                        const limit = Number(budget.monthlyLimit);
                        const remaining = limit - spent;

                        const percentage =
                          limit > 0
                            ? Math.min((spent / limit) * 100, 100)
                            : 0;

                        const actualPercentage =
                          limit > 0
                            ? Math.round((spent / limit) * 100)
                            : 0;

                        const isOverBudget = spent > limit;
                        const isWarning =
                          actualPercentage >= 80 && !isOverBudget;

                        let statusText = "On track";

                        if (isOverBudget) {
                          statusText = "Over budget";
                        } else if (isWarning) {
                          statusText = "Close to limit";
                        }

                        const budgetCategoryStyle = getCategoryStyle(
                          budget.category
                        );

                        return (
                          <div className="budget-card" key={budget.id}>
                            <div className="budget-card-header">
                              <div className="budget-category-title">
                                <span
                                  className="category-icon"
                                  style={{
                                    backgroundColor:
                                      budgetCategoryStyle.background,
                                    color: budgetCategoryStyle.color,
                                  }}
                                >
                                  {budgetCategoryStyle.icon}
                                </span>

                                <div>
                                  <h3>{budget.category}</h3>
                                  <p>Monthly spending limit</p>
                                </div>
                              </div>

                              <span
                                className={
                                  isOverBudget
                                    ? "budget-status danger"
                                    : isWarning
                                      ? "budget-status warning"
                                      : "budget-status"
                                }
                              >
                                {statusText}
                              </span>
                            </div>

                            <div className="budget-money-row">
                              <div>
                                <span>Spent</span>
                                <strong>
                                  {formatCurrency(spent, budget.currency)}
                                </strong>
                              </div>

                              <div>
                                <span>Limit</span>
                                <strong>
                                  {formatCurrency(limit, budget.currency)}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  {remaining < 0 ? "Overspent" : "Remaining"}
                                </span>
                                <strong
                                  className={
                                    remaining < 0 ? "negative-text" : ""
                                  }
                                >
                                  {formatCurrency(
                                    Math.abs(remaining),
                                    budget.currency
                                  )}
                                </strong>
                              </div>
                            </div>

                            <div className="progress-bar budget-progress">
                              <div
                                className={
                                  isOverBudget
                                    ? "progress-fill danger"
                                    : isWarning
                                      ? "progress-fill warning"
                                      : "progress-fill"
                                }
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>

                            <div className="budget-footer">
                              <small>{actualPercentage}% of budget used</small>
                              <small>
                                {isOverBudget
                                  ? "You passed your monthly limit"
                                  : "You are still within your budget"}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}

      <footer className="footer">
        <p>FinTrack (c) 2026</p>
        <span>Digital Wallet and Smart Finance Analytics Platform</span>
      </footer>
    </div>
  );
}

export default App;
