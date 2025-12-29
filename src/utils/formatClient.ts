import { OrderDoc } from '../models/Order'

export function formatClient(order: OrderDoc) {
  const name =
    [order.clientFirstName, order.clientLastName].filter(Boolean).join(' ') || 'Без имени'

  const username = order.clientUsername ? `@${order.clientUsername}` : `ID${order.userTgId}`

  const link = `tg://user?id=${order.userTgId}`

  return {
    name,
    username,
    link,
  }
}
