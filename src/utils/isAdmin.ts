export function isAdmin(tgId: number) {
  const admins = process.env.ADMIN_IDS?.split(',').map(Number) ?? []
  return admins.includes(tgId)
}
