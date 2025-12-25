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

const bot = new Telegraf(process.env.BOT_TOKEN!)
const GROUP_CHAT_ID = Number(process.env.GROUP_CHAT_ID)

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

  /* ================= CALLBACKS ================= */
  // 👉 ТУТ ВЕСЬ ТВОЙ CALLBACK-КОД БЕЗ ИЗМЕНЕНИЙ
  // (я его опускаю в примере, потому что он у тебя уже рабочий)

  /* ================= CONFIRM ================= */
  bot.action('CONFIRM_SEND', async (ctx) => {
    await ctx.answerCbQuery()

    const tgId = ctx.from!.id
    const order = await getActiveOrder(tgId)
    if (!order) return

    await sendOrderToGroup(bot, order)

    order.status = 'in_work'
    await order.save()

    await setState(tgId, 'DONE')

    const s = renderDone()
    await ctx.editMessageText(s.text, s.keyboard)
  })

  /* ================= TEXT ================= */
  bot.on('text', async (ctx) => {
    const text = ctx.message.text

    /* ======= МЕНЕДЖЕР ПИШЕТ В ТЕМЕ ======= */
    if (ctx.chat.type !== 'private') {
      const threadId = ctx.message?.message_thread_id
      if (!threadId) return
      if (ctx.from?.is_bot) return

      const order = await Order.findOne({ supportChatId: threadId })
      if (!order) return

      await ctx.telegram.sendMessage(order.userTgId, `💬 Сообщение от менеджера:\n\n${text}`)

      return
    }

    /* ======= КЛИЕНТ ======= */
    const tgId = ctx.from.id
    const user = await getOrCreateUser(tgId)

    // FSM — всё как у тебя было
    if (user.state === 'WAIT_READY_CONTENT') {
      const order = await getActiveOrder(tgId)
      if (!order) return
      order.refText = text
      await order.save()
      return
    }

    if (user.state === 'WAIT_ADDRESS') {
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
      const order = await getActiveOrder(tgId)
      if (order) {
        order.phone = text
        await order.save()
      }

      await setState(tgId, 'CONFIRM')
      const s = renderConfirm(buildConfirmText(order!))
      return ctx.reply(s.text, s.keyboard)
    }

    /* ======= КЛИЕНТ ПИШЕТ → В ТЕМУ ======= */
    const order = await Order.findOne({
      userTgId: tgId,
      status: 'in_work',
    })

    if (!order || !order.supportChatId) return

    await ctx.telegram.sendMessage(GROUP_CHAT_ID, `👤 Клиент:\n${text}`, {
      message_thread_id: order.supportChatId,
    })
  })

  await bot.launch()
  console.log('Bot started')
}

start()
