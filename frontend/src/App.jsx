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
import DashboardNav from "./components/DashboardNav";
import LandingPage from "./components/LandingPage";
import AnimatedCurrency from "./components/AnimatedCurrency";
import SpotlightCard from "./components/SpotlightCard";
import FadeContent from "./components/FadeContent";
import SetupProgress from "./components/SetupProgress";
import {
  Button,
  Card,
  SectionHeader,
  SelectInput,
  TextInput,
} from "./components/ui";

import {
  getWallets,
  getAccounts,
  getTransactions,
  getBudgets,
} from "./services/api";

import { getCategoryStyle } from "./utils/categoryStyles";

const AnalyticsPanel = lazy(() => import("./components/AnalyticsPanel"));
const Aurora = lazy(() => import("./components/Aurora"));
const DotGrid = lazy(() => import("./components/DotGrid"));

const DASHBOARD_AURORA_COLORS = ["#2458d3", "#0f8a5f", "#b9c8ff"];
const VALID_AUTH_MODES = new Set(["register", "signin"]);
const VALID_ACTION_PANELS = new Set([
  "wallet",
  "deposit",
  "transfer",
  "account",
  "transaction",
  "budget",
]);
const VALID_TRANSACTION_SORTS = new Set([
  "newest",
  "oldest",
  "highest",
  "lowest",
]);

function getInitialDashboardState() {
  if (typeof window === "undefined") {
    return {
      authMode: "register",
      panel: "",
      transactionSearch: "",
      transactionCategoryFilter: "All",
      transactionSort: "newest",
      activeSection: "user",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const authMode = params.get("auth");
  const panel = params.get("panel");
  const transactionSort = params.get("sort");
  const activeSection =
    window.location.hash.replace("#", "") || params.get("section") || "user";

  return {
    authMode: VALID_AUTH_MODES.has(authMode) ? authMode : "register",
    panel: VALID_ACTION_PANELS.has(panel) ? panel : "",
    transactionSearch: params.get("search") || "",
    transactionCategoryFilter: params.get("category") || "All",
    transactionSort: VALID_TRANSACTION_SORTS.has(transactionSort)
      ? transactionSort
      : "newest",
    activeSection,
  };
}

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

function AnalyticsFallback() {
  return (
    <Card className="analytics-card analytics-fallback" role="status">
      <div className="analytics-header">
        <p>Loading analytics workspace</p>
      </div>

      <div className="chart-container">
        <span className="skeleton skeleton-line short"></span>
        <span className="skeleton skeleton-value"></span>
        <span className="skeleton skeleton-line"></span>
        <span className="skeleton skeleton-line"></span>
      </div>
    </Card>
  );
}

function App() {
  const shouldReduceMotion = useReducedMotion();
  const [initialDashboardState] = useState(getInitialDashboardState);
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

  const [authMode, setAuthMode] = useState(initialDashboardState.authMode);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [walletActivityRefreshKey, setWalletActivityRefreshKey] = useState(0);
  const [copiedWalletId, setCopiedWalletId] = useState("");
  const [toasts, setToasts] = useState([]);
  const [recentlyUpdatedWalletIds, setRecentlyUpdatedWalletIds] = useState([]);
  const [isSummaryUpdating, setIsSummaryUpdating] = useState(false);

  const [showWalletForm, setShowWalletForm] = useState(
    initialDashboardState.panel === "wallet"
  );
  const [showDepositForm, setShowDepositForm] = useState(
    initialDashboardState.panel === "deposit"
  );
  const [showTransferForm, setShowTransferForm] = useState(
    initialDashboardState.panel === "transfer"
  );
  const [showAccountForm, setShowAccountForm] = useState(
    initialDashboardState.panel === "account"
  );
  const [showTransactionForm, setShowTransactionForm] = useState(
    initialDashboardState.panel === "transaction"
  );
  const [showBudgetForm, setShowBudgetForm] = useState(
    initialDashboardState.panel === "budget"
  );

  const [transactionSearch, setTransactionSearch] = useState(
    initialDashboardState.transactionSearch
  );
  const [transactionCategoryFilter, setTransactionCategoryFilter] =
    useState(initialDashboardState.transactionCategoryFilter);
  const [transactionSort, setTransactionSort] = useState(
    initialDashboardState.transactionSort
  );

  const [activeSection, setActiveSection] = useState(
    initialDashboardState.activeSection
  );

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

  const setActiveActionPanel = useCallback((panel = "") => {
    setShowWalletForm(panel === "wallet");
    setShowDepositForm(panel === "deposit");
    setShowTransferForm(panel === "transfer");
    setShowAccountForm(panel === "account");
    setShowTransactionForm(panel === "transaction");
    setShowBudgetForm(panel === "budget");
  }, []);

  const getOpenActionPanel = useCallback(() => {
    if (showWalletForm) return "wallet";
    if (showDepositForm) return "deposit";
    if (showTransferForm) return "transfer";
    if (showAccountForm) return "account";
    if (showTransactionForm) return "transaction";
    if (showBudgetForm) return "budget";
    return "";
  }, [
    showAccountForm,
    showBudgetForm,
    showDepositForm,
    showTransactionForm,
    showTransferForm,
    showWalletForm,
  ]);

  const scrollToSection = useCallback(
    (sectionId) => {
      const targetSection = document.getElementById(sectionId);

      if (!targetSection) {
        return;
      }

      const stickyOffset = window.matchMedia("(max-width: 640px)").matches
        ? 86
        : 104;
      const targetTop =
        targetSection.getBoundingClientRect().top +
        window.scrollY -
        stickyOffset;

      setActiveSection(sectionId);
      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    },
    [shouldReduceMotion]
  );

  const handleSectionNavClick = useCallback(
    (event, sectionId) => {
      event.preventDefault();

      scrollToSection(sectionId);

      if (window.location.hash !== `#${sectionId}`) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}#${sectionId}`
        );
      }
    },
    [scrollToSection]
  );

  const handleSetupStepAction = useCallback(
    (step) => {
      setActiveActionPanel(step.panel);

      window.requestAnimationFrame(() => {
        scrollToSection(step.sectionId);
      });
    },
    [scrollToSection, setActiveActionPanel]
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
      let hasShownSessionExpired = false;

      function handleLoadError(resourceName, err) {
        if (import.meta.env.DEV) {
          console.warn(`Failed to load ${resourceName}:`, err);
        }

        if (err.status === 401) {
          const message =
            "Your session expired. Please sign out and sign in again.";

          setDataError(message);
          if (!hasShownSessionExpired) {
            showToast({ type: "error", message });
            hasShownSessionExpired = true;
          }
          return;
        }

        showToast({
          type: "error",
          message: `Could not load ${resourceName}. ${err.message || ""}`.trim(),
        });
      }

      try {
        const walletsData = await getWallets();
        setWallets(Array.isArray(walletsData) ? walletsData : []);
      } catch (err) {
        handleLoadError("wallets", err);
      }

      try {
        const accountsData = await getAccounts(currentUser.id);
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      } catch (err) {
        handleLoadError("accounts", err);
      }

      try {
        const transactionsData = await getTransactions(currentUser.id);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (err) {
        handleLoadError("transactions", err);
      }

      try {
        const budgetsData = await getBudgets(currentUser.id);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
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

    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);
    let animationFrameId = 0;

    if (sections.length === 0) {
      return undefined;
    }

    const updateActiveSection = () => {
      animationFrameId = 0;

      const readingLine = Math.min(
        340,
        Math.max(156, window.innerHeight * 0.42)
      );
      let nextActiveSection = sections[0].id;

      for (const section of sections) {
        const { top, bottom } = section.getBoundingClientRect();

        if (top <= readingLine && bottom > readingLine) {
          nextActiveSection = section.id;
          break;
        }

        if (top <= readingLine) {
          nextActiveSection = section.id;
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
    };

    const scheduleActiveSectionUpdate = () => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateActiveSection);
    };

    scheduleActiveSectionUpdate();

    const observer = new IntersectionObserver(scheduleActiveSectionUpdate, {
      rootMargin: "-18% 0px -52% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    });

    sections.forEach((section) => observer.observe(section));

    window.addEventListener("resize", scheduleActiveSectionUpdate, {
      passive: true,
    });

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      observer.disconnect();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (!currentUser) {
      if (authMode === "signin") {
        params.set("auth", "signin");
      } else {
        params.delete("auth");
      }

      [
        "panel",
        "search",
        "category",
        "sort",
        "section",
      ].forEach((paramName) => params.delete(paramName));

      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${
        nextSearch ? `?${nextSearch}` : ""
      }${window.location.hash}`;

      if (
        `${window.location.pathname}${window.location.search}${window.location.hash}` !==
        nextUrl
      ) {
        window.history.replaceState(null, "", nextUrl);
      }

      return;
    }

    params.delete("auth");

    const openPanel = getOpenActionPanel();

    if (openPanel) {
      params.set("panel", openPanel);
    } else {
      params.delete("panel");
    }

    if (transactionSearch.trim()) {
      params.set("search", transactionSearch.trim());
    } else {
      params.delete("search");
    }

    if (transactionCategoryFilter && transactionCategoryFilter !== "All") {
      params.set("category", transactionCategoryFilter);
    } else {
      params.delete("category");
    }

    if (transactionSort && transactionSort !== "newest") {
      params.set("sort", transactionSort);
    } else {
      params.delete("sort");
    }

    if (activeSection && activeSection !== "user") {
      params.set("section", activeSection);
    } else {
      params.delete("section");
    }

    const nextSearch = params.toString();
    const nextHash = activeSection ? `#${activeSection}` : window.location.hash;
    const nextUrl = `${window.location.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${nextHash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [
    activeSection,
    authMode,
    currentUser,
    getOpenActionPanel,
    transactionCategoryFilter,
    transactionSearch,
    transactionSort,
  ]);

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
      if (import.meta.env.DEV) {
        console.warn("Failed to copy wallet ID:", err);
      }
      showToast({
        type: "error",
        message: "Could not copy wallet ID. You can select it manually.",
      });
    }
  }

  function handleProtectedActionError(actionName, err) {
    if (import.meta.env.DEV) {
      console.warn(`Failed to ${actionName}:`, err);
    }

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
    showToast({ type: "success", message: "Account created successfully." });
  }

  function handleTransactionCreated(transaction) {
    setTransactions((currentTransactions) => [
      transaction,
      ...currentTransactions,
    ]);
    setShowTransactionForm(false);
    showToast({ type: "success", message: "Transaction created successfully." });
  }

  function handleBudgetCreated(budget) {
    setBudgets((currentBudgets) => [budget, ...currentBudgets]);
    setShowBudgetForm(false);
    showToast({ type: "success", message: "Budget created successfully." });
  }

  function handleClearCurrentUser() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    window.history.replaceState(null, "", window.location.pathname);

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

  const walletCurrencyCount = new Set(
    wallets.map((wallet) => wallet.currency || "EUR")
  ).size;
  const connectedSpaceCount = wallets.length + accounts.length + budgets.length;
  const setupAreas = [
    { label: "Wallets", value: wallets.length },
    { label: "Accounts", value: accounts.length },
    { label: "Budgets", value: budgets.length },
  ];
  const activeSetupAreaCount = setupAreas.filter((area) => area.value > 0).length;

  return (
    <>
      {!shouldReduceMotion && (
        <Suspense fallback={null}>
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
            interactive
          />
        </Suspense>
      )}

      <div className={currentUser ? "app app-authenticated" : "app app-landing"}>
      <a className="skip-link" href="#main-content">
        Skip to Content
      </a>

      <header className="site-header">
        <a className="brand-lockup" href="#user" aria-label="FinTrack home">
          <span className="brand-mark">FT</span>
          <span>FinTrack</span>
        </a>

        <span className="site-status">
          {currentUser ? "Dashboard ready" : "Wallets, budgets, insights"}
        </span>
      </header>

      <main id="main-content">
      {!currentUser && (
        <LandingPage
          authMode={authMode}
          onAuthModeChange={setAuthMode}
          onNotify={showToast}
          shouldReduceMotion={shouldReduceMotion}
          onUserCreated={() => {
            setAuthMode("signin");
            showToast({
              type: "success",
              message: "Account created successfully. Please sign in.",
            });
          }}
          onUserSignedIn={(user) => {
            setCurrentUser(user);
            showToast({
              type: "success",
              message: "Signed in successfully.",
            });
          }}
        />
      )}

      {currentUser && (
        <motion.header
          className="dashboard-hero"
          initial={shouldReduceMotion ? false : "hidden"}
          animate="show"
          variants={heroContainer}
        >
          {!shouldReduceMotion && (
            <div className="hero-aurora-layer dashboard-aurora" aria-hidden="true">
              <Suspense fallback={null}>
                <Aurora
                  colorStops={DASHBOARD_AURORA_COLORS}
                  amplitude={0.34}
                  blend={0.22}
                  speed={0.22}
                />
              </Suspense>
            </div>
          )}

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
            <span>Connected Spaces</span>
            <strong>{connectedSpaceCount}</strong>
            <p>{activeSetupAreaCount} of 3 setup areas active</p>

            <div className="health-checklist" aria-label="Workspace setup status">
              {setupAreas.map((area) => (
                <div
                  className={area.value > 0 ? "health-row complete" : "health-row"}
                  key={area.label}
                >
                  <span>{area.label}</span>
                  <strong>{area.value}</strong>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.header>
      )}

      {currentUser && (
        <DashboardNav
          accountsLength={accounts.length}
          activeSection={activeSection}
          onNavigate={handleSectionNavClick}
        />
      )}

      {currentUser && (
        <FadeContent delay={0.02}>
          <SetupProgress
            wallets={wallets}
            accounts={accounts}
            transactions={transactions}
            budgets={budgets}
            onStepAction={handleSetupStepAction}
          />
        </FadeContent>
      )}

      {currentUser && (
        <section id="user">
          <FadeContent delay={0.04}>
            <Card className="profile-card">
              <div className="profile-main">
                <div className="profile-avatar">{getUserInitials()}</div>

                <div className="profile-info">
                  <p className="welcome-label">Workspace Overview</p>
                  <h2>Session and Setup</h2>
                  <p>Signed in as {currentUser.email}</p>
                </div>

                <Button
                  type="button"
                  className="sign-out-button"
                  onClick={handleClearCurrentUser}
                >
                  <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
                  Sign Out
                </Button>
              </div>

              <div className="profile-stats">
                <div>
                  <span>{wallets.length}</span>
                  <p>Wallets</p>
                </div>

                <div>
                  <span>{walletCurrencyCount}</span>
                  <p>Currencies</p>
                </div>

                <div>
                  <span>{budgets.length}</span>
                  <p>Budgets</p>
                </div>
              </div>
            </Card>
          </FadeContent>
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
          <FadeContent delay={0.08}>
            <h2 className="section-title">Money Overview</h2>

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
          </FadeContent>
        </section>
      )}

      {currentUser && (
        <>
          <section id="wallets">
            <FadeContent delay={0.1}>
              <SectionHeader
                className="wallet-section-header"
                title="Wallets"
                description="Create currency wallets, deposit funds, and move money."
                actions={
                  <>
                    <Button
                      type="button"
                      variant={
                        wallets.length === 0 || showWalletForm
                          ? "primary"
                          : "secondary"
                      }
                      className={
                        showWalletForm ? "action-toggle active" : "action-toggle"
                      }
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
                    </Button>

                    <Button
                      type="button"
                      variant={showDepositForm ? "primary" : "secondary"}
                      className={
                        showDepositForm
                          ? "action-toggle active"
                          : "action-toggle"
                      }
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
                          <ArrowDown
                            size={16}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                          Deposit
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant={showTransferForm ? "primary" : "secondary"}
                      className={
                        showTransferForm
                          ? "action-toggle active"
                          : "action-toggle"
                      }
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
                          <Repeat2
                            size={16}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                          Transfer
                        </>
                      )}
                    </Button>
                  </>
                }
              />

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

              <Card className="dashboard-card wallet-dashboard-card">
                {isLoadingData ? (
                  <div
                    className="wallet-grid wallet-skeleton-grid"
                    aria-hidden="true"
                  >
                    {[1, 2].map((item) => (
                      <div
                        className="wallet-card wallet-skeleton-card"
                        key={item}
                      >
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
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setShowWalletForm(true);
                        setShowDepositForm(false);
                        setShowTransferForm(false);
                      }}
                    >
                      <Plus size={16} strokeWidth={1.9} aria-hidden="true" />
                      Create First Wallet
                    </Button>
                  </EmptyState>
                ) : (
                  <div className="wallet-grid">
                    {wallets.map((wallet) => {
                      const statusText = getWalletStatusText(wallet.status);
                      const statusClass =
                        statusText.toLowerCase() === "active"
                          ? "active"
                          : "muted";

                      return (
                        <SpotlightCard
                          as="article"
                          className={
                            recentlyUpdatedWalletIds.includes(wallet.id)
                              ? "wallet-card balance-updated"
                              : "wallet-card"
                          }
                          spotlightColor="rgba(36, 88, 211, 0.12)"
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
                              <AnimatedCurrency
                                amount={getWalletBalance(wallet)}
                                currency={wallet.currency}
                                className="wallet-count-up"
                              />
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
                              <Copy
                                size={15}
                                strokeWidth={1.9}
                                aria-hidden="true"
                              />
                              {copiedWalletId === wallet.id ? "Copied" : "Copy ID"}
                            </button>
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </div>
                )}
              </Card>
            </FadeContent>
          </section>

          <section id="wallet-activity">
            <FadeContent delay={0.04}>
              <SectionHeader
                title="Wallet Activity"
                description="View deposits and transfers recorded for each wallet."
              />

              <WalletActivityPanel
                wallets={wallets}
                refreshKey={walletActivityRefreshKey}
                onNotify={showToast}
              />
            </FadeContent>
          </section>

          <section id="analytics">
            <FadeContent delay={0.04}>
              <SectionHeader
                title="Analytics"
                description="Visual insights based on your transaction categories."
              />

              <Suspense fallback={<AnalyticsFallback />}>
                <AnalyticsPanel
                  userId={currentUser.id}
                  transactions={transactions}
                />
              </Suspense>
            </FadeContent>
          </section>

          <section id="accounts" className="legacy-section">
            <FadeContent delay={0.04}>
              <SectionHeader
                title="Accounts"
                description="Connect bank accounts, cards, or savings spaces to organize your finances."
                actions={
                  <Button
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
                  </Button>
                }
              />

              {showAccountForm && (
                <CreateAccountForm
                  userId={currentUser.id}
                  onAccountCreated={handleAccountCreated}
                  onNotify={showToast}
                />
              )}

              <Card className="dashboard-card">
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

                            <small>
                              Created {formatDate(account.createdAt)}
                            </small>
                          </div>
                        </div>

                        <span className="badge">{account.currency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </FadeContent>
          </section>

          {accounts.length > 0 && (
            <>
              <section id="transactions" className="legacy-section">
                <FadeContent delay={0.04}>
                <SectionHeader
                  title="Transactions"
                  description="Track, search, filter and sort your spending activity."
                  actions={
                    <Button
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
                    </Button>
                  }
                />

                {showTransactionForm && (
                  <CreateTransactionForm
                    userId={currentUser.id}
                    accounts={accounts}
                    onTransactionCreated={handleTransactionCreated}
                    onNotify={showToast}
                  />
                )}

                <Card className="dashboard-card">
                  {transactions.length === 0 ? (
                    <EmptyState
                      icon={ReceiptText}
                      title="No transactions yet"
                      description="Add your first transaction to start tracking spending patterns."
                    />
                  ) : (
                    <>
                      <div className="transaction-tools">
                        <TextInput
                          type="text"
                          name="transaction-search"
                          aria-label="Search Transactions"
                          autoComplete="off"
                          placeholder="Search transactions..."
                          value={transactionSearch}
                          onChange={(e) =>
                            setTransactionSearch(e.target.value)
                          }
                        />

                        <SelectInput
                          name="transaction-category-filter"
                          aria-label="Filter Transactions by Category"
                          autoComplete="off"
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
                        </SelectInput>

                        <SelectInput
                          name="transaction-sort"
                          aria-label="Sort Transactions"
                          autoComplete="off"
                          value={transactionSort}
                          onChange={(e) => setTransactionSort(e.target.value)}
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                          <option value="highest">Highest amount</option>
                          <option value="lowest">Lowest amount</option>
                        </SelectInput>
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
                </Card>
                </FadeContent>
              </section>

              <section id="budgets" className="legacy-section">
                <FadeContent delay={0.04}>
                <SectionHeader
                  title="Budgets"
                  description="Set monthly limits and monitor how much budget remains."
                  actions={
                    <Button
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
                    </Button>
                  }
                />

                {showBudgetForm && (
                  <CreateBudgetForm
                    userId={currentUser.id}
                    onBudgetCreated={handleBudgetCreated}
                    onNotify={showToast}
                  />
                )}

                <Card className="dashboard-card">
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
                </Card>
                </FadeContent>
              </section>
            </>
          )}
        </>
      )}
      </main>

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
