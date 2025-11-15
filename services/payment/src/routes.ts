import { FastifyInstance } from "fastify";

export async function paymentRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get("/health", async () => {
    return { status: "ok", service: "payment" };
  });

  // Payment routes - to be implemented
  fastify.post("/payment/intent", async (request, reply) => {
    reply.code(501).send({ error: "Not implemented yet" });
  });
}
