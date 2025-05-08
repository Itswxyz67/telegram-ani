addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const TELEGRAM_API = 'https://api.telegram.org/bot';
const JIKAN_API = 'https://api.jikan.moe/v4';

// Replace with your Telegram Bot Token
const BOT_TOKEN = '7957864288:AAGVw2jc8hPZuFqaCC_VRafKqU3gKYqu2UQ';

async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/webhook' && request.method === 'POST') {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return new Response('OK', { status: 200 });
  }
  
  if (url.pathname === '/setWebhook') {
    const webhookUrl = `https://${url.host}/webhook`;
    const setWebhookUrl = `${TELEGRAM_API}${BOT_TOKEN}/setWebhook?url=${webhookUrl}`;
    await fetch(setWebhookUrl);
    return new Response('Webhook set successfully', { status: 200 });
  }
  
  return new Response('Not found', { status: 404 });
}

async function handleTelegramUpdate(update) {
  if (!update.message || !update.message.text) return;

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();
  const args = text.split(/\s+/);
  const command = args[0].toLowerCase();
  const query = args.slice(1).join(' ').trim();

  if (command === '/start' || command === '/help') {
    const helpMessage = `*Anime Bot Commands*\n\n` +
      `/anime <name> - Search for an anime\n` +
      `/animefull <name> - Get complete anime data\n` +
      `/animecharacters <name> - Get anime characters\n` +
      `/animestaff <name> - Get anime staff\n` +
      `/animeepisodes <name> [page] - Get anime episodes\n` +
      `/animeepisode <name> <episode> - Get specific episode\n` +
      `/animenews <name> [page] - Get anime news\n` +
      `/animeforum <name> [filter] - Get anime forum topics (filter: all, episode, other)\n` +
      `/animevideos <name> - Get anime videos\n` +
      `/animevideoepisodes <name> [page] - Get anime episode videos\n` +
      `/animepictures <name> - Get anime pictures\n` +
      `/animestats <name> - Get anime statistics\n` +
      `/animemoreinfo <name> - Get more anime info\n` +
      `/animerecommendations <name> - Get anime recommendations\n` +
      `/animeuserupdates <name> [page] - Get anime user updates\n` +
      `/animereviews <name> [page] - Get anime reviews\n` +
      `/animerelations <name> - Get anime relations\n` +
      `/animethemes <name> - Get anime themes\n` +
      `/animeexternal <name> - Get anime external links\n` +
      `/animestreaming <name> - Get anime streaming links\n` +
      `/character <name> - Search for a character\n` +
      `/characterfull <name> - Get complete character data\n` +
      `/characteranime <name> - Get character's anime\n` +
      `/charactermanga <name> - Get character's manga\n` +
      `/charactervoices <name> - Get character's voice actors\n` +
      `/characterpictures <name> - Get character pictures\n` +
      `/club <name> - Search for a club\n` +
      `/clubmembers <name> [page] - Get club members\n` +
      `/clubstaff <name> - Get club staff\n` +
      `/clubrelations <name> - Get club relations\n` +
      `/genresanime [filter] - Get anime genres (filter: genres, themes, etc.)\n` +
      `/genresmanga [filter] - Get manga genres\n` +
      `/magazines [query] [page] - Get magazines\n` +
      `/manga <name> - Search for a manga\n` +
      `/mangafull <name> - Get complete manga data\n` +
      `/mangacharacters <name> - Get manga characters\n` +
      `/manganews <name> [page] - Get manga news\n` +
      `/mangaforum <name> [filter] - Get manga forum topics\n` +
      `/mangapictures <name> - Get manga pictures\n` +
      `/mangastats <name> - Get manga statistics\n` +
      `/mangamoreinfo <name> - Get more manga info\n` +
      `/mangarecommendations <name> - Get manga recommendations\n` +
      `/mangauserupdates <name> [page] - Get manga user updates\n` +
      `/mangareviews <name> [page] - Get manga reviews\n` +
      `/mangarelations <name> - Get manga relations\n` +
      `/mangaexternal <name> - Get manga external links\n` +
      `/person <name> - Search for a person\n` +
      `/personfull <name> - Get complete person data\n` +
      `/personanime <name> - Get person's anime roles\n` +
      `/personvoices <name> - Get person's voice acting roles\n` +
      `/personmanga <name> - Get person's manga works\n` +
      `/personpictures <name> - Get person pictures\n` +
      `/producer <name> - Search for a producer\n` +
      `/producerfull <name> - Get complete producer data\n` +
      `/producerexternal <name> - Get producer external links\n` +
      `/randomanime - Get a random anime\n` +
      `/randommanga - Get a random manga\n` +
      `/randomcharacter - Get a random character\n` +
      `/randomperson - Get a random person\n` +
      `/randomuser - Get a random user\n` +
      `/recentanimerecs [page] - Get recent anime recommendations\n` +
      `/recentmangarecs [page] - Get recent manga recommendations\n` +
      `/recentanimereviews [page] - Get recent anime reviews\n` +
      `/recentmangareviews [page] - Get recent manga reviews\n` +
      `/schedules [filter] [page] - Get airing schedules (filter: monday, tuesday, etc.)`;
    await sendTelegramMessage(chatId, helpMessage);
    return;
  }

  const handlers = {
    // Anime endpoints
    '/anime': { searchEndpoint: `/anime`, endpoint: `/anime/{id}`, format: formatAnime },
    '/animefull': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/full`, format: formatAnime },
    '/animecharacters': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/characters`, format: formatAnimeCharacters },
    '/animestaff': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/staff`, format: formatAnimeStaff },
    '/animeepisodes': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/episodes`, format: formatAnimeEpisodes, supportsPage: true },
    '/animeepisode': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/episodes/{episode}`, format: formatAnimeEpisode, extraParam: 'episode' },
    '/animenews': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/news`, format: formatNews, supportsPage: true },
    '/animeforum': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/forum`, format: formatForum, supportsFilter: true },
    '/animevideos': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/videos`, format: formatVideos },
    '/animevideoepisodes': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/videos/episodes`, format: formatVideoEpisodes, supportsPage: true },
    '/animepictures': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/pictures`, format: formatPictures },
    '/animestats': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/statistics`, format: formatStatistics },
    '/animemoreinfo': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/moreinfo`, format: formatMoreInfo },
    '/animerecommendations': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/recommendations`, format: formatRecommendations },
    '/animeuserupdates': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/userupdates`, format: formatUserUpdates, supportsPage: true },
    '/animereviews': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/reviews`, format: formatReviews, supportsPage: true },
    '/animerelations': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/relations`, format: formatRelations },
    '/animethemes': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/themes`, format: formatThemes },
    '/animeexternal': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/external`, format: formatExternalLinks },
    '/animestreaming': { searchEndpoint: `/anime`, endpoint: `/anime/{id}/streaming`, format: formatExternalLinks },

    // Character endpoints
    '/character': { searchEndpoint: `/characters`, endpoint: `/characters/{id}`, format: formatCharacter },
    '/characterfull': { searchEndpoint: `/characters`, endpoint: `/characters/{id}/full`, format: formatCharacter },
    '/characteranime': { searchEndpoint: `/characters`, endpoint: `/characters/{id}/anime`, format: formatCharacterAnime },
    '/charactermanga': { searchEndpoint: `/characters`, endpoint: `/characters/{id}/manga`, format: formatCharacterManga },
    '/charactervoices': { searchEndpoint: `/characters`, endpoint: `/characters/{id}/voices`, format: formatCharacterVoices },
    '/characterpictures': { searchEndpoint: `/characters`, endpoint: `/characters/{id}/pictures`, format: formatPictures },

    // Club endpoints
    '/club': { searchEndpoint: `/clubs`, endpoint: `/clubs/{id}`, format: formatClub },
    '/clubmembers': { searchEndpoint: `/clubs`, endpoint: `/clubs/{id}/members`, format: formatClubMembers, supportsPage: true },
    '/clubstaff': { searchEndpoint: `/clubs`, endpoint: `/clubs/{id}/staff`, format: formatClubStaff },
    '/clubrelations': { searchEndpoint: `/clubs`, endpoint: `/clubs/{id}/relations`, format: formatClubRelations },

    // Genres endpoints
    '/genresanime': { endpoint: `/genres/anime`, format: formatGenres, supportsFilter: true, noSearch: true },
    '/genresmanga': { endpoint: `/genres/manga`, format: formatGenres, supportsFilter: true, noSearch: true },

    // Magazines endpoint
    '/magazines': { endpoint: `/magazines`, format: formatMagazines, supportsPage: true, supportsQuery: true, noSearch: true },

    // Manga endpoints
    '/manga': { searchEndpoint: `/manga`, endpoint: `/manga/{id}`, format: formatManga },
    '/mangafull': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/full`, format: formatManga },
    '/mangacharacters': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/characters`, format: formatMangaCharacters },
    '/manganews': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/news`, format: formatNews, supportsPage: true },
    '/mangaforum': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/forum`, format: formatForum, supportsFilter: true },
    '/mangapictures': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/pictures`, format: formatPictures },
    '/mangastats': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/statistics`, format: formatStatistics },
    '/mangamoreinfo': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/moreinfo`, format: formatMoreInfo },
    '/mangarecommendations': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/recommendations`, format: formatRecommendations },
    '/mangauserupdates': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/userupdates`, format: formatUserUpdates, supportsPage: true },
    '/mangareviews': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/reviews`, format: formatReviews, supportsPage: true },
    '/mangarelations': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/relations`, format: formatRelations },
    '/mangaexternal': { searchEndpoint: `/manga`, endpoint: `/manga/{id}/external`, format: formatExternalLinks },

    // Person endpoints
    '/person': { searchEndpoint: `/people`, endpoint: `/people/{id}`, format: formatPerson },
    '/personfull': { searchEndpoint: `/people`, endpoint: `/people/{id}/full`, format: formatPerson },
    '/personanime': { searchEndpoint: `/people`, endpoint: `/people/{id}/anime`, format: formatPersonAnime },
    '/personvoices': { searchEndpoint: `/people`, endpoint: `/people/{id}/voices`, format: formatPersonVoices },
    '/personmanga': { searchEndpoint: `/people`, endpoint: `/people/{id}/manga`, format: formatPersonManga },
    '/personpictures': { searchEndpoint: `/people`, endpoint: `/people/{id}/pictures`, format: formatPictures },

    // Producer endpoints
    '/producer': { searchEndpoint: `/producers`, endpoint: `/producers/{id}`, format: formatProducer },
    '/producerfull': { searchEndpoint: `/producers`, endpoint: `/producers/{id}/full`, format: formatProducer },
    '/producerexternal': { searchEndpoint: `/producers`, endpoint: `/producers/{id}/external`, format: formatExternalLinks },

    // Random endpoints
    '/randomanime': { endpoint: `/random/anime`, format: formatAnime, noParams: true },
    '/randommanga': { endpoint: `/random/manga`, format: formatManga, noParams: true },
    '/randomcharacter': { endpoint: `/random/characters`, format: formatCharacter, noParams: true },
    '/randomperson': { endpoint: `/random/people`, format: formatPerson, noParams: true },
    '/randomuser': { endpoint: `/random/users`, format: formatUser, noParams: true },

    // Recommendations and Reviews
    '/recentanimerecs': { endpoint: `/recommendations/anime`, format: formatRecommendations, supportsPage: true, noSearch: true },
    '/recentmangarecs': { endpoint: `/recommendations/manga`, format: formatRecommendations, supportsPage: true, noSearch: true },
    '/recentanimereviews': { endpoint: `/reviews/anime`, format: formatReviews, supportsPage: true, noSearch: true },
    '/recentmangareviews': { endpoint: `/reviews/manga`, format: formatReviews, supportsPage: true, noSearch: true },

    // Schedules
    '/schedules': { endpoint: `/schedules`, format: formatSchedules, supportsFilter: true, supportsPage: true, noSearch: true },
  };

  if (handlers[command]) {
    const handler = handlers[command];
    let url = handler.endpoint;
    let queryParams = '';

    if (handler.noParams || handler.noSearch) {
      if (handler.noParams) {
        url = handler.endpoint;
      } else {
        if (handler.supportsPage && args[2]) {
          queryParams += `page=${args[2]}`;
        }
        if (handler.supportsFilter && args[1]) {
          queryParams += `filter=${args[1]}`;
        }
        if (handler.supportsQuery && args[1]) {
          queryParams += `q=${args[1]}`;
          if (args[2]) queryParams += `&page=${args[2]}`;
        }
        url = handler.endpoint;
      }

      try {
        const response = await fetch(`${JIKAN_API}${url}${queryParams ? '?' + queryParams : ''}`);
        if (!response.ok) {
          await sendTelegramMessage(chatId, 'Resource not found. Please try different parameters.');
          return;
        }
        const data = await response.json();
        const message = handler.format(data);
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        await sendTelegramMessage(chatId, 'Error fetching data. Please try again later.');
      }
      return;
    }

    if (!query) {
      await sendTelegramMessage(chatId, 'Please provide a name to search. Use /help for command usage.');
      return;
    }

    try {
      // Search for the resource by name
      const searchResponse = await fetch(`${JIKAN_API}${handler.searchEndpoint}?q=${encodeURIComponent(query)}&limit=1`);
      if (!searchResponse.ok) {
        await sendTelegramMessage(chatId, 'Nothing found for that name. Please try a different name.');
        return;
      }

      const searchData = await searchResponse.json();
      if (!searchData.data || searchData.data.length === 0) {
        await sendTelegramMessage(chatId, 'No results found. Please try a different name.');
        return;
      }

      const id = searchData.data[0].mal_id;
      url = handler.endpoint.replace('{id}', id);

      if (handler.extraParam) {
        const extraParam = args[args.length - 1];
        if (!extraParam || isNaN(parseInt(extraParam))) {
          await sendTelegramMessage(chatId, `Please provide a valid ${handler.extraParam}. Use /help for command usage.`);
          return;
        }
        url = url.replace(`{${handler.extraParam}}`, extraParam);
      }

      if (handler.supportsPage && args[args.length - 1] && !handler.extraParam) {
        queryParams += `page=${args[args.length - 1]}`;
      } else if (handler.supportsPage && args[args.length - 2] && handler.extraParam) {
        queryParams += `page=${args[args.length - 2]}`;
      }

      if (handler.supportsFilter && args[args.length - 1]) {
        queryParams += `filter=${args[args.length - 1]}`;
      }

      const response = await fetch(`${JIKAN_API}${url}${queryParams ? '?' + queryParams : ''}`);
      if (!response.ok) {
        await sendTelegramMessage(chatId, 'Resource not found. Please try a different name or parameters.');
        return;
      }

      const data = await response.json();
      const message = handler.format(data);
      await sendTelegramMessage(chatId, message);
    } catch (error) {
      await sendTelegramMessage(chatId, 'Error fetching data. Please try again later.');
    }
  } else {
    await sendTelegramMessage(chatId, 'Unknown command. Use /help to see available commands.');
  }
}

// Formatting functions for each endpoint response
function formatAnime(data) {
  const anime = data.data;
  return `*${anime.title}*\n\n` +
         `Synopsis: ${anime.synopsis || 'N/A'}\n` +
         `Score: ${anime.score || 'N/A'}\n` +
         `Type: ${anime.type || 'N/A'}\n` +
         `Episodes: ${anime.episodes || 'N/A'}\n` +
         `Status: ${anime.status || 'N/A'}\n` +
         `More info: ${anime.url}`;
}

function formatAnimeCharacters(data) {
  const characters = data.data.slice(0, 3);
  return characters.length ? characters.map(c => 
    `${c.character.name} (${c.role})`
  ).join('\n') : 'No characters found.';
}

function formatAnimeStaff(data) {
  const staff = data.data.slice(0, 3);
  return staff.length ? staff.map(s => 
    `${s.person.name} (${s.positions.join(', ')})`
  ).join('\n') : 'No staff found.';
}

function formatAnimeEpisodes(data) {
  const episodes = data.data.slice(0, 3);
  return episodes.length ? episodes.map(e => 
    `Episode ${e.mal_id}: ${e.title}`
  ).join('\n') : 'No episodes found.';
}

function formatAnimeEpisode(data) {
  const episode = data.data;
  return `Episode ${episode.mal_id}: ${episode.title}\n` +
         `Aired: ${episode.aired || 'N/A'}\n` +
         `URL: ${episode.url}`;
}

function formatNews(data) {
  const news = data.data.slice(0, 3);
  return news.length ? news.map(n => 
    `${n.title}\n${n.url}`
  ).join('\n\n') : 'No news found.';
}

function formatForum(data) {
  const topics = data.data.slice(0, 3);
  return topics.length ? topics.map(t => 
    `${t.title}\n${t.url}`
  ).join('\n\n') : 'No forum topics found.';
}

function formatVideos(data) {
  const videos = data.data.promo?.slice(0, 3) || [];
  return videos.length ? videos.map(v => 
    `${v.title}\n${v.trailer.url}`
  ).join('\n\n') : 'No videos found.';
}

function formatVideoEpisodes(data) {
  const episodes = data.data.slice(0, 3);
  return episodes.length ? episodes.map(e => 
    `Episode ${e.mal_id}: ${e.title}\n${e.url}`
  ).join('\n\n') : 'No episode videos found.';
}

function formatPictures(data) {
  const pictures = data.data.slice(0, 3);
  return pictures.length ? pictures.map(p => 
    p.images.jpg.image_url
  ).join('\n') : 'No pictures found.';
}

function formatStatistics(data) {
  const stats = data.data;
  return `Watching: ${stats.watching}\n` +
         `Completed: ${stats.completed}\n` +
         `On Hold: ${stats.on_hold}\n` +
         `Dropped: ${stats.dropped}\n` +
         `Total: ${stats.total}`;
}

function formatMoreInfo(data) {
  return data.data.moreinfo || 'No additional info available.';
}

function formatRecommendations(data) {
  const recs = data.data.slice(0, 3);
  return recs.length ? recs.map(r => 
    `${r.entry.title}\n${r.url}`
  ).join('\n\n') : 'No recommendations found.';
}

function formatUserUpdates(data) {
  const updates = data.data.slice(0, 3);
  return updates.length ? updates.map(u => 
    `${u.user.username}: ${u.status} (${u.date})`
  ).join('\n') : 'No user updates found.';
}

function formatReviews(data) {
  const reviews = data.data.slice(0, 3);
  return reviews.length ? reviews.map(r => 
    `By ${r.user.username}: ${r.review.substring(0, 100)}...\nScore: ${r.score}`
  ).join('\n\n') : 'No reviews found.';
}

function formatRelations(data) {
  const relations = data.data.slice(0, 3);
  return relations.length ? relations.map(r => 
    `${r.relation}: ${r.entry.map(e => e.name).join(', ')}`
  ).join('\n') : 'No relations found.';
}

function formatThemes(data) {
  const themes = data.data;
  ret
