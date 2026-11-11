using SmartCampus.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// CORS: only the Angular dev server may call the gateway from a browser
const string AngularPolicy = "Angular";
builder.Services.AddCors(o => o.AddPolicy(AngularPolicy, p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Routing: pass-through routes defined in appsettings.json → ReverseProxy (YARP)
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddServiceDiscoveryDestinationResolver();

// Aggregation: named clients used by DashboardController
builder.Services.AddHttpClient(ServiceNames.Bookings, c => c.BaseAddress = new Uri($"http://{ServiceNames.Bookings}"));
builder.Services.AddHttpClient(ServiceNames.Notifications, c => c.BaseAddress = new Uri($"http://{ServiceNames.Notifications}"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(AngularPolicy);

// TODO FR-C4: validate the JWT here once Auth issues tokens

app.MapControllers();                                   // aggregated endpoints (composition)
app.MapReverseProxy().RequireCors(AngularPolicy);       // everything else is forwarded

app.Run();
