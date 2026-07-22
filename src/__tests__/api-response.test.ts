import { describe, it, expect } from "vitest";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
} from "@/lib/auth/api-response";

async function getJson(response: Response) {
  return response.json();
}

describe("API Responses", () => {
  it("successResponse should return 200 with data", async () => {
    const res = successResponse({ id: 1, name: "test" });
    expect(res.status).toBe(200);
    const json = await getJson(res);
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ id: 1, name: "test" });
  });

  it("successResponse should support custom status", async () => {
    const res = successResponse({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });

  it("errorResponse should return 400 with message", async () => {
    const res = errorResponse("Invalid input");
    expect(res.status).toBe(400);
    const json = await getJson(res);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Invalid input");
  });

  it("errorResponse should support custom status", async () => {
    const res = errorResponse("Not found", 404);
    expect(res.status).toBe(404);
  });

  it("unauthorizedResponse should return 401", async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const json = await getJson(res);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });

  it("unauthorizedResponse should support custom message", async () => {
    const res = unauthorizedResponse("Custom error");
    const json = await getJson(res);
    expect(json.error).toBe("Custom error");
  });

  it("forbiddenResponse should return 403", async () => {
    const res = forbiddenResponse();
    expect(res.status).toBe(403);
    const json = await getJson(res);
    expect(json.success).toBe(false);
  });

  it("forbiddenResponse should support custom message", async () => {
    const res = forbiddenResponse("Custom forbidden");
    const json = await getJson(res);
    expect(json.error).toBe("Custom forbidden");
  });

  it("notFoundResponse should return 404", async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    const json = await getJson(res);
    expect(json.success).toBe(false);
  });

  it("notFoundResponse should support custom message", async () => {
    const res = notFoundResponse("User not found");
    const json = await getJson(res);
    expect(json.error).toBe("User not found");
  });

  it("rateLimitResponse should return 429", async () => {
    const res = rateLimitResponse();
    expect(res.status).toBe(429);
    const json = await getJson(res);
    expect(json.success).toBe(false);
  });
});
