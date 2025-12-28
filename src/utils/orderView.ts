import { OrderDoc } from '../models/Order'

export const STATUS_VIEW: Record<string, string> = {
  in_work: '🆕 В работе',
  accepted: '✅ Принят',
  rejected: '❌ Отклонён',
  done: '🏁 Завершён',
}

export const TYPE_VIEW: Record<string, string> = {
  READY: 'Готовый букет',
  CUSTOM: 'Индивидуальный',
}

export const DELIVERY_VIEW: Record<string, string> = {
  COURIER: 'Доставка',
  PICKUP: 'Самовывоз',
}
