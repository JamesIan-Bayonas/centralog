using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CentraLog.Core.Domain.Entities;
using CentraLog.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace CentraLog.Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly SymmetricSecurityKey _key;

        public TokenService(IConfiguration config)
        {
            var tokenSecret = config["JwtSettings:TokenKey"];
            if (string.IsNullOrEmpty(tokenSecret))
            {
                throw new InvalidOperationException("Critical Security Cryptography Failure: JWT Token signing key is missing from appsettings configuration files.");
            }

            // Generate the symmetric key array from our string secret
            _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenSecret));
        }

        public string CreateToken(User user)
        {
            // Set up the explicit identification claims required for our RBAC gates
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            // Sign the credentials using the cryptographic HMAC-SHA256 algorithm
            var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256Signature);

            // Construct the blueprint properties of the session token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7), // Token expires naturally after 1 week
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}