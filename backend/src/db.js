import { PrismaClient } from '@prisma/client'

function buildDatabaseUrlWithPoolDefaults(rawUrl) {
  if (!rawUrl) return rawUrl
  try {
    const parsed = new URL(rawUrl)
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT || '30')
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT || '20')
    }
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

const databaseUrl = buildDatabaseUrlWithPoolDefaults(process.env.DATABASE_URL)

const prisma = new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

export default prisma

