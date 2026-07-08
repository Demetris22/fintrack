import { Check, Circle, Landmark, ReceiptText, Target, Wallet } from "lucide-react";
import { Button, Card } from "./ui";

const setupSteps = [
  {
    id: "wallet",
    label: "Create Wallet",
    description: "Start with a currency wallet.",
    sectionId: "wallets",
    panel: "wallet",
    Icon: Wallet,
  },
  {
    id: "funds",
    label: "Add Funds",
    description: "Deposit money into a wallet.",
    sectionId: "wallets",
    panel: "deposit",
    Icon: Wallet,
  },
  {
    id: "account",
    label: "Add Account",
    description: "Connect a finance space.",
    sectionId: "accounts",
    panel: "account",
    Icon: Landmark,
  },
  {
    id: "spending",
    label: "Log Spending",
    description: "Track one transaction.",
    sectionId: "transactions",
    panel: "transaction",
    Icon: ReceiptText,
  },
  {
    id: "budget",
    label: "Set Budget",
    description: "Create a monthly limit.",
    sectionId: "budgets",
    panel: "budget",
    Icon: Target,
  },
];

function getWalletBalance(wallet) {
  return Number(
    wallet.balance ??
      wallet.availableBalance ??
      wallet.currentBalance ??
      wallet.amount ??
      0
  );
}

function SetupProgress({
  wallets = [],
  accounts = [],
  transactions = [],
  budgets = [],
  onStepAction,
}) {
  const hasFundedWallet = wallets.some((wallet) => getWalletBalance(wallet) > 0);

  const completionByStep = {
    wallet: wallets.length > 0,
    funds: hasFundedWallet,
    account: accounts.length > 0,
    spending: transactions.length > 0,
    budget: budgets.length > 0,
  };

  const completedCount = setupSteps.filter(
    (step) => completionByStep[step.id]
  ).length;
  const progressPercent = Math.round((completedCount / setupSteps.length) * 100);
  const nextStep =
    setupSteps.find((step) => !completionByStep[step.id]) ||
    setupSteps[setupSteps.length - 1];

  return (
    <Card className="setup-progress-card" as="section" aria-labelledby="setup-title">
      <div className="setup-progress-copy">
        <p className="welcome-label">Setup Progress</p>
        <h2 id="setup-title">
          {completedCount === setupSteps.length
            ? "Your workspace is ready."
            : `Next up: ${nextStep.label}.`}
        </h2>
        <p>
          Complete the core workflow to unlock a fuller finance picture across
          wallets, accounts, spending, and budgets.
        </p>
      </div>

      <div className="setup-progress-meter" aria-label={`${progressPercent}% complete`}>
        <div>
          <span>{completedCount} of {setupSteps.length}</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="setup-progress-track">
          <span style={{ width: `${progressPercent}%` }}></span>
        </div>
      </div>

      <div className="setup-step-grid">
        {setupSteps.map((step) => {
          const isComplete = completionByStep[step.id];
          const isDisabled =
            (step.id === "funds" && wallets.length === 0) ||
            (step.id === "spending" && accounts.length === 0) ||
            (step.id === "budget" && accounts.length === 0);
          const Icon = step.Icon;

          return (
            <button
              type="button"
              className={isComplete ? "setup-step complete" : "setup-step"}
              key={step.id}
              disabled={isDisabled}
              onClick={() => onStepAction?.(step)}
            >
              <span className="setup-step-icon" aria-hidden="true">
                {isComplete ? (
                  <Check size={15} strokeWidth={2.2} />
                ) : (
                  <Icon size={16} strokeWidth={1.9} />
                )}
              </span>

              <span>
                <strong>{step.label}</strong>
                <small>{isDisabled ? "Complete earlier steps first" : step.description}</small>
              </span>

              <Circle className="setup-step-dot" size={10} strokeWidth={2} aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {completedCount < setupSteps.length && (
        <Button
          type="button"
          variant="secondary"
          className="setup-progress-action"
          onClick={() => onStepAction?.(nextStep)}
        >
          Continue Setup
        </Button>
      )}
    </Card>
  );
}

export default SetupProgress;
