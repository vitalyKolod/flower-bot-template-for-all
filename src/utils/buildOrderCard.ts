import { OrderDoc } from '../models/Order'

export function buildOrderCard(order: OrderDoc) {
  return (
    `🆕 ЗАКАЗ #${String(order._id).slice(-6)}\n\n` +
    `👤 Клиент: ${order.userTgId}\n` +
    `📦 Тип: ${order.type === 'READY' ? 'Готовый букет' : 'Индивидуальный'}\n` +
    (order.budget ? `💰 Бюджет: ${order.budget}\n` : '') +
    (order.style ? `🎨 Стиль: ${order.style}\n` : '') +
    `🚚 Доставка: ${order.deliveryType}\n` +
    (order.address ? `📍 Адрес: ${order.address}\n` : '') +
    `📞 Телефон: ${order.phone}\n\n` +
    `📌 Статус: В работе`
  )
}
