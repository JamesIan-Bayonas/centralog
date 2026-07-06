namespace CentraLog.Core.DTOs
{
    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;

        // The secure cryptographically encrypted JWT bearer string passed to the client
        public string Token { get; set; } = string.Empty;
    }
}