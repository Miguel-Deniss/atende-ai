#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Seeding database..."
npx tsx prisma/seed.ts

echo "Migrations completed successfully"
