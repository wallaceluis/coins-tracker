import { db } from '../../server/db.js'
import { appUrl } from '../../server/env.js'
import { deleteAlertByToken } from '../../server/alerts/repo.js'
import { json, param, redirect } from '../../server/http.js'

/** GET: link "remover este alerta" do e-mail. */
export async function GET(req: Request): Promise<Response> {
  const token = param(req, 'token')
  const removed = token ? await deleteAlertByToken(await db(), token) : false
  return redirect(`${appUrl()}/alertas?status=${removed ? 'removed' : 'invalid'}`)
}

/** POST: descadastro de um clique (cabeçalho List-Unsubscribe-Post do Gmail/Outlook). */
export async function POST(req: Request): Promise<Response> {
  const token = param(req, 'token')
  if (token) await deleteAlertByToken(await db(), token)
  return json({ ok: true })
}
