using System;

namespace CentraLog.Core.DTOs
{
    public class DisposeAssetCommandDto
    {
        // Explicitly recording the justification for corporate compliance
        public string DisposalReason { get; set; } = string.Empty;

        // Optional override tracking if the device was sold for scrap value
        public decimal ScrapRecoveryValue { get; set; } = 0.00m;
    }
}