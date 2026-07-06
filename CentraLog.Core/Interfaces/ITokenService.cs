using CentraLog.Core.Domain.Entities;

namespace CentraLog.Core.Interfaces
{
    public interface ITokenService
    {
        // Generates a cryptographically signed token containing user identity and RBAC claims
        string CreateToken(User user);
    }
}