import type { NextRequest } from "next/server"

export function isAuthorizedHermesServiceRequest(
  request: NextRequest,
  options: { allowWithoutSecret?: boolean; envKey?: string } = {}
): boolean {
  const envKey = options.envKey ?? "HERMES_API_SECRET"
  const secret = process.env[envKey]

  if (!secret) {
    return options.allowWithoutSecret ?? false
  }

  const explicitSecret = request.headers.get("x-hermes-api-secret")
  if (explicitSecret === secret) {
    return true
  }

  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length) === secret
  }

  return false
}
