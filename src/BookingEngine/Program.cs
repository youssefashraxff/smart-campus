using Microsoft.EntityFrameworkCore;
using BookingEngine.Data;
using SmartCampus.Shared;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(ServiceNames.Database),
        npgsql => npgsql.MigrationsHistoryTable("__EFMigrationsHistory_BookingEngine")));

// Typed clients to other services, resolved by service discovery (http://catalog, http://notifications)
builder.Services.AddHttpClient("catalog", c => c.BaseAddress = new Uri($"http://{ServiceNames.Catalog}"));
builder.Services.AddHttpClient("notifications", c => c.BaseAddress = new Uri($"http://{ServiceNames.Notifications}"));

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
