import { promisify } from 'util';
import { emojiDict, sigStr, itemPerPage, noTgResponse, resultLine } from '../constants/tg';
import { IResource } from '../resource';
import Telegraf from 'telegraf';
const Extra = (Telegraf as any).Extra;

export async function getResultByActionRes(ctx: any, server: any, action: any, resource: any, thisPage: any) {
  const payload = resource
  let totalPage = 0;
  let result = '';
  console.log(`getResultByActionRes, payload: ${payload}`)
  if (payload === undefined || payload === null || payload === '') {
    result = 'Ok, tell me what you are searching for'
    ctx.reply(result, Extra.HTML(true).webPreview(false).markup((m: any) =>
      m.inlineKeyboard([
        m.callbackButton(` 🔎 ${emojiDict['bot']}`, `search_bot`),
        m.callbackButton(` 🔎 ${emojiDict['channel']}`, `search_channel`),
        m.callbackButton(` 🔎 ${emojiDict['group']}`, `search_group`),
        m.callbackButton(` 🔎 ${ctx.i18n.t('search_all')}`, `search_all`),
      ], { columns: 3 })
    ))
    return ['', 0];
  }
  // if (payload === '*') {
  if (['*', '*#channel', '*#bot', '*#group'].indexOf(payload) > -1) {
    result = noTgResponse;
    totalPage = 0;
    return [noTgResponse, totalPage];
  }
  const isMemberAsync = promisify(server.redisClient.sismember).bind(server.redisClient);
  const value = await isMemberAsync('redisearch:cached-search-string', payload);
  if (value === 1) {
    console.log(`${payload} is cached search string`);
  }
  console.log(`No cache in redis, search in elasticsearch, search str: ${payload}`)
  const splitPayload = payload.split(/#(.+)/)
  const queryString = splitPayload[0]

  server.redisClient.PUBLISH('st_search', queryString);
  let tagString = ''
  if (splitPayload.length === 3) {
    tagString = '#' + splitPayload[1]
  }
  if (!tagString.includes('#')) {
    tagString = ''
  } else {
    const i = tagString.indexOf('#');
    tagString = tagString.substring(i);
  }
  const noSpaceTagsStr = tagString.replace(/ /g, '').replace(/#/g, ' ').trim();
  const tagsSlice = noSpaceTagsStr.split(' ')
  const queryBody: any = {
    _source: [ 'tgid', 'title', 'type', 'desc', 'tags' ],
    from: itemPerPage * (parseInt(thisPage, 10) - 1),
    query: {
      simple_query_string: {
        query: queryString,
      }
    },
    size: itemPerPage,
  }

  if (tagsSlice.length > 0 && tagsSlice[0] !== '') {
    queryBody['post_filter'] = {
      bool: {
        should: [
          {
            terms: {
              'tags.name.keyword': tagsSlice
            }
          }
        ]
      }
    }
  }
  const resourceResults: any = await server.esClient.search({
    body: queryBody,
    index: 'telegram',
    type: 'resource',
  });
  result = `🎉🎉🎉  ${resourceResults.hits.total} results\n${resultLine}\n\n`
  if (resourceResults.hits.total === 1) {
    result = `🎉🎉🎉  ${resourceResults.hits.total} result\n${resultLine}\n\n`
  }
  if (resourceResults.hits.total === 0) {
    result = noTgResponse;
    const tgResource: IResource = {
      tgid: queryString,
    }
    const tgResourceString = JSON.stringify(tgResource);
    console.log(`Telegram, ${ctx.message.from.username}/${ctx.message.from.id} submit resource: ${tgResourceString}\n`)
    server.redisClient.PUBLISH('st_submit', '1');
    server.redisClient.LPUSH('st_submit_list', tgResourceString);
  }
  for (const hit of resourceResults.hits.hits) {
    let description = '';
    description = (hit['_source']['desc'] === '') ? 'None' : hit['_source']['desc'];
    if (description.length > 40) {
      description = description.substring(0, 40) + '...'
    }
    let resTagString = '';
    for (const item of hit['_source']['tags']) {
      resTagString = resTagString + '#' + item['name'] + ' '
    }
    const hitStr = `${emojiDict[hit['_source']['type']]} @${hit['_id']}  ${hit['_source']['title']}
<b>Description</b>: ${description}
<b>Tags</b>: ${resTagString}
/get_${hit['_id']}

`
    result = result + hitStr;
  }
  const totalRecord = parseInt(resourceResults.hits.total, 10);
  totalPage = totalRecord % itemPerPage === 0 ? totalRecord / itemPerPage : Math.ceil(totalRecord / itemPerPage) ;
  return [result, totalPage]
}
