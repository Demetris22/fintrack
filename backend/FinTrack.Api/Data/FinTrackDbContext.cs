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
    }
}
