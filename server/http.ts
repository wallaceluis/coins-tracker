export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })

export const redirect = (location: string) => new Response(null, { status: 303, headers: { location } })

export const param = (req: Request, name: string) => new URL(req.url).searchParams.get(name)
