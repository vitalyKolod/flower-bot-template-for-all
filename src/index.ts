import 'dotenv/config'
import { Telegraf } from 'telegraf'
import mongoose from 'mongoose'

import { getOrCreateUser, setState, goBack } from './fsm'
import {
  renderStart,
  renderE1,
  renderReady,
  renderBudget,
  renderStyle,
  renderDelivery,
  renderAddress,
  renderContact,
  renderConfirm,
  renderDone,
} from './screens'
import { getActiveOrder, Order } from './models/Order'
import { buildConfirmText } from './utils/buildConfirm'
import { sendOrderToGroup } from './utils/sendOrderToGroup'

const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)
const bot = new Telegraf(process.env.BOT_TOKEN!)

async function start() {
  await mongoose.connect(process.env.MONGO_URI!)
  console.log('Mongo connected')

  /* ================= /start ================= */
  bot.start(async (ctx) => {
    await getOrCreateUser(ctx.from.id, ctx.from.username)
    await setState(ctx.from.id, 'START')

    const s = renderStart()
    await ctx.reply(s.text, s.keyboard)
  })

  /* ================= TYPE ================= */
  bot.action('E1', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'E1_CHOOSE_TYPE', 'START')

    const s = renderE1()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= READY ================= */
  bot.action('E2_READY', async (ctx) => {
    await ctx.answerCbQuery()
    const tgId = ctx.from!.id

    await setState(tgId, 'WAIT_READY_CONTENT', 'E1_CHOOSE_TYPE')

    const existing = await getActiveOrder(tgId)
    if (!existing) {
      await Order.create({
        userTgId: tgId,
        type: 'READY',
        deliveryType: 'COURIER', // временно, дальше перезапишем
        phone: 'temp',
      })
    }

    await ctx.editMessageText(
      'Напишите название или описание букета 💐\n' +
        'Вы можете также отправить фото.\n\n' +
        'Когда закончите — нажмите «Готово»',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Готово', callback_data: 'READY_DONE' }],
            [{ text: '⬅️ Назад', callback_data: 'BACK' }],
          ],
        },
      }
    )
  })

  /* ================= CUSTOM → BUDGET ================= */
  bot.action('E2_CUSTOM', async (ctx) => {
    const tgId = ctx.from!.id

    await setState(tgId, 'E2_BUDGET', 'E1_CHOOSE_TYPE')

    // 🔥 создаём заказ ТОЛЬКО если нет активного
    const existing = await getActiveOrder(tgId)
    if (!existing) {
      await Order.create({
        userTgId: tgId,
        type: 'CUSTOM',
        deliveryType: 'COURIER', // дефолт, потом перезапишем
        phone: 'temp',
      })
    }

    const s = renderBudget()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= BACK ================= */
  async function safeEdit(ctx: any, screen: { text: string; keyboard: any }) {
    try {
      await ctx.editMessageText(screen.text, screen.keyboard)
    } catch (e: any) {
      if (!e.message?.includes('message is not modified')) {
        throw e
      }
    }
  }

  bot.action('BACK', async (ctx) => {
    await ctx.answerCbQuery()
    const prev = await goBack(ctx.from!.id)
    if (!prev) return

    if (prev === 'E1_CHOOSE_TYPE') return safeEdit(ctx, renderE1())
    if (prev === 'E2_BUDGET') return safeEdit(ctx, renderBudget())
    if (prev === 'E2_STYLE') return safeEdit(ctx, renderStyle())
    if (prev === 'E3_DELIVERY') return safeEdit(ctx, renderDelivery())
    if (prev === 'CONFIRM') return safeEdit(ctx, renderContact())
  })

  /* ================= BUDGET ================= */
  const BUDGET_MAP: Record<string, string> = {
    BUDGET_3000: 'до 3000',
    BUDGET_3000_5000: '3000–5000',
    BUDGET_5000_7000: '5000–7000',
    BUDGET_7000: '7000+',
  }

  Object.keys(BUDGET_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      const tgId = ctx.from!.id

      const order = await getActiveOrder(tgId)
      if (order) {
        order.budget = BUDGET_MAP[action]
        await order.save()
      }

      // ⬇️ ИДЁМ ДАЛЬШЕ, А НЕ ВОЗВРАЩАЕМСЯ
      await setState(tgId, 'E2_STYLE', 'E2_BUDGET')

      const s = renderStyle()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('BUDGET_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_BUDGET_TEXT', 'E2_BUDGET')
    await ctx.editMessageText('Напишите бюджет в свободной форме 💬')
  })

  /* ================= STYLE ================= */

  const STYLE_MAP: Record<string, string> = {
    STYLE_ANY: 'Без разницы',
    STYLE_SOFT: 'Нежный / светлый',
    STYLE_BRIGHT: 'Яркий',
  }

  Object.keys(STYLE_MAP).forEach((action) => {
    bot.action(action, async (ctx) => {
      await ctx.answerCbQuery()
      const tgId = ctx.from!.id

      const order = await getActiveOrder(tgId)
      if (order) {
        order.style = STYLE_MAP[action]
        await order.save()
      }

      // 👇 логика перехода (ВАЖНО)
      await setState(tgId, 'E3_DELIVERY', 'E2_STYLE')

      const s = renderDelivery()
      await ctx.editMessageText(s.text, s.keyboard)
    })
  })

  bot.action('STYLE_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_STYLE_TEXT', 'E2_STYLE')
    await ctx.editMessageText('Опишите желаемый стиль 💬')
  })

  /* ================= DELIVERY ================= */
  bot.action('DELIVERY_COURIER', async (ctx) => {
    await ctx.answerCbQuery()
    const tgId = ctx.from!.id

    const order = await getActiveOrder(tgId)
    if (order) {
      order.deliveryType = 'COURIER'
      await order.save()
    }

    await setState(tgId, 'WAIT_ADDRESS', 'E3_DELIVERY')
    const s = renderAddress()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  bot.action('DELIVERY_PICKUP', async (ctx) => {
    await ctx.answerCbQuery()
    const tgId = ctx.from!.id

    const order = await getActiveOrder(tgId)
    if (order) {
      order.deliveryType = 'PICKUP'
      await order.save()
    }

    await setState(tgId, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
    const s = renderContact()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= CONTACT BUTTONS ================= */
  bot.action('CONTACT_REQUEST', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')

    await ctx.reply('Нажмите кнопку ниже, чтобы отправить номер 📱', {
      reply_markup: {
        keyboard: [[{ text: '📱 Отправить номер', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
  })

  bot.action('CONTACT_MANUAL', async (ctx) => {
    await ctx.answerCbQuery()
    await setState(ctx.from!.id, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
    await ctx.editMessageText('Введите номер телефона 📞')
  })

  /* ================= CONTACT ================= */
  bot.on('contact', async (ctx) => {
    const tgId = ctx.from.id
    const user = await getOrCreateUser(tgId)
    if (user.state !== 'WAIT_PHONE_TEXT') return

    const phone = ctx.message.contact.phone_number
    const order = await getActiveOrder(tgId)
    if (!order) return

    order.phone = phone
    await order.save()

    await setState(tgId, 'CONFIRM')

    // ✅ ВОТ ТУТ ФОТО
    if (order.type === 'READY' && order.refPhotos.length > 0) {
      await ctx.replyWithMediaGroup(
        order.refPhotos.map((fileId) => ({
          type: 'photo',
          media: fileId,
        }))
      )
    }

    // ✅ ПОТОМ ТЕКСТ
    const text = buildConfirmText(order)
    const s = renderConfirm(text)

    await ctx.reply(s.text, s.keyboard)
  })

  bot.on('photo', async (ctx) => {
    const tgId = ctx.from.id
    const user = await getOrCreateUser(tgId)

    if (user.state !== 'WAIT_READY_CONTENT') return

    const order = await getActiveOrder(tgId)
    if (!order) return

    // 📸 сохраняем фото (берём самое большое)
    const photos = ctx.message.photo
    const photo = photos[photos.length - 1]

    if (photo) {
      order.refPhotos.push(photo.file_id)
    }

    // ✍️ ЕСЛИ есть подпись — сохраняем как refText
    const caption = ctx.message.caption
    if (caption && !order.refText) {
      order.refText = caption
    }

    await order.save()
  })

  bot.action('READY_DONE', async (ctx) => {
    await ctx.answerCbQuery()
    const tgId = ctx.from!.id

    const order = await getActiveOrder(tgId)
    if (!order || (!order.refText && order.refPhotos.length === 0)) {
      return ctx.answerCbQuery('Добавьте описание или фото')
    }

    await setState(tgId, 'E3_DELIVERY', 'WAIT_READY_CONTENT')
    const s = renderDelivery()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= TEXT FSM ================= */
  bot.on('text', async (ctx) => {
    const tgId = ctx.from.id
    const user = await getOrCreateUser(ctx.from.id)
    const text = ctx.message.text

    // ================= MANAGER → CLIENT =================
    if (ctx.chat.type !== 'private') {
      const threadId = ctx.message?.message_thread_id
      if (!threadId) return
      if (ctx.from?.is_bot) return

      const order = await Order.findOne({ supportChatId: threadId })
      if (!order) return

      await ctx.telegram.sendMessage(order.userTgId, `💬 Сообщение менеджера:\n\n${text}`)

      return
    }

    if (user.state === 'WAIT_READY_CONTENT') {
      const order = await getActiveOrder(tgId)
      if (!order) return

      // ✍️ добавляем или перезаписываем описание
      order.refText = text
      await order.save()

      // ⛔ никуда не идём, ждём кнопку «Готово»
      return
    }

    if (user.state === 'WAIT_ADDRESS') {
      const tgId = ctx.from.id
      const order = await getActiveOrder(tgId)

      if (order) {
        order.address = text
        await order.save()
      }

      await setState(tgId, 'WAIT_PHONE_TEXT', 'E3_DELIVERY')
      const s = renderContact()
      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_PHONE_TEXT') {
      const tgId = ctx.from.id
      const order = await getActiveOrder(tgId)

      if (order) {
        order.phone = text
        await order.save()
      }

      await setState(tgId, 'CONFIRM')

      const s = renderConfirm(
        `Тип: ${order?.type}\n` +
          `Бюджет: ${order?.budget ?? '—'}\n` +
          `Стиль: ${order?.style ?? '—'}\n` +
          `Доставка: ${order?.deliveryType}\n` +
          `Адрес: ${order?.address ?? '—'}\n` +
          `Телефон: ${text}`
      )

      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_STYLE_TEXT') {
      const tgId = ctx.from.id

      const order = await getActiveOrder(tgId)
      if (order) {
        order.style = text
        await order.save()
      }

      // ❗ ВАЖНО
      await setState(tgId, 'E3_DELIVERY', 'WAIT_STYLE_TEXT')

      const s = renderDelivery()
      return ctx.reply(s.text, s.keyboard)
    }

    if (user.state === 'WAIT_BUDGET_TEXT') {
      const tgId = ctx.from.id

      const order = await getActiveOrder(tgId)
      if (order) {
        order.budget = text
        await order.save()
      }

      // ❗ ВАЖНО
      await setState(tgId, 'E2_STYLE', 'WAIT_BUDGET_TEXT')

      const s = renderStyle()
      return ctx.reply(s.text, s.keyboard)
    }

    // ✉️ клиент пишет — прокидываем в тему
    if (ctx.chat.type === 'private') {
      const order = await Order.findOne({
        userTgId: tgId,
        status: 'in_work',
      })

      if (!order || !order.supportChatId) return

      await ctx.telegram.sendMessage(GROUP_CHAT_ID, `👤 Клиент:\n${text}`, {
        message_thread_id: order.supportChatId,
      })

      return
    }
  })

  /* ================= CONFIRM ================= */
  bot.action('CONFIRM_SEND', async (ctx) => {
    await ctx.answerCbQuery()

    const tgId = ctx.from!.id
    const order = await getActiveOrder(tgId)
    if (!order) return

    // 🚀 отправляем заказ в группу
    await sendOrderToGroup(bot, order)

    // ✅ ВАЖНО: закрываем заказ
    order.status = 'in_work'
    await order.save()

    await setState(tgId, 'DONE')

    const s = renderDone()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  await bot.launch()
  console.log('Bot started')
}

start()
