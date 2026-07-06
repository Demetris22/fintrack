import { motion } from "motion/react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Landmark,
  ReceiptText,
  Repeat2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import heroImage from "../assets/hero.png";
import CreateUserForm from "./CreateUserForm";
import SignInForm from "./SignInForm";
import SummaryCards from "./SummaryCards";
import { Button } from "./ui";

const heroContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.05,
      staggerChildren: 0.08,
    },
  },
};

const heroItem = {
  hidden: { opacity: 0.94, y: 14 },
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

const featureCards = [
  {
    title: "Wallets with movement",
    description: "Create wallets, deposit funds, and transfer money without losing context.",
    icon: Wallet,
  },
  {
    title: "Activity that explains itself",
    description: "Review wallet activity, transaction categories, and filtered spending in one place.",
    icon: ReceiptText,
  },
  {
    title: "Budgets that stay visible",
    description: "Set monthly limits and see remaining spend before a category gets away from you.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Finance spaces connected",
    description: "Keep accounts, cards, and currency balances organized around the same profile.",
    icon: Landmark,
  },
];

const benefitItems = [
  { label: "Wallets", icon: Wallet },
  { label: "Transfers", icon: Repeat2 },
  { label: "Budgets", icon: ChartNoAxesCombined },
  { label: "Insights", icon: ReceiptText },
];

function LandingPage({
  authMode,
  onAuthModeChange,
  onUserCreated,
  onUserSignedIn,
  onNotify,
  shouldReduceMotion,
}) {
  function scrollToAuth(nextMode) {
    onAuthModeChange(nextMode);

    window.requestAnimationFrame(() => {
      document.getElementById("auth-panel")?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  }

  return (
    <>
      <motion.section
        id="user"
        className="landing-hero"
        initial={shouldReduceMotion ? false : "hidden"}
        animate="show"
        variants={heroContainer}
      >
        <div className="hero-copy landing-hero-copy">
          <motion.div className="hero-badge" variants={heroItem}>
            Smart finance workspace
          </motion.div>

          <motion.h1 variants={heroItem}>Track money clearly.</motion.h1>

          <motion.p variants={heroItem}>
            Create wallets, move funds, and spot spending.
          </motion.p>

          <motion.div className="landing-hero-actions" variants={heroItem}>
            <Button type="button" onClick={() => scrollToAuth("register")}>
              Create workspace
              <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => scrollToAuth("signin")}
            >
              Sign in
            </Button>
          </motion.div>

          <motion.ul className="landing-benefit-strip" variants={heroItem}>
            {benefitItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                  {item.label}
                </li>
              );
            })}
          </motion.ul>

          <motion.div className="hero-preview-summary" variants={heroItem}>
            <SummaryCards
              wallets={previewWallets}
              transactions={previewTransactions}
              budgets={previewBudgets}
            />
          </motion.div>
        </div>

        <motion.div id="auth-panel" className="auth-panel" variants={heroItem}>
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
              onClick={() => onAuthModeChange("register")}
            >
              Register
            </button>

            <button
              type="button"
              className={authMode === "signin" ? "active" : ""}
              onClick={() => onAuthModeChange("signin")}
            >
              Sign In
            </button>
          </div>

          {authMode === "register" ? (
            <CreateUserForm onUserCreated={onUserCreated} onNotify={onNotify} />
          ) : (
            <SignInForm onUserSignedIn={onUserSignedIn} onNotify={onNotify} />
          )}
        </motion.div>
      </motion.section>

      <motion.section
        className="landing-feature-section"
        initial={shouldReduceMotion ? false : { opacity: 0.96, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.24 }}
        transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="landing-section-copy">
          <h2>Designed for the money you actually move.</h2>
          <p>
            FinTrack keeps the daily tasks close together: balances, deposits,
            transfers, budgets, and spending signals.
          </p>
        </div>

        <div className="landing-feature-grid">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                className="landing-feature-card"
                key={feature.title}
                style={{ "--feature-index": index }}
              >
                <span className="landing-feature-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.9} />
                </span>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </motion.section>

      <motion.section
        className="landing-cta-panel"
        initial={shouldReduceMotion ? false : { opacity: 0.96, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.64, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <ShieldCheck size={24} strokeWidth={1.9} aria-hidden="true" />
          <h2>Start with one wallet. Add the rest as your workflow grows.</h2>
          <p>
            The dashboard opens up as you create wallets, accounts,
            transactions, and budgets.
          </p>
        </div>

        <Button type="button" onClick={() => scrollToAuth("register")}>
          Create workspace
        </Button>
      </motion.section>
    </>
  );
}

export default LandingPage;
