using SmartCampus.Shared;

var builder = DistributedApplication.CreateBuilder(args);

// Native PostgreSQL on your Mac (no Docker). Value comes from appsettings.json → ConnectionStrings:campusdb
var db = builder.AddConnectionString(ServiceNames.Database);

var auth = builder.AddProject<Projects.AuthService>(ServiceNames.Auth)
    .WithReference(db);

var catalog = builder.AddProject<Projects.FacilityCatalog>(ServiceNames.Catalog)
    .WithReference(db);

var notifications = builder.AddProject<Projects.NotificationService>(ServiceNames.Notifications)
    .WithReference(db);

var bookings = builder.AddProject<Projects.BookingEngine>(ServiceNames.Bookings)
    .WithReference(db)
    .WithReference(catalog)        // checks facility status
    .WithReference(notifications); // sends confirmations

builder.AddProject<Projects.Gateway>("gateway")
    .WithReference(auth)
    .WithReference(catalog)
    .WithReference(bookings)
    .WithReference(notifications)
    .WithExternalHttpEndpoints();

// Angular frontend: run `aspire add javascript` once, then uncomment:
// builder.AddJavaScriptApp("frontend", "../../frontend", "start");

builder.Build().Run();
