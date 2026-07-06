const baseNavItems = [
  { id: "user", label: "User" },
  { id: "wallets", label: "Wallets" },
  { id: "wallet-activity", label: "Activity" },
  { id: "analytics", label: "Analytics" },
  { id: "accounts", label: "Accounts" },
];

const accountNavItems = [
  { id: "transactions", label: "Transactions" },
  { id: "budgets", label: "Budgets" },
];

function DashboardNav({ activeSection, accountsLength = 0, onNavigate }) {
  const navItems =
    accountsLength > 0 ? [...baseNavItems, ...accountNavItems] : baseNavItems;

  return (
    <div className="top-nav-shell">
      <nav className="top-nav" aria-label="Dashboard sections">
        {navItems.map((item) => (
          <a
            href={`#${item.id}`}
            className={activeSection === item.id ? "active" : ""}
            aria-current={activeSection === item.id ? "location" : undefined}
            key={item.id}
            onClick={(event) => onNavigate(event, item.id)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default DashboardNav;
