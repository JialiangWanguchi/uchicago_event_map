type LiveWhaleRssItem = {
  id: string;
  title: string;
  url: string;
  pubDate: string;
  ends: string | null;
  timezone: string | null;
  allDay: boolean;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  imageUrl: string | null;
  categories: string[];
  audience: string[];
  campus: string[];
  description: string | null;
};

type FeedTag = {
  opening: string;
  closing: string;
};

const LIVEWHALE_RSS_ENDPOINT = "https://events.uchicago.edu/live/rss/events/";

const TAGS = {
  item: { opening: "<item>", closing: "</item>" },
  title: { opening: "<title>", closing: "</title>" },
  link: { opening: "<link>", closing: "</link>" },
  pubDate: { opening: "<pubDate>", closing: "</pubDate>" },
  description: { opening: "<description><![CDATA[", closing: "]]></description>" },
  livewhaleId: { opening: "<livewhale:id>", closing: "</livewhale:id>" },
  timezone: { opening: "<livewhale:timezone>", closing: "</livewhale:timezone>" },
  allDay: { opening: "<livewhale:all_day>", closing: "</livewhale:all_day>" },
  categories: { opening: "<livewhale:categories>", closing: "</livewhale:categories>" },
  categoriesAudience: { opening: "<livewhale:categories_audience>", closing: "</livewhale:categories_audience>" },
  categoriesCampus: { opening: "<livewhale:categories_campus>", closing: "</livewhale:categories_campus>" },
  ends: { opening: "<livewhale:ends>", closing: "</livewhale:ends>" },
  image: { opening: "<livewhale:image_full>", closing: "</livewhale:image_full>" },
  imageFallback: { opening: "<livewhale:image>", closing: "</livewhale:image>" },
  geoPoint: { opening: "<georss:point>", closing: "</georss:point>" },
  geoName: { opening: "<georss:featurename>", closing: "</georss:featurename>" }
} satisfies Record<string, FeedTag>;

function extractTagValue(block: string, tag: FeedTag) {
  const start = block.indexOf(tag.opening);
  if (start === -1) {
    return null;
  }

  const contentStart = start + tag.opening.length;
  const end = block.indexOf(tag.closing, contentStart);
  if (end === -1) {
    return null;
  }

  return block.slice(contentStart, end).trim();
}

function extractItems(xml: string) {
  const items: string[] = [];
  let searchStart = 0;

  while (true) {
    const itemStart = xml.indexOf(TAGS.item.opening, searchStart);
    if (itemStart === -1) {
      break;
    }

    const itemEnd = xml.indexOf(TAGS.item.closing, itemStart);
    if (itemEnd === -1) {
      break;
    }

    items.push(xml.slice(itemStart, itemEnd + TAGS.item.closing.length));
    searchStart = itemEnd + TAGS.item.closing.length;
  }

  return items;
}

function decodeHtmlEntities(input?: string | null) {
  if (!input) {
    return "";
  }

  const namedEntities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " "
  };

  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&([a-z]+);/gi, (_, name) => namedEntities[name.toLowerCase()] ?? `&${name};`);
}

function splitCsv(value: string | null) {
  return decodeHtmlEntities(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseCoordinates(value: string | null) {
  if (!value) {
    return { latitude: null, longitude: null };
  }

  const [latitude, longitude] = value.split(/\s+/).map((part) => Number(part));
  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null
  };
}

function parseRssItem(block: string): LiveWhaleRssItem | null {
  const id = extractTagValue(block, TAGS.livewhaleId);
  const title = extractTagValue(block, TAGS.title);
  const url = extractTagValue(block, TAGS.link);
  const pubDate = extractTagValue(block, TAGS.pubDate);

  if (!id || !title || !url || !pubDate) {
    return null;
  }

  const { latitude, longitude } = parseCoordinates(extractTagValue(block, TAGS.geoPoint));

  return {
    id,
    title: decodeHtmlEntities(title),
    url: decodeHtmlEntities(url),
    pubDate,
    ends: extractTagValue(block, TAGS.ends),
    timezone: extractTagValue(block, TAGS.timezone),
    allDay: extractTagValue(block, TAGS.allDay) === "1",
    latitude,
    longitude,
    location: decodeHtmlEntities(extractTagValue(block, TAGS.geoName)) || null,
    imageUrl:
      decodeHtmlEntities(extractTagValue(block, TAGS.image)) ||
      decodeHtmlEntities(extractTagValue(block, TAGS.imageFallback)) ||
      null,
    categories: splitCsv(extractTagValue(block, TAGS.categories)),
    audience: splitCsv(extractTagValue(block, TAGS.categoriesAudience)),
    campus: splitCsv(extractTagValue(block, TAGS.categoriesCampus)),
    description: decodeHtmlEntities(extractTagValue(block, TAGS.description)) || null
  };
}

export async function fetchLocalistEvents(page = 1) {
  const response = await fetch(LIVEWHALE_RSS_ENDPOINT, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`LiveWhale RSS request failed: ${response.status}`);
  }

  const xml = await response.text();
  const parsed = extractItems(xml)
    .map(parseRssItem)
    .filter(Boolean) as LiveWhaleRssItem[];

  const perPage = 100;
  const from = (page - 1) * perPage;
  const to = from + perPage;

  return {
    events: parsed.slice(from, to).map((event) => ({ event })),
    page: {
      current: page,
      total: Math.max(Math.ceil(parsed.length / perPage), 1)
    }
  };
}

export type LocalistResponse = Awaited<ReturnType<typeof fetchLocalistEvents>>;
