namespace CentraLog.Core.DTOs
{
    public class GetAssetsQueryFilterDto
    {
        // Global search term to match against Asset Name or Category Tag
        public string? SearchTerm { get; set; }

        // Optional filter to restrict results to a specific physical location
        public int? RoomId { get; set; }

        // Optional filter to look up assets assigned to a single person
        public int? CustodianId { get; set; }

        // Optional filter to check item health state (1 = Active, 2 = InRepair, 3 = Decommissioned)
        public int? LifecycleState { get; set; }

        // --- Server-Side Pagination Variables ---

        private int _pageNumber = 1;
        private int _pageSize = 10;
        private const int MaxPageSize = 50; // Performance safeguard limit

        public int PageNumber
        {
            get => _pageNumber;
            set => _pageNumber = (value < 1) ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value < 1) ? 10 : (value > MaxPageSize) ? MaxPageSize : value;
        }
    }
}