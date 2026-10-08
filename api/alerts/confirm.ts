import { db } from '../../server/db.js'
import { appUrl } from '../../server/env.js'
import { confirmAlert } from '../../server/alerts/repo.js'
import { param, redirect } from '../../server/http.js'

/** GET /api/alerts/confirm?token=... (link do e-mail) → página "meus alertas". */
export async function GET(req: Request): Promise<Response> {
  const token = param(req, 'token')
  if (!token) return redirect(`${appUrl()}/alertas?status=invalid`)

  const result = await confirmAlert(await db(), token)
  if (!result) return redirect(`${appUrl()}/alertas?status=invalid`)
  return redirect(`${appUrl()}/alertas?token=${result.manageToken}&status=confirmed`)
}
