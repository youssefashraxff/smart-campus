using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SmartCampus.Shared;

namespace Gateway.Controllers;

/// <summary>FR-C3: one call from Angular, two services queried in parallel.</summary>
[ApiController]
[Route("api/dashboard")]
public class DashboardController(IHttpClientFactory http) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var bookingsTask = Forward(ServiceNames.Bookings, "/api/bookings/mine?status=active");
        var alertsTask = Forward(ServiceNames.Notifications, "/api/notifications/mine?unread=true");

        await Task.WhenAll(bookingsTask, alertsTask);

        return Ok(new
        {
            upcomingBookings = bookingsTask.Result,
            unreadAlerts = alertsTask.Result,
        });
    }

    /// <summary>Calls a service with the caller's identity; returns null if that service is down (NFR-4).</summary>
    private async Task<JsonElement?> Forward(string service, string path)
    {
        var client = http.CreateClient(service);
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        foreach (var header in new[] { "Authorization", "X-User-Id" })
            if (Request.Headers.TryGetValue(header, out var value))
                request.Headers.TryAddWithoutValidation(header, value.ToString());

        try
        {
            using var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}
