using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CentraLog.Core.DTOs;
using CentraLog.Core.Interfaces;
using CentraLog.Infrastructure.Data;

namespace CentraLog.API.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(ApplicationDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            // Locates user matching credential parameters
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == dto.UsernameOrEmail.Trim()
                                       || u.Email == dto.UsernameOrEmail.Trim());

            if (user == null)
            {
                return Unauthorized(new { message = "Authentication Failed: Invalid username or password." });
            }

            // Validates database hash compatibility bounds
            var incomingHash = ComputeSecureHash(dto.Password);
            if (user.PasswordHash != incomingHash)
            {
                return Unauthorized(new { message = "Authentication Failed: Invalid username or password." });
            }

            // Issue the signed JWT passport
            var tokenString = _tokenService.CreateToken(user);

            var response = new AuthResponseDto
            {
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                RoleName = user.Role.ToString(),
                Token = tokenString
            };

            return Ok(response);
        }

        private static string ComputeSecureHash(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes).ToLower();
        }
    }
}