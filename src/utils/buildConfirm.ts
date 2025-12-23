import { OrderDoc } from '../models/Order'

export function buildConfirmText(order: OrderDoc) {
  if (order.type === 'READY') {
    return (
      '🌸 Ваш заказ\n\n' +
      'Тип: Готовый букет\n\n' +
      `Описание:\n${order.refText ?? '—'}\n\n` +
      `Фото: ${order.refPhotos.length} шт\n\n` +
      `Доставка: ${order.deliveryType}\n` +
      `Адрес: ${order.address ?? '—'}\n` +
      `Телефон: ${order.phone}`
    )
  }

  return (
    '🌸 Ваш заказ\n\n' +
    'Тип: Индивидуальный букет\n\n' +
    `Бюджет: ${order.budget ?? '—'}\n` +
    `Стиль: ${order.style ?? '—'}\n\n` +
    `Доставка: ${order.deliveryType}\n` +
    `Адрес: ${order.address ?? '—'}\n` +
    `Телефон: ${order.phone}`
  )
}
