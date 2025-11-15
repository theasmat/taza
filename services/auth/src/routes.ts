import { FastifyInstance } from "fastify";
import { authController } from "./controllers/authController";
import { authenticate } from "./middleware/auth";

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post(
    "/register",
    {
      schema: {
        description: "Register a new user",
        tags: ["auth"],
        response: {
          201: {
            description: "User registered successfully",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  roles: { type: "array", items: { type: "string" } },
                },
              },
              message: { type: "string" },
            },
          },
          409: {
            description: "User already exists",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.register
  );

  fastify.post(
    "/login",
    {
      schema: {
        description: "Login user and get JWT tokens",
        tags: ["auth"],
        response: {
          200: {
            description: "Login successful",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  roles: { type: "array", items: { type: "string" } },
                },
              },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
          401: {
            description: "Invalid credentials",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.login
  );

  fastify.post(
    "/token/refresh",
    {
      schema: {
        description: "Refresh access token using refresh token",
        tags: ["auth"],
        response: {
          200: {
            description: "Token refreshed successfully",
            type: "object",
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
          401: {
            description: "Invalid or expired refresh token",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.refreshToken
  );

  // Protected routes
  fastify.get(
    "/me",
    {
      preHandler: authenticate,
      schema: {
        description: "Get current user profile",
        tags: ["auth"],
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            description: "User profile",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          401: {
            description: "Unauthorized",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.getProfile
  );

  fastify.put(
    "/me",
    {
      preHandler: authenticate,
      schema: {
        description: "Update current user profile",
        tags: ["auth"],
        security: [{ BearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Profile updated successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              phone: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    authController.updateProfile
  );

  fastify.post(
    "/logout",
    {
      preHandler: authenticate,
      schema: {
        description: "Logout user and invalidate tokens",
        tags: ["auth"],
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            description: "Logout successful",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.logout
  );

  // Admin routes (require admin role)
  fastify.get(
    "/users",
    {
      preHandler: [authenticate, requireRole(["admin"])],
      schema: {
        description: "Get all users (Admin only)",
        tags: ["admin"],
        security: [{ BearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, maximum: 100, default: 20 },
            search: { type: "string" },
            role: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Users list",
            type: "object",
            properties: {
              users: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    name: { type: "string" },
                    roles: { type: "array", items: { type: "string" } },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  pages: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    authController.getUsers
  );

  fastify.get(
    "/users/:id",
    {
      preHandler: [authenticate, requireRole(["admin"])],
      schema: {
        description: "Get user by ID (Admin only)",
        tags: ["admin"],
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            description: "User details",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              phone: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    authController.getUserById
  );

  fastify.put(
    "/users/:id/roles",
    {
      preHandler: [authenticate, requireRole(["admin"])],
      schema: {
        description: "Update user roles (Admin only)",
        tags: ["admin"],
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            roles: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "customer",
                  "vendor",
                  "warehouse_staff",
                  "rider",
                  "admin",
                ],
              },
            },
          },
        },
        response: {
          200: {
            description: "Roles updated successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string" },
              name: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    authController.updateUserRoles
  );
}

function requireRole(roles: string[]) {
  return (request: any, reply: any, done: any) => {
    if (!request.user) {
      reply
        .status(401)
        .send({ error: "Unauthorized", message: "User not authenticated" });
      return;
    }

    const hasRole = request.user.roles.some((role: string) =>
      roles.includes(role)
    );
    if (!hasRole) {
      reply
        .status(403)
        .send({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }

    done();
  };
}
