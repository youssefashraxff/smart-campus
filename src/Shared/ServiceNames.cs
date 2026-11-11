namespace SmartCampus.Shared;

/// <summary>
/// Logical service names. The AppHost registers each service under these names and
/// service discovery resolves "http://bookings" etc. to the real address at runtime.
/// </summary>
public static class ServiceNames
{
    public const string Auth = "auth";
    public const string Catalog = "catalog";
    public const string Bookings = "bookings";
    public const string Notifications = "notifications";

    /// <summary>Connection string name for the shared PostgreSQL database.</summary>
    public const string Database = "campusdb";
}
