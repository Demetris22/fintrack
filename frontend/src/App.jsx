import { useState } from "react";
import "./App.css";
import CreateUserForm from "./components/CreateUserForm";
import CreateAccountForm from "./components/CreateAccountForm";
import CreateTransactionForm from "./components/CreateTransactionForm";
import CreateBudgetForm from "./components/CreateBudgetForm";
import AnalyticsPanel from "./components/AnalyticsPanel";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);

  function handleAccountCreated(account) {
    setAccounts([account, ...accounts]);
  }

  function handleTransactionCreated(transaction) {
    setTransactions([transaction, ...transactions]);
  }

  function handleBudgetCreated(budget) {
    setBudgets([budget, ...budgets]);
  }

  return (
    <div className="app">
      <h1>FinTrack</h1>
      <p>Digital Wallet & Smart Finance Analytics Platform</p>

      <nav className="top-nav">
        <a href="#user">User</a>
        <a href="#accounts">Accounts</a>
        <a href="#transactions">Transactions</a>
        <a href="#budgets">Budgets</a>
        <a href="#analytics">Analytics</a>
      </nav>

  <section id="user">
  {!currentUser && <CreateUserForm onUserCreated={setCurrentUser} />}

  {currentUser && (
    <div className="card">
      <h2>Current User</h2>

      <p>
        <strong>ID:</strong> {currentUser.id}
      </p>

      <p>
        <strong>Email:</strong> {currentUser.email}
      </p>

      <p>
        <strong>Full Name:</strong> {currentUser.fullName || "Not provided"}
      </p>
    </div>
  )}
</section>

      {currentUser && (
        <>
          <section id="accounts">
            <CreateAccountForm
              userId={currentUser.id}
              onAccountCreated={handleAccountCreated}
            />

            <div className="card">
              <h2>Accounts</h2>

              {accounts.length === 0 ? (
                <p>No accounts created yet.</p>
              ) : (
                <ul>
                  {accounts.map((account) => (
                    <li key={account.id}>
                      {account.name} - {account.accountType} -{" "}
                      {account.currency}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {accounts.length > 0 && (
            <>
              <section id="transactions">
                <CreateTransactionForm
                  userId={currentUser.id}
                  accounts={accounts}
                  onTransactionCreated={handleTransactionCreated}
                />

                <div className="card">
                  <h2>Transactions</h2>

                  {transactions.length === 0 ? (
                    <p>No transactions created yet.</p>
                  ) : (
                    <ul>
                      {transactions.map((transaction) => (
                        <li key={transaction.id}>
                          {transaction.transactionDate} -{" "}
                          {transaction.category} - €{transaction.amount} -{" "}
                          {transaction.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section id="budgets">
                <CreateBudgetForm
                  userId={currentUser.id}
                  onBudgetCreated={handleBudgetCreated}
                />

                <div className="card">
                  <h2>Budgets</h2>

                  {budgets.length === 0 ? (
                    <p>No budgets created yet.</p>
                  ) : (
                    <ul>
                      {budgets.map((budget) => (
                        <li key={budget.id}>
                          {budget.category} - €{budget.monthlyLimit} / month
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section id="analytics">
                <AnalyticsPanel userId={currentUser.id} />
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;