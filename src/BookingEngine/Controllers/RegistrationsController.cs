using Microsoft.AspNetCore.Mvc;

namespace BookingEngine.Controllers;

[ApiController]
[Route("api/registrations")]
public class RegistrationsController : ControllerBase
{
    // TODO FR-U6: POST   — register for an event; reject when full (409) or already registered (409)
    // TODO FR-U8: DELETE /{id} — cancel own registration
}
