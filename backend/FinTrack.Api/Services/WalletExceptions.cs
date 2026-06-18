namespace FinTrack.Api.Services;

public class WalletNotFoundException : Exception
{
    public WalletNotFoundException(Guid walletId) : base($"Wallet {walletId} was not found.") { }
}

public class WalletOwnershipException : Exception
{
    public WalletOwnershipException(Guid walletId) : base($"Wallet {walletId} does not belong to the current user.") { }
}

public class WalletNotActiveException : Exception
{
    public WalletNotActiveException(Guid walletId) : base($"Wallet {walletId} is not active.") { }
}

public class CurrencyMismatchException : Exception
{
    public CurrencyMismatchException() : base("Currency does not match between wallets and request.") { }
}

public class InsufficientFundsException : Exception
{
    public InsufficientFundsException() : base("Source wallet has insufficient funds.") { }
}
