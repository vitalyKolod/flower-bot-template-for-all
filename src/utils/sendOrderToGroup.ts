import { Telegraf } from 'telegraf'
import { OrderDoc } from '../models/Order'
import { buildOrderCard } from './buildOrderCard'

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)

export async function sendOrderToGroup(bot: Telegraf, order: OrderDoc) {
  if (!GROUP_CHAT_ID) {
    console.error('❌ GROUP_CHAT_ID не задан')
    return
  }

  // 1️⃣ СОЗДАЁМ ТЕМУ
  const topic = await bot.telegram.createForumTopic(
    GROUP_CHAT_ID,
    `Заказ #${String(order._id).slice(-6)}`
  )

  const threadId = topic.message_thread_id

  // 2️⃣ СОХРАНЯЕМ ID ТЕМЫ В ЗАКАЗ
  order.supportChatId = threadId
  await order.save()

  // 3️⃣ ЕСЛИ ГОТОВЫЙ БУКЕТ — ФОТО
  if (order.type === 'READY' && order.refPhotos.length > 0) {
    await bot.telegram.sendMediaGroup(
      GROUP_CHAT_ID,
      order.refPhotos.map((fileId) => ({
        type: 'photo',
        media: fileId,
      })),
      {
        message_thread_id: threadId,
      }
    )
  }

  // 4️⃣ ОТПРАВЛЯЕМ КАРТОЧКУ В ТЕМУ
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Принять', callback_data: `STATUS_ACCEPT_${order._id}` },
        { text: '❌ Отклонить', callback_data: `STATUS_REJECT_${order._id}` },
      ],
    ],
  }

  const message = await bot.telegram.sendMessage(GROUP_CHAT_ID, buildOrderCard(order), {
    message_thread_id: threadId,
    reply_markup: keyboard,
    parse_mode: 'HTML',
  })

  // сохраняем pinnedMessageId
  order.pinnedMessageId = message.message_id
  await order.save()

  // закрепляем
  await bot.telegram.pinChatMessage(GROUP_CHAT_ID, message.message_id, {
    disable_notification: true,
  })
}
