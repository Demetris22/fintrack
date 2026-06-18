using FinTrack.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinTrack.Api.Data;

public class FinTrackDbContext : DbContext
{
    public FinTrackDbContext(DbContextOptions<FinTrackDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<LedgerTransaction> LedgerTransactions => Set<LedgerTransaction>();
    public DbSet<LedgerPosting> LedgerPostings => Set<LedgerPosting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Name).IsRequired();
            entity.Property(a => a.AccountType).IsRequired();
            entity.Property(a => a.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("EUR");
            entity.Property(a => a.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            entity.HasOne(a => a.User)
                .WithMany(u => u.Accounts)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("transactions");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Amount).HasPrecision(14, 2);
            entity.Property(t => t.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("EUR");
            entity.Property(t => t.TransactionDate).HasColumnType("date");
            entity.Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            entity.HasOne(t => t.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Account)
                .WithMany(a => a.Transactions)
                .HasForeignKey(t => t.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.ToTable("budgets");
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Category).IsRequired();
            entity.Property(b => b.MonthlyLimit).HasPrecision(14, 2);
            entity.Property(b => b.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("EUR");
            entity.Property(b => b.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            entity.HasOne(b => b.User)
                .WithMany(u => u.Budgets)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(b => new { b.UserId, b.Category }).IsUnique();
        });

        modelBuilder.Entity<Wallet>(entity =>
        {
            entity.ToTable("wallets");
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Name).IsRequired().HasMaxLength(100);
            entity.Property(w => w.Currency).IsRequired().HasMaxLength(3);
            entity.Property(w => w.Status).IsRequired().HasMaxLength(20).HasDefaultValue("active");
            entity.Property(w => w.IsSystem).HasDefaultValue(false);
            entity.Property(w => w.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");
            entity.Property(w => w.Version).IsConcurrencyToken();

            entity.HasOne(w => w.User)
                .WithMany(u => u.Wallets)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Users may hold multiple wallets per currency. Only the single internal
            // system wallet per currency (used to fund simulated deposits) is constrained.
            entity.HasIndex(w => w.UserId);
            entity.HasIndex(w => w.Currency)
                .IsUnique()
                .HasFilter("\"IsSystem\" = true");
        });

        modelBuilder.Entity<LedgerTransaction>(entity =>
        {
            entity.ToTable("ledger_transactions");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Type).IsRequired().HasMaxLength(20);
            entity.Property(t => t.Status).IsRequired().HasMaxLength(20).HasDefaultValue("posted");
            entity.Property(t => t.Currency).IsRequired().HasMaxLength(3);
            entity.Property(t => t.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            entity.HasOne(t => t.SourceWallet)
                .WithMany(w => w.OutgoingTransactions)
                .HasForeignKey(t => t.SourceWalletId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.DestinationWallet)
                .WithMany(w => w.IncomingTransactions)
                .HasForeignKey(t => t.DestinationWalletId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(t => t.SourceWalletId);
            entity.HasIndex(t => t.DestinationWalletId);
        });

        modelBuilder.Entity<LedgerPosting>(entity =>
        {
            entity.ToTable("ledger_postings");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Direction).IsRequired().HasMaxLength(10);
            entity.Property(p => p.Currency).IsRequired().HasMaxLength(3);
            entity.Property(p => p.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()");

            entity.HasOne(p => p.LedgerTransaction)
                .WithMany(t => t.Postings)
                .HasForeignKey(p => p.LedgerTransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Wallet)
                .WithMany(w => w.Postings)
                .HasForeignKey(p => p.WalletId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.WalletId);
        });
    }
}
