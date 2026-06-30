using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace CentraLog.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Pass execution context along to the next downstream middleware agent block
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled execution block exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        // Match specific system exceptions directly to clean HTTP status codes
        context.Response.StatusCode = exception switch
        {
            InvalidOperationException => (int)HttpStatusCode.UnprocessableEntity, // Status 422: State check violation
            KeyNotFoundException => (int)HttpStatusCode.NotFound,               // Status 404: Missing target record
            UnauthorizedAccessException => (int)HttpStatusCode.Forbidden,        // Status 403: Role verification failure
            _ => (int)HttpStatusCode.InternalServerError                        // Status 500: Database deadlock or timeout
        };

        // Format a clear structural JSON error schema contract for the React frontend client
        var responsePayload = new
        {
            statusCode = context.Response.StatusCode,
            error = exception.Message,
            timestamp = DateTime.UtcNow
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(responsePayload, jsonOptions));
    }
}