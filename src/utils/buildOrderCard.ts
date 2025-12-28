import { OrderDoc } from '../models/Order'
import { STATUS_VIEW, TYPE_VIEW, DELIVERY_VIEW } from './orderView'
import { formatClient } from './formatClient'

export function buildOrderCard(order: OrderDoc) {
  const shortId = String(order._id).slice(-6)
  const client = formatClient(order)

  return (
    `🆕 ЗАКАЗ #${shortId}\n\n` +
    `👤 Клиент: <a href="${client.link}">${client.name}</a>
${client.username}\n` +
    `📦 Тип: ${TYPE_VIEW[order.type]}\n` +
    (order.budget ? `💰 Бюджет: ${order.budget}\n` : '') +
    (order.style ? `🎨 Стиль: ${order.style}\n` : '') +
    `🚚 Доставка: ${DELIVERY_VIEW[order.deliveryType]}\n` +
    (order.address ? `📍 Адрес: ${order.address}\n` : '') +
    `📞 Телефон: ${order.phone}\n\n` +
    `📌 Статус: ${STATUS_VIEW[order.status]}\n` +
    `👨‍💼 Менеджер: ${order.managerTgId ? '@' + order.managerTgId : '—'}\n` +
    `🕒 Обновлено: ${new Date(order.updatedAt).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  )
}
