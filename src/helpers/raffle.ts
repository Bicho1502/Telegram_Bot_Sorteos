// Dependencies
import { ContextMessageUpdate, Telegraf } from 'telegraf'
import { addRaffle, getRaffle, Raffle } from '../models'
import { ExtraEditMessage } from 'telegraf/typings/telegram-types'
import { shuffle, random } from 'lodash'
import { checkIfAdmin } from './checkAdmin'
import { findChat } from '../models/chat'
import { loc } from './locale'

// Raffle text
const raffleText = 'raffle_text'

/**
 * Starting a new raffle
 * @param ctx Context of the message that started
 */
export async function startRaffle(ctx: ContextMessageUpdate) {
  // Get chat
  const chat = await findChat(ctx.chat.id)
  // Send message
  const sent = await ctx.replyWithMarkdown(loc(raffleText, chat.language))
  // Add raffle
  const raffle = await addRaffle(sent.chat.id, sent.message_id)
  // Add buttons
  const options: ExtraEditMessage = {
    reply_markup: getButtons(raffle, chat.language),
  };
  (<any>options).reply_markup = JSON.stringify(options.reply_markup)
  await ctx.telegram.editMessageText(sent.chat.id, sent.message_id, undefined, loc(raffleText, chat.language), options)
}

/**
 * Setting up callback for the raffle participation button
 * @param bot Bot to setup the callback
 */
export function setupCallback(bot: Telegraf<ContextMessageUpdate>) {
  (<any>bot).action(async (data: string, ctx: ContextMessageUpdate) => {
    // Get raffle
    const datas = data.split('~')
    if (datas[0] === 'l') return;
    const chatId = Number(datas[0])
    const messageId = Number(datas[1])
    let raffle = await getRaffle(chatId, messageId)
    // Get chat
    const chat = await findChat(ctx.chat.id)
    // Check if raffle is there
    if (!raffle) {
      await (<any>ctx).answerCbQuery(loc('please_retry', chat.language), undefined, true)
      return
    }
    // Check if already in
    if (raffle.participantsIds.indexOf(ctx.from.id) > -1) {
      await (<any>ctx).answerCbQuery(loc('already_participating', chat.language), undefined, true)
      return
    }
    // Add participant and update number
    raffle.participantsIds.push(ctx.from.id)
    raffle = await raffle.save()
    // Reply that they are in
    await await (<any>ctx).answerCbQuery(loc('participated', chat.language), undefined, true)
    // Update counter of participants
    try {
      // Add buttons
      const options: ExtraEditMessage = {
        reply_markup: getButtons(raffle, chat.language),
      }
      const text = `${loc(raffleText, chat.language)}\n\n${loc('participants_number', chat.language)}: ${raffle.participantsIds.length}`
      await ctx.telegram.editMessageText(raffle.chatId, raffle.messageId, undefined, text, options)
    } catch (err) {
      // Do nothing
    }
  })
}

/**
 * Setting up listener for the raffle endings
 * @param bot 
 */
export function setupListener(bot: Telegraf<ContextMessageUpdate>) {
  bot.use(async (ctx, next) => {
    try {
      const message = ctx.message || ctx.channelPost
      // Check if reply to bot's message
      if (!message || !message.reply_to_message || !message.reply_to_message.text || (message.reply_to_message.text.indexOf('Розыгрыш начался! Нажмите') < 0 && message.reply_to_message.text.indexOf('Raffle has begun! Press') < 0)) {
        throw new Error()
      }
      // Check if admin replied
      const isAdmin = await checkIfAdmin(ctx)
      if (!isAdmin) {
        throw new Error()
      }
      // Get reply message
      const reply = message.reply_to_message
      // Check if there is raffle to the reply message
      const raffle = await getRaffle(reply.chat.id, reply.message_id)
      if (!raffle) {
        throw new Error()
      }
      // Check if no winner yet
      if (raffle.winner) {
        throw new Error()
      }
      // Finish raffle
      await finishRaffle(raffle, ctx)
    } catch (err) {
      // Do nothing
    } finally {
      // Continue
      next()
    }
  })
}

/**
 * Buttons for a raffle
 * @param raffle Raffle to provide buttons to
 * @param language Languageof thebuttons
 * @returns buttons for a raffle
 */
function getButtons(raffle: Raffle, language: string) {
  return {
    inline_keyboard: [
      [{
        text: loc('participate_button', language),
        callback_data: `${raffle.chatId}~${raffle.messageId}`,
      }],
    ],
  }
}

/**
 * Finishing raffle
 * @param raffle Raffle to finish
 * @param ctx Context of message that finished raffle
 */
async function finishRaffle(raffle: Raffle, ctx: ContextMessageUpdate) {
  // Get participants ids
  let ids = raffle.participantsIds
  // Get chat
  const chat = await findChat(ctx.chat.id)
  // Check if there were participants
  if (ids.length <= 0) {
    const text = loc('no_participants', chat.language)
    await ctx.telegram.editMessageText(raffle.chatId, raffle.messageId, undefined, text)
    return
  }
  // Get winner
  ids = shuffle(ids)
  const winnerIndex = random(ids.length-1)
  const winnerId = ids[winnerIndex]
  const winner = await ctx.telegram.getChatMember(raffle.chatId, winnerId)
  // Announce winner
  const name =
    winner.user.username ? `@${winner.user.username}` :
    `${winner.user.first_name}${winner.user.last_name ? ` ${winner.user.last_name}` : ''}`
  const text = `🎉 ${loc('winner', chat.language)} — [${name}](tg://user?id=${winner.user.id})! ${loc('congratulations', chat.language)}!\n\n${loc('participants_number', chat.language)} — ${ids.length}.`
  await ctx.telegram.editMessageText(raffle.chatId, raffle.messageId, undefined, text, {
    parse_mode: 'Markdown',
  })
  // Save winner
  raffle.winner = winner.user.id
  await (<any>raffle).save()
}