import Telegraf from 'telegraf'
import Server from './server';
import {
  searchCmd, searchPeopleCmd,
  startCmd, getCmd, submitCmd, deleteCmd, echoCmd,
  statsCmd, pingCmd, processCallback, starCmd, unstarCmd,
  collectionCmd, tagsCmd, pocgetCmd
} from './commands';
import * as Stage from 'telegraf/stage';
import * as Scene from 'telegraf/scenes/base';
import * as session from 'telegraf/session';
// import {SCENES} from './scenes';
const enter = Stage.enter
import { allText } from './commands/common';
import { sgroupScene, sbotScene, schannelScene } from './stages';

export const server = new Server(new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: true },
}));

const stage = new Stage([sgroupScene, sbotScene, schannelScene], { ttl: 30 })

server.bot.use(session())
server.bot.use(stage.middleware())

server.bot.command('start', (ctx: any) => { startCmd(ctx, server); })
// server.bot.command('help', (ctx: any) => { helpCmd(ctx, server); })

// Handle telegram resource
server.bot.command('submit', async (ctx: any) => { await submitCmd(ctx, server); })
server.bot.command('get', async (ctx: any) => { await getCmd(ctx, server); })
server.bot.command('pocget', async (ctx: any) => { await pocgetCmd(ctx, server); })
// server.bot.command('vote', async (ctx: any) => { await voteCmd(ctx, server); })

// User
// server.bot.command('tag', async (ctx: any) => { await tagCmd(ctx, server); })
// server.bot.command('untag', async (ctx: any) => { await tagCmd(ctx, server); })
server.bot.command('star', async (ctx: any) => { await starCmd(ctx, server); })
server.bot.command('unstar', async (ctx: any) => { await unstarCmd(ctx, server); })
server.bot.command('collection', async (ctx: any) => { await collectionCmd(ctx, server); })
// server.bot.command('rate', async (ctx: any) => { await rateCmd(ctx, server); })

// Settings
// server.bot.command('settings', async (ctx: any) => { await settingsCmd(ctx, server); })
// server.bot.command('set_lang', async (ctx: any) => { await setCmd(ctx, server); })

// explore
// server.bot.command('top', async (ctx: any) => { await topCmd(ctx, server); })
// server.bot.command('top_bot', async (ctx: any) => { await topBotCmd(ctx, server); })
// server.bot.command('top_channel', async (ctx: any) => { await topChannelCmd(ctx, server); })
// server.bot.command('top_group', async (ctx: any) => { await topGroupCmd(ctx, server); })
// server.bot.command('top_group', async (ctx: any) => { await topGroupCmd(ctx, server); })
// server.bot.command('recent', async (ctx: any) => { await recentCmd(ctx, server); })
server.bot.command('tags', async (ctx: any) => { await tagsCmd(ctx, server); })

// Search command
server.bot.command('search', async (ctx: any) => { await searchCmd(ctx, server); })
server.bot.command('sbot', enter('sbot'))
server.bot.command('sgroup', enter('sgroup'));
server.bot.command('schannel', enter('schannel'))
server.bot.command('speople', async (ctx: any) => { await searchPeopleCmd(ctx, server); })

// Private. Gathering server info
server.bot.command('delete', async (ctx: any) => { await deleteCmd(ctx, server); })
server.bot.command('ping', (ctx: any) => { pingCmd(ctx, server); })
server.bot.command('stats', async (ctx: any) => { await statsCmd(ctx, server); })
server.bot.command('echo', (ctx: any) => { echoCmd(ctx, server); })

// callback
server.bot.action(/.+/, async (ctx: any) => { await processCallback(ctx, server); })

// Handle all kinds of text.
server.bot.on('text', async (ctx: any) => { await allText(ctx, server); })