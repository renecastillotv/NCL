import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';

// Import modules
import properties from './modules/properties/routes';
import contacts from './modules/contacts/routes';
import deals from './modules/deals/routes';
import users from './modules/users/routes';
import tenants from './modules/tenants/routes';

import { errorResponse } from './lib/errors';

// ============================================================================
// CLIC CRM API
// Multi-tenant Real Estate CRM API
// ============================================================================

const app = new Hono();

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from these origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4321',
      'https://clicinmobiliaria.com',
      'https://www.clicinmobiliaria.com',
      'https://app.clicinmobiliaria.com',
      'https://crm.clicinmobiliaria.com',
    ];

    // Allow any subdomain of clicinmobiliaria.com
    if (origin && (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.clicinmobiliaria.com') ||
      origin.endsWith('.vercel.app')
    )) {
      return origin;
    }

    return allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  exposeHeaders: ['X-Total-Count', 'X-Page', 'X-Limit', 'X-Subscription-Warning'],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Security headers
app.use('*', secureHeaders());

// Request logging
app.use('*', logger());

// Request ID middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') || crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  await next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/', (c) => {
  return c.json({
    name: 'CLIC CRM API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

const api = new Hono();

// Mount modules
api.route('/properties', properties);
api.route('/contacts', contacts);
api.route('/deals', deals);
api.route('/users', users);
api.route('/tenants', tenants);

// Mount API under /api/v1
app.route('/api/v1', api);

// ============================================================================
// WEBHOOKS
// ============================================================================

// Clerk webhook for user/org sync
app.post('/webhooks/clerk', async (c) => {
  const payload = await c.req.json();
  const eventType = payload.type;

  console.log('Clerk webhook:', eventType);

  // Handle different event types
  switch (eventType) {
    case 'user.created':
    case 'user.updated':
      // Sync user data
      break;

    case 'organization.created':
      // New org created
      break;

    case 'organizationMembership.created':
      // User added to org
      break;

    case 'organizationMembership.deleted':
      // User removed from org
      break;

    default:
      console.log('Unhandled webhook event:', eventType);
  }

  return c.json({ received: true });
});

// Stripe webhook for payments
app.post('/webhooks/stripe', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('stripe-signature');

  // TODO: Verify signature and handle events
  console.log('Stripe webhook received');

  return c.json({ received: true });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.onError((err, c) => {
  console.error('Error:', err);

  const response = errorResponse(err);
  return c.json(response, (err as HTTPException).status || 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  }, 404);
});

// ============================================================================
// SERVER
// ============================================================================

const port = parseInt(process.env.PORT || '3001', 10);

// For local development
if (process.env.NODE_ENV !== 'production') {
  console.log(`🚀 CLIC CRM API starting on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`📍 API: http://localhost:${port}/api/v1`);

  serve({
    fetch: app.fetch,
    port,
  });
}

// Export for serverless (Vercel)
export default app;
