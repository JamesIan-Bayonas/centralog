using System.ComponentModel.DataAnnotations;

namespace CentraLog.Core.DTOs
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "Username or Email identification is mandatory.")]
        public string UsernameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Account password verification token is required.")]
        public string Password { get; set; } = string.Empty;
    }
}