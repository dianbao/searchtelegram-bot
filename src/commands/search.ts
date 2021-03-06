import Telegraf from 'telegraf';
import { promisify } from 'util';
import { emojiDict, sigStr } from './../constants/tg';
import { getResultByActionRes } from '../utils/handle_resource';
const Extra = (Telegraf as any).Extra;
import * as Scene from 'telegraf/scenes/base';
import * as Stage from 'telegraf/stage';
const leave = Stage.leave

export async function searchCmd(ctx: any, server: any) {
  let payload = '';
  if (ctx.message) {
    payload = ctx.message.text.replace('/search ', '').replace('/search', '');
    server.redisClient.SADD('stats:search-unique-user', ctx.message.from.id);
    server.redisClient.SADD('stats:unique-user', ctx.message.from.id)
  }
  if (payload.startsWith('#')) {
    payload = '*' + payload;
  }
  const [result, totalPage] = await getResultByActionRes(ctx, server, 'search', payload, 1)

  if (totalPage === 0) {
    if (result === '') {
      return;
    }
    ctx.reply(result + sigStr, Extra.HTML(true).webPreview(false))
  } else if (totalPage === 1) {
    ctx.reply(result, Extra.HTML(true).webPreview(false))
  } else {
    ctx.reply(result + sigStr, Extra.HTML(true).webPreview(false).markup((m: any) =>
      m.inlineKeyboard([
        m.urlButton('🌐 ', 'https://searchtelegram.com'),
        m.urlButton('📢 ', 'https://t.me/SearchTelegramChannel'),
        m.urlButton('👥 ', 'https://t.me/SearchTelegramGroup'),
        m.callbackButton(` 🔎 `, `search_all`),
        m.callbackButton('1', 'current_page'),
        m.callbackButton('➡️', `next:search_${payload}-1`)
      ], { columns: 4 })
    ));
  }
}

export async function searchPeopleCmd(ctx: any, server: any) {
  const payload = ctx.message.text.replace('/speople ', '').replace('/speople', '');
  ctx.message.text = `/search ${payload}#people`;
  await searchCmd(ctx, server);
}
