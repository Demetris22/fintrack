import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  Copy,
  Landmark,
  LogOut,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Target,
  Wallet,
  X,
} from "lucide-react";
import "./App.css";
import heroImage from "./assets/hero.png";

import CreateUserForm from "./components/CreateUserForm";
import SignInForm from "./components/SignInForm";
import CreateWalletForm from "./components/CreateWalletForm";
import DepositWalletForm from "./components/DepositWalletForm";
import TransferWalletForm from "./components/TransferWalletForm";
import WalletActivityPanel from "./components/WalletActivityPanel";
import ToastContainer from "./components/Toast";
import CreateAccountForm from "./components/CreateAccountForm";
import CreateTransactionForm from "./components/CreateTransactionForm";
import CreateBudgetForm from "./components/CreateBudgetForm";
import SummaryCards from "./components/SummaryCards";
import EmptyState from "./components/EmptyState";
import DotGrid from "./components/DotGrid";

import {
  getWallets,
  getAccounts,
  getTransactions,
  getBudgets,
} from "./services/api";

import { getCategoryStyle } from "./utils/categoryStyles";

const AnalyticsPanel = lazy(() => import("./components/AnalyticsPanel"));

const heroContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0.92, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const previewWallets = [
  { id: "preview-eur", currency: "EUR", balance: 8420 },
  { id: "preview-usd", currency: "USD", balance: 3180 },
];

const previewTransactions = [
  { id: "preview-tax", amount: 212.4, category: "Bills" },
  { id: "preview-shop", amount: 76.2, category: "Shopping" },
  { id: "preview-health", amount: 48.75, category: "Health" },
];

const previewBudgets = [
  { id: "preview-budget-bills", category: "Bills", monthlyLimit: 620 },
  { id: "preview-budget-food", category: "Food", monthlyLimit: 420 },
];

function AnalyticsFallback() {
  return (
    <div className="card analytics-card analytics-fallback" role="status">
      <div className="analytics-header">
        <p>Loading analytics workspace</p>
      </div>

      <div className="chart-container">
        <span className="skeleton skeleton-line short"></span>
        <span className="skeleton skeleton-value"></span>
        <span className="skeleton skeleton-line"></span>
        <span className="skeleton skeleton-line"></span>
      </div>
    </div>
  );
}

function App() {
  const shouldReduceMotion = useReducedMotion();
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
  const [toasts, setToasts] = useState([]);
  const [recentlyUpdatedWalletIds, setRecentlyUpdatedWalletIds] = useState([]);
  const [isSummaryUpdating, setIsSummaryUpdating] = useState(false);

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

  const showToast = useCallback(({ type = "info", message }) => {
    if (!message) {
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((currentToasts) => [
      ...currentToasts.slice(-3),
      { id, type, message },
    ]);

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id)
      );
    }, 4200);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId)
    );
  }, []);

  const handleSectionNavClick = useCallback(
    (event, sectionId) => {
      event.preventDefault();

      const targetSection = document.getElementById(sectionId);

      if (!targetSection) {
        return;
      }

      setActiveSection(sectionId);
      targetSection.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "start",
      });

      if (window.location.hash !== `#${sectionId}`) {
        window.history.replaceState(null, "", `#${sectionId}`);
      }
    },
    [shouldReduceMotion]
  );

  const markWalletsUpdated = useCallback((walletIds = []) => {
    const safeWalletIds = walletIds.filter(Boolean);

    setRecentlyUpdatedWalletIds(safeWalletIds);
    setIsSummaryUpdating(true);

    window.setTimeout(() => {
      setRecentlyUpdatedWalletIds([]);
      setIsSummaryUpdating(false);
    }, 1400);
  }, []);

  function getChangedWalletIds(previousWallets, nextWallets, fallbackIds = []) {
    const previousBalances = previousWallets.reduce((balances, wallet) => {
      balances[wallet.id] = String(getWalletBalance(wallet));
      return balances;
    }, {});

    const changedIds = nextWallets
      .filter((wallet) => previousBalances[wallet.id] !== String(getWalletBalance(wallet)))
      .map((wallet) => wallet.id);

    return [...new Set([...changedIds, ...fallbackIds])];
  }

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
          const message =
            "Your session expired. Please sign out and sign in again.";

          setDataError(message);
          showToast({ type: "error", message });
          return;
        }

        showToast({
          type: "error",
          message: `Could not load ${resourceName}. ${err.message || ""}`.trim(),
        });
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
  }, [currentUser, showToast]);

  useEffect(() => {
    const sectionIds = ["user"];

    if (currentUser) {
      sectionIds.push("wallets", "wallet-activity", "analytics", "accounts");
    }

    if (currentUser && accounts.length > 0) {
      sectionIds.push("transactions", "budgets");
    }

    let animationFrameId = 0;

    function updateActiveSection() {
      animationFrameId = 0;

      const sections = sectionIds
        .map((sectionId) => document.getElementById(sectionId))
        .filter(Boolean);

      if (sections.length === 0) {
        return;
      }

      const readingLine = Math.min(180, window.innerHeight * 0.24);
      let nextActiveSection = sections[0].id;

      for (const section of sections) {
        const sectionTop = section.getBoundingClientRect().top;

        if (sectionTop <= readingLine) {
          nextActiveSection = section.id;
        } else {
          break;
        }
      }

      const documentHeight = document.documentElement.scrollHeight;
      const pageBottom =
        window.innerHeight + window.scrollY >= documentHeight - 8;

      if (pageBottom) {
        nextActiveSection = sections[sections.length - 1].id;
      }

      setActiveSection((currentSection) =>
        currentSection === nextActiveSection ? currentSection : nextActiveSection
      );
    }

    function scheduleActiveSectionUpdate() {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateActiveSection);
    }

    scheduleActiveSectionUpdate();

    window.addEventListener("scroll", scheduleActiveSectionUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleActiveSectionUpdate);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("scroll", scheduleActiveSectionUpdate);
      window.removeEventListener("resize", scheduleActiveSectionUpdate);
    };
  }, [
    accounts.length,
    budgets.length,
    currentUser,
    showAccountForm,
    showBudgetForm,
    showDepositForm,
    showTransactionForm,
    showTransferForm,
    showWalletForm,
    transactions.length,
    wallets.length,
  ]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const activeNavLink = document.querySelector(
      '.top-nav a[aria-current="location"]'
    );
    const topNav = activeNavLink?.closest(".top-nav");

    if (!activeNavLink || !topNav || topNav.scrollWidth <= topNav.clientWidth) {
      return;
    }

    activeNavLink.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSection, currentUser, shouldReduceMotion]);

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
      showToast({ type: "success", message: "Wallet ID copied." });

      window.setTimeout(() => {
        setCopiedWalletId((currentId) =>
          currentId === walletId ? "" : currentId
        );
      }, 1800);
    } catch (err) {
      console.error("Failed to copy wallet ID:", err);
      showToast({
        type: "error",
        message: "Could not copy wallet ID. You can select it manually.",
      });
    }
  }

  function handleProtectedActionError(actionName, err) {
    console.error(`Failed to ${actionName}:`, err);

    if (err.status === 401) {
      const message = "Your session expired. Please sign out and sign in again.";

      setDataError(message);
      showToast({ type: "error", message });
      return;
    }

    showToast({
      type: "error",
      message: err.message || `Could not ${actionName}.`,
    });
  }

  function handleWalletCreated(wallet) {
    setWallets((currentWallets) => [wallet, ...currentWallets]);
    setShowWalletForm(false);
    markWalletsUpdated([wallet.id]);
    showToast({ type: "success", message: "Wallet created successfully." });
  }

  async function handleDepositCompleted(walletId) {
    const previousWallets = wallets;

    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      setShowDepositForm(false);
      setWalletActivityRefreshKey((currentKey) => currentKey + 1);
      markWalletsUpdated(
        getChangedWalletIds(previousWallets, walletsData, [walletId])
      );
      showToast({ type: "success", message: "Deposit completed successfully." });
    } catch (err) {
      handleProtectedActionError("refresh wallets after deposit", err);
    }
  }

  async function handleTransferCompleted(transferDetails = {}) {
    const previousWallets = wallets;

    try {
      const walletsData = await getWallets();
      setWallets(walletsData);
      setShowTransferForm(false);
      setWalletActivityRefreshKey((currentKey) => currentKey + 1);
      markWalletsUpdated(
        getChangedWalletIds(previousWallets, walletsData, [
          transferDetails.sourceWalletId,
          transferDetails.destinationWalletId,
        ])
      );
      showToast({ type: "success", message: "Transfer completed successfully." });
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
    setRecentlyUpdatedWalletIds([]);
    setIsSummaryUpdating(false);

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
    <>
      <DotGrid
        className="app-dot-grid"
        dotSize={4}
        gap={28}
        baseColor="#2458d3"
        activeColor="#0f8a5f"
        proximity={146}
        speedTrigger={90}
        shockRadius={230}
        shockStrength={2.6}
        resistance={820}
        returnDuration={1.8}
        interactive={!shouldReduceMotion}
      />

      <div className={currentUser ? "app app-authenticated" : "app app-landing"}>
      <header className="site-header">
        <a className="brand-lockup" href="#user" aria-label="FinTrack home">
          <span className="brand-mark">FT</span>
          <span>FinTrack</span>
        </a>

        <span className="site-status">
          {currentUser ? "Dashboard ready" : "Wallets, budgets, insights"}
        </span>
      </header>

      {!currentUser && (
        <motion.section
          id="user"
          className="landing-hero"
          initial={shouldReduceMotion ? false : "hidden"}
          animate="show"
          variants={heroContainer}
        >
          <div className="hero-copy">
            <motion.div className="hero-badge" variants={heroItem}>
              Smart finance workspace
            </motion.div>

            <motion.h1 variants={heroItem}>
              Track money clearly.
            </motion.h1>

            <motion.p variants={heroItem}>
              Create wallets, move funds, and spot spending.
            </motion.p>

            <motion.div className="hero-preview-summary" variants={heroItem}>
              <SummaryCards
                wallets={previewWallets}
                transactions={previewTransactions}
                budgets={previewBudgets}
              />
            </motion.div>
          </div>

          <motion.div className="auth-panel" variants={heroItem}>
            <div className="auth-panel-header">
              <img src={heroImage} alt="" aria-hidden="true" />

              <div>
                <span>Start here</span>
                <h2>
                  {authMode === "register"
                    ? "Create your workspace"
                    : "Open your dashboard"}
                </h2>
              </div>
            </div>

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
              <CreateUserForm
                onUserCreated={() => {
                  setAuthMode("signin");
                  showToast({
                    type: "success",
                    message: "Account created successfully. Please sign in.",
                  });
                }}
                onNotify={showToast}
              />
            ) : (
              <SignInForm
                onUserSignedIn={(user) => {
                  setCurrentUser(user);
                  showToast({
                    type: "success",
                    message: "Signed in successfully.",
                  });
                }}
                onNotify={showToast}
              />
            )}
          </motion.div>
        </motion.section>
      )}

      {currentUser && (
        <motion.header
          className="dashboard-hero"
          initial={shouldReduceMotion ? false : "hidden"}
          animate="show"
          variants={heroContainer}
        >
          <div className="hero-copy">
            <motion.div className="hero-badge" variants={heroItem}>
              Live finance dashboard
            </motion.div>

            <motion.h1 variants={heroItem}>
              Welcome back, {getDisplayName()}.
            </motion.h1>

            <motion.p variants={heroItem}>
              Review balances, move money, and keep budgets visible without
              digging through spreadsheets.
            </motion.p>
          </div>

          <motion.div className="dashboard-hero-panel" variants={heroItem}>
            <span>Workspace health</span>
            <strong>{wallets.length + accounts.length}</strong>
            <p>Connected finance spaces</p>
          </motion.div>
        </motion.header>
      )}

      {currentUser && (
        <nav className="top-nav" aria-label="Dashboard sections">
          <a
            href="#user"
            className={activeSection === "user" ? "active" : ""}
            aria-current={activeSection === "user" ? "location" : undefined}
            onClick={(event) => handleSectionNavClick(event, "user")}
          >
            User
          </a>

          <a
            href="#wallets"
            className={activeSection === "wallets" ? "active" : ""}
            aria-current={activeSection === "wallets" ? "location" : undefined}
            onClick={(event) => handleSectionNavClick(event, "wallets")}
          >
            Wallets
          </a>

          <a
            href="#wallet-activity"
            className={activeSection === "wallet-activity" ? "active" : ""}
            aria-current={
              activeSection === "wallet-activity" ? "location" : undefined
            }
            onClick={(event) =>
              handleSectionNavClick(event, "wallet-activity")
            }
          >
            Activity
          </a>

          <a
            href="#analytics"
            className={activeSection === "analytics" ? "active" : ""}
            aria-current={
              activeSection === "analytics" ? "location" : undefined
            }
            onClick={(event) => handleSectionNavClick(event, "analytics")}
          >
            Analytics
          </a>

          <a
            href="#accounts"
            className={activeSection === "accounts" ? "active" : ""}
            aria-current={activeSection === "accounts" ? "location" : undefined}
            onClick={(event) => handleSectionNavClick(event, "accounts")}
          >
            Accounts
          </a>

          {accounts.length > 0 && (
            <>
              <a
                href="#transactions"
                className={activeSection === "transactions" ? "active" : ""}
                aria-current={
                  activeSection === "transactions" ? "location" : undefined
                }
                onClick={(event) =>
                  handleSectionNavClick(event, "transactions")
                }
              >
                Transactions
              </a>

              <a
                href="#budgets"
                className={activeSection === "budgets" ? "active" : ""}
                aria-current={
                  activeSection === "budgets" ? "location" : undefined
                }
                onClick={(event) => handleSectionNavClick(event, "budgets")}
              >
                Budgets
              </a>
            </>
          )}
        </nav>
      )}

      {currentUser && (
        <section id="user">
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
                <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
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
        </section>
      )}

      {isLoadingData && (
        <div className="loading-strip" role="status">
          <span className="loading-dot" aria-hidden="true"></span>
          <p>Refreshing your dashboard...</p>
        </div>
      )}

      {dataError && (
        <div className="session-alert">
          <p>{dataError}</p>
        </div>
      )}

      {currentUser && (
        <section
          className={
            isSummaryUpdating
              ? "dashboard-summary is-updating"
              : "dashboard-summary"
          }
        >
          <h2 className="section-title">Wallet Summary</h2>

          {isLoadingData ? (
            <div className="summary-grid skeleton-grid" aria-hidden="true">
              {[1, 2, 3, 4].map((item) => (
                <div className="summary-card skeleton-card" key={item}>
                  <span className="skeleton skeleton-icon"></span>
                  <span className="skeleton skeleton-line short"></span>
                  <span className="skeleton skeleton-value"></span>
                  <span className="skeleton skeleton-line"></span>
                </div>
              ))}
            </div>
          ) : (
            <SummaryCards
              wallets={wallets}
              transactions={transactions}
              budgets={budgets}
              isUpdating={isSummaryUpdating}
            />
          )}
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
                  className={showWalletForm ? "action-toggle active" : "action-toggle"}
                  onClick={() => {
                    setShowWalletForm(!showWalletForm);
                    setShowDepositForm(false);
                    setShowTransferForm(false);
                  }}
                >
                  {showWalletForm ? (
                    <>
                      <X size={16} strokeWidth={1.9} aria-hidden="true" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
                      Add Wallet
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={showDepositForm ? "action-toggle active" : "action-toggle"}
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
                  {showDepositForm ? (
                    <>
                      <X size={16} strokeWidth={1.9} aria-hidden="true" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <ArrowDown size={16} strokeWidth={1.9} aria-hidden="true" />
                      Deposit
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={showTransferForm ? "action-toggle active" : "action-toggle"}
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
                  {showTransferForm ? (
                    <>
                      <X size={16} strokeWidth={1.9} aria-hidden="true" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Repeat2 size={16} strokeWidth={1.9} aria-hidden="true" />
                      Transfer
                    </>
                  )}
                </button>
              </div>
            </div>

            {showWalletForm && (
              <CreateWalletForm
                onWalletCreated={handleWalletCreated}
                onNotify={showToast}
              />
            )}

            {showDepositForm && (
              <DepositWalletForm
                wallets={wallets}
                onDepositCompleted={handleDepositCompleted}
                onNotify={showToast}
              />
            )}

            {showTransferForm && (
              <TransferWalletForm
                wallets={wallets}
                onTransferCompleted={handleTransferCompleted}
                onNotify={showToast}
              />
            )}

            <div className="card dashboard-card wallet-dashboard-card">
              {isLoadingData ? (
                <div className="wallet-grid wallet-skeleton-grid" aria-hidden="true">
                  {[1, 2].map((item) => (
                    <div className="wallet-card wallet-skeleton-card" key={item}>
                      <div className="wallet-card-header">
                        <span className="skeleton skeleton-icon"></span>
                        <span className="skeleton skeleton-pill"></span>
                      </div>
                      <span className="skeleton skeleton-value"></span>
                      <span className="skeleton skeleton-line"></span>
                      <span className="skeleton skeleton-line short"></span>
                    </div>
                  ))}
                </div>
              ) : wallets.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No wallets yet"
                  description="Create your first wallet to unlock deposits, transfers, and activity history."
                />
              ) : (
                <div className="wallet-grid">
                  {wallets.map((wallet) => {
                    const statusText = getWalletStatusText(wallet.status);
                    const statusClass =
                      statusText.toLowerCase() === "active" ? "active" : "muted";

                    return (
                      <article
                        className={
                          recentlyUpdatedWalletIds.includes(wallet.id)
                            ? "wallet-card balance-updated"
                            : "wallet-card"
                        }
                        key={wallet.id}
                        tabIndex="0"
                      >
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
                            aria-label={`Copy ${wallet.currency} wallet ID`}
                            title="Copy wallet ID"
                            onClick={() => copyWalletId(wallet.id)}
                          >
                            <Copy size={15} strokeWidth={1.9} aria-hidden="true" />
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
              onNotify={showToast}
            />
          </section>

          <section id="analytics">
            <div className="section-header">
              <div className="section-title-block">
                <h2>Analytics</h2>
                <p>Visual insights based on your transaction categories.</p>
              </div>
            </div>

            <Suspense fallback={<AnalyticsFallback />}>
              <AnalyticsPanel
                userId={currentUser.id}
                transactions={transactions}
              />
            </Suspense>
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
                {showAccountForm ? (
                  <>
                    <X size={16} strokeWidth={1.9} aria-hidden="true" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
                    Add Account
                  </>
                )}
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
                <EmptyState
                  icon={Landmark}
                  title="No accounts yet"
                  description="Add a wallet, bank account, or savings account to start organizing your finances."
                />
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
                    {showTransactionForm ? (
                      <>
                        <X size={16} strokeWidth={1.9} aria-hidden="true" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
                        Add Transaction
                      </>
                    )}
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
                    <EmptyState
                      icon={ReceiptText}
                      title="No transactions yet"
                      description="Add your first transaction to start tracking spending patterns."
                    />
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
                        <EmptyState
                          icon={Search}
                          title="No matching transactions"
                          description="Try adjusting the search term, category filter, or sort order."
                        />
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
                    {showBudgetForm ? (
                      <>
                        <X size={16} strokeWidth={1.9} aria-hidden="true" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
                        Add Budget
                      </>
                    )}
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
                    <EmptyState
                      icon={Target}
                      title="No budgets yet"
                      description="Create monthly category limits to keep spending visible."
                    />
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="footer">
        <p>FinTrack 2026</p>
        <span>Digital Wallet and Smart Finance Analytics Platform</span>
      </footer>
      </div>
    </>
  );
}

export default App;
