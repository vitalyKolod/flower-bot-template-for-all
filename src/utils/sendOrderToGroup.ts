import { Telegraf } from 'telegraf'
import { OrderDoc } from '../models/Order'
import { buildOrderCard } from './buildOrderCard'

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)

export async function sendOrderToGroup(bot: Telegraf, order: OrderDoc) {
  if (!GROUP_CHAT_ID) {
    console.error('❌ GROUP_CHAT_ID не задан')
    return
  }

  // 1️⃣ если готовый букет — сначала фото
  if (order.type === 'READY' && order.refPhotos.length > 0) {
    await bot.telegram.sendMediaGroup(
      GROUP_CHAT_ID,
      order.refPhotos.map((fileId) => ({
        type: 'photo',
        media: fileId,
      }))
    )
  }

  // 2️⃣ отправляем карточку заказа В ТЕМУ
  const message = await bot.telegram.sendMessage(GROUP_CHAT_ID, buildOrderCard(order), {
    message_thread_id: order.supportChatId!,
  })

  // 3️⃣ закрепляем карточку в теме
  await bot.telegram.pinChatMessage(GROUP_CHAT_ID, message.message_id, {
    disable_notification: true,
  })
}
