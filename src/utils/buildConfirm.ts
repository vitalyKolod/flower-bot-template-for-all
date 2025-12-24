import { OrderDoc } from '../models/Order'

const DELIVERY_LABEL: Record<'COURIER' | 'PICKUP', string> = {
  COURIER: 'Доставка',
  PICKUP: 'Самовывоз',
}

export function buildConfirmText(order: OrderDoc) {
  if (order.type === 'READY') {
    return (
      '🌸 Ваш заказ\n\n' +
      'Тип: Готовый букет\n\n' +
      `Описание:\n${order.refText ?? '—'}\n\n` +
      `Фото: ${order.refPhotos.length} шт\n\n` +
      `Доставка: ${DELIVERY_LABEL[order.deliveryType]}\n` +
      `Адрес: ${order.address ?? '—'}\n` +
      `Телефон: ${order.phone}`
    )
  }

  return (
    '🌸 Ваш заказ\n\n' +
    'Тип: Индивидуальный букет\n\n' +
    `Бюджет: ${order.budget ?? '—'}\n` +
    `Стиль: ${order.style ?? '—'}\n\n` +
    `Доставка: ${DELIVERY_LABEL[order.deliveryType]}\n` +
    `Адрес: ${order.address ?? '—'}\n` +
    `Телефон: ${order.phone}`
  )
}
