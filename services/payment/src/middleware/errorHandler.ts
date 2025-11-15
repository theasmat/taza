import { FastifyReply, FastifyRequest } from "fastify";

export async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  console.error("Error:", error);

  reply.status(500).send({
    error: "Internal Server Error",
    message: error.message,
  });
}
