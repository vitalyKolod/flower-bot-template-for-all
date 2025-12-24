import { Telegraf } from 'telegraf'
import { OrderDoc } from '../models/Order'
import { buildConfirmText } from './buildConfirm'

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)

export async function sendOrderToGroup(bot: Telegraf, order: OrderDoc) {
  if (!GROUP_CHAT_ID) {
    console.error('❌ GROUP_CHAT_ID не задан')
    return
  }

  // 1️⃣ Если готовый букет — сначала фото
  if (order.type === 'READY' && order.refPhotos.length > 0) {
    await bot.telegram.sendMediaGroup(
      GROUP_CHAT_ID,
      order.refPhotos.map((fileId) => ({
        type: 'photo',
        media: fileId,
      }))
    )
  }

  // 2️⃣ Потом текст заказа
  const text = '🆕 НОВЫЙ ЗАКАЗ\n\n' + buildConfirmText(order) + `\n\n🆔 ID заказа: ${order._id}`

  await bot.telegram.sendMessage(GROUP_CHAT_ID, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 Ответить', callback_data: `MANAGER_REPLY:${order._id}` }],
        [
          { text: '✅ В работу', callback_data: `MANAGER_TAKE:${order._id}` },
          { text: '❌ Отклонить', callback_data: `MANAGER_REJECT:${order._id}` },
        ],
      ],
    },
  })
}
