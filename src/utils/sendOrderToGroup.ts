import { Telegraf } from 'telegraf'
import { Order, OrderDoc } from '../models/Order'
import { buildConfirmText } from './buildConfirm'

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)

export async function sendOrderToGroup(bot: Telegraf, order: OrderDoc) {
  if (!GROUP_CHAT_ID) {
    console.error('❌ GROUP_CHAT_ID не задан')
    return
  }

  // 0) Создаём тему для заказа (если ещё нет)
  if (!order.supportChatId) {
    const title = `Заказ ${String(order._id).slice(-6)}`
    const topic = await bot.telegram.createForumTopic(GROUP_CHAT_ID, title)

    order.supportChatId = topic.message_thread_id
    await order.save()
  }

  const threadId = order.supportChatId

  // 1) Фото в тему
  if (order.type === 'READY' && order.refPhotos.length > 0) {
    await bot.telegram.sendMediaGroup(
      GROUP_CHAT_ID,
      order.refPhotos.map((fileId) => ({
        type: 'photo',
        media: fileId,
      })),
      { message_thread_id: threadId }
    )
  }

  // 2) Текст в тему
  const text =
    '🆕 НОВЫЙ ЗАКАЗ (ДИАЛОГ)\n\n' + buildConfirmText(order) + `\n\n🆔 ID заказа: ${order._id}`

  await bot.telegram.sendMessage(GROUP_CHAT_ID, text, {
    message_thread_id: threadId,
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 Ответить', callback_data: `REPLY_${order._id}` }],
        [{ text: '✅ В работу', callback_data: `TAKE_${order._id}` }],
        [{ text: '❌ Отклонить', callback_data: `DECLINE_${order._id}` }],
      ],
    },
  })
}
