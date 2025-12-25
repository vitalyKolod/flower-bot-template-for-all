import { Telegraf } from 'telegraf'
import { OrderDoc } from '../models/Order'

export async function createSupportGroup(bot: Telegraf, order: OrderDoc) {
  // создаём группу
  const chat = await bot.telegram.createChatInviteLink(process.env.MANAGER_GROUP_ID!)

  // ❗ ВАЖНО: Telegram НЕ даёт напрямую создать группу через Bot API
  // поэтому РЕАЛЬНЫЙ вариант:
  // 👉 используем заранее созданный шаблон-группу
  // 👉 или продолжаем пока с общей группой
}
