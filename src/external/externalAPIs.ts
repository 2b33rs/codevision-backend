import 'dotenv/config'

export const MAWI_API_URL =
  process.env.MAWI_API_URL ??
  'https://mawi-backend-atfhg6amfbcfgmd5.swedencentral-01.azurewebsites.net'

export const PRODUCTION_API_URL =
  process.env.PRODUCTION_API_URL ??
  'https://backend-your-shirt-gmbh-production.up.railway.app'
