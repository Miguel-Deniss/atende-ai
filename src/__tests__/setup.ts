import { beforeAll, afterAll } from "vitest";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/atendeai_test?schema=public";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
process.env.SIGNED_URL_SECRET = "test-signed-url-secret";
process.env.NODE_ENV = "test";
process.env.APP_URL = "http://localhost:3000";

beforeAll(() => {});

afterAll(() => {});
