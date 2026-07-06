using System;
using CentraLog.Core.Domain.Enums;

namespace CentraLog.Core.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Storing pre-hashed protection secrets for verification checks
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.GeneralStaff;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}