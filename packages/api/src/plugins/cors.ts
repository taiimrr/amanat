import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'

export const corsPlugin = fp(async (app) => {
  await app.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'development'
      ? ['http://localhost:5173']
      : (process.env.FRONTEND_URL ?? '').split(','),
    credentials: true,
  })
})
