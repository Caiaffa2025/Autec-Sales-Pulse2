export interface ArgumentCacheKeyInput {
  productId: string;
  labId: string;
  resistanceType: string;
  competitorName: string;
  clientId?: string;
  clientName: string;
  negotiationStage: string;
  tone: string;
  toneStyle: string;
  channel: string;
  customNotes: string;
}

export interface CachedArgumentEntry {
  id: string;
  key: string;
  compositeKey: string;
  clientProductKey: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  labId: string;
  labProfileName: string;
  resistanceType: string;
  competitorName: string;
  negotiationStage: string;
  tone: string;
  toneStyle: string;
  channel: string;
  customNotes: string;
  argument: string;
  createdAt: string;
  lastAccessedAt: string;
}

type CacheBucketsMap = Record<string, CachedArgumentEntry[]>;

const CACHE_STORAGE_KEY = 'autec_argument_cache_v2';
export const MAX_ENTRIES_PER_CLIENT_PRODUCT = 10;
const MAX_CLIENT_PRODUCT_BUCKETS = 60;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

const bucketMemoryCache = new Map<string, CachedArgumentEntry[]>();
let lastSyncedRaw: string | null | undefined = undefined;

function normalizePart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveClientKey(clientId?: string, clientName?: string): string {
  const normalizedName = normalizePart(clientName || '');
  if (normalizedName) return `cli:${normalizedName}`;
  const normalizedId = (clientId || '').trim();
  if (normalizedId) return `id:${normalizedId}`;
  return 'geral';
}

export function buildClientProductKey(clientId: string, clientName: string, productId: string): string {
  const clientKey = resolveClientKey(clientId, clientName);
  const prodKey = productId.trim() || 'sem-produto';
  return `${clientKey}::${prodKey}`;
}

export function buildCompositeToneCacheKey(
  clientId: string,
  clientName: string,
  productId: string,
  toneStyle: string
): string {
  const clientProductKey = buildClientProductKey(clientId, clientName, productId);
  return `${clientProductKey}::tom:${normalizePart(toneStyle) || 'consultivo'}`;
}

export function buildArgumentCacheKey(input: ArgumentCacheKeyInput): string {
  return [
    buildCompositeToneCacheKey(input.clientId || '', input.clientName, input.productId, input.toneStyle),
    input.labId.trim(),
    normalizePart(input.resistanceType),
    normalizePart(input.competitorName),
    normalizePart(input.negotiationStage),
    normalizePart(input.tone),
    normalizePart(input.channel),
    normalizePart(input.customNotes),
  ].join('|');
}

function getEntryCompositeKey(entry: CachedArgumentEntry): string {
  if (typeof entry.compositeKey === 'string' && entry.compositeKey.trim()) {
    return entry.compositeKey;
  }
  return buildCompositeToneCacheKey(entry.clientId || '', entry.clientName || '', entry.productId || '', entry.toneStyle || '');
}

function isValidEntry(item: unknown, nowMs: number): item is CachedArgumentEntry {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<CachedArgumentEntry>;
  if (
    typeof candidate.key !== 'string' ||
    typeof candidate.clientProductKey !== 'string' ||
    typeof candidate.argument !== 'string' ||
    !candidate.argument.trim()
  ) {
    return false;
  }
  const ts = Date.parse(candidate.lastAccessedAt || candidate.createdAt || '');
  if (Number.isNaN(ts)) return false;
  const age = nowMs - ts;
  return age >= 0 && age <= CACHE_TTL_MS;
}

/**
 * Sincroniza diretamente com o localStorage antes de qualquer leitura,
 * evitando divergências quando o armazenamento é alterado externamente.
 */
function syncFromLocalStorage(): void {
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw === lastSyncedRaw) {
      return;
    }
    bucketMemoryCache.clear();
    lastSyncedRaw = raw;
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return;
    }
    const nowMs = Date.now();
    for (const [bucketKey, list] of Object.entries(parsed as CacheBucketsMap)) {
      if (!Array.isArray(list)) continue;
      const valid = list
        .filter((entry) => isValidEntry(entry, nowMs))
        .map((entry) => ({
          ...entry,
          compositeKey: getEntryCompositeKey(entry),
        }))
        .slice(0, MAX_ENTRIES_PER_CLIENT_PRODUCT);
      if (valid.length > 0) {
        bucketMemoryCache.set(bucketKey, valid);
      }
    }
  } catch {
    // ignora JSON inválido ou ambiente sem localStorage
  }
}

function serializeBuckets(): CacheBucketsMap {
  const out: CacheBucketsMap = {};
  for (const [bucketKey, entries] of bucketMemoryCache.entries()) {
    if (entries.length > 0) {
      out[bucketKey] = entries.slice(0, MAX_ENTRIES_PER_CLIENT_PRODUCT);
    }
  }
  return out;
}

function persistToStorage(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (bucketMemoryCache.size > MAX_CLIENT_PRODUCT_BUCKETS) {
      const sortedKeys = Array.from(bucketMemoryCache.entries())
        .sort((a, b) => {
          const aTime = Date.parse(a[1][0]?.lastAccessedAt || a[1][0]?.createdAt || '') || 0;
          const bTime = Date.parse(b[1][0]?.lastAccessedAt || b[1][0]?.createdAt || '') || 0;
          return bTime - aTime;
        })
        .map(([k]) => k);
      for (const staleKey of sortedKeys.slice(MAX_CLIENT_PRODUCT_BUCKETS)) {
        bucketMemoryCache.delete(staleKey);
      }
    }

    const payload = JSON.stringify(serializeBuckets());
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, payload);
      lastSyncedRaw = payload;
    } catch {
      const oldestFirst = Array.from(bucketMemoryCache.entries())
        .sort((a, b) => {
          const aTime = Date.parse(a[1][0]?.lastAccessedAt || a[1][0]?.createdAt || '') || 0;
          const bTime = Date.parse(b[1][0]?.lastAccessedAt || b[1][0]?.createdAt || '') || 0;
          return aTime - bTime;
        })
        .map(([k]) => k);

      for (const keyToDrop of oldestFirst) {
        if (bucketMemoryCache.size <= 1) break;
        bucketMemoryCache.delete(keyToDrop);
        try {
          const nextPayload = JSON.stringify(serializeBuckets());
          localStorage.setItem(CACHE_STORAGE_KEY, nextPayload);
          lastSyncedRaw = nextPayload;
          return;
        } catch {
          // continua liberando buckets antigos
        }
      }
    }
  } catch {
    // ignora ambientes sem localStorage
  }
}

export function getCachedArgumentsForClientProduct(
  clientId: string,
  clientName: string,
  productId: string
): CachedArgumentEntry[] {
  if (!productId.trim()) return [];
  syncFromLocalStorage();
  const bucketKey = buildClientProductKey(clientId, clientName, productId);
  const nowMs = Date.now();
  const entries = (bucketMemoryCache.get(bucketKey) || []).filter((e) => isValidEntry(e, nowMs));
  if (entries.length !== (bucketMemoryCache.get(bucketKey)?.length || 0)) {
    if (entries.length > 0) {
      bucketMemoryCache.set(bucketKey, entries);
    } else {
      bucketMemoryCache.delete(bucketKey);
    }
    persistToStorage();
  }
  return entries;
}

/**
 * Verifica primeiro no localStorage pela chave composta (cliente + produto + estilo de tom),
 * priorizando correspondência exata do cenário se `exactKey` for informado.
 */
export function findCachedByCompositeKey(params: {
  clientId?: string;
  clientName: string;
  productId: string;
  toneStyle: string;
  exactKey?: string;
  touchLru?: boolean;
}): { entry: CachedArgumentEntry; matchType: 'exact' | 'composite' } | null {
  if (!params.productId.trim() || !params.toneStyle.trim()) return null;
  syncFromLocalStorage();

  const bucketKey = buildClientProductKey(params.clientId || '', params.clientName, params.productId);
  const compositeKey = buildCompositeToneCacheKey(
    params.clientId || '',
    params.clientName,
    params.productId,
    params.toneStyle
  );
  const nowMs = Date.now();
  const entries = (bucketMemoryCache.get(bucketKey) || []).filter((e) => isValidEntry(e, nowMs));
  if (entries.length === 0) return null;

  let matchedIdx = -1;
  let matchType: 'exact' | 'composite' = 'composite';

  if (params.exactKey) {
    matchedIdx = entries.findIndex((e) => e.key === params.exactKey);
    if (matchedIdx !== -1) {
      matchType = 'exact';
    }
  }

  if (matchedIdx === -1) {
    matchedIdx = entries.findIndex((e) => getEntryCompositeKey(e) === compositeKey);
    matchType = 'composite';
  }

  if (matchedIdx === -1) return null;

  const found = entries[matchedIdx];
  if (params.touchLru !== false) {
    const touched: CachedArgumentEntry = {
      ...found,
      compositeKey,
      lastAccessedAt: new Date().toISOString(),
    };
    const reordered = [touched, ...entries.filter((_, i) => i !== matchedIdx)].slice(
      0,
      MAX_ENTRIES_PER_CLIENT_PRODUCT
    );
    bucketMemoryCache.set(bucketKey, reordered);
    persistToStorage();
    return { entry: touched, matchType };
  }

  return { entry: found, matchType };
}

export function hasCachedToneForClientProduct(
  clientId: string,
  clientName: string,
  productId: string,
  toneStyle: string
): boolean {
  return Boolean(
    findCachedByCompositeKey({
      clientId,
      clientName,
      productId,
      toneStyle,
      touchLru: false,
    })
  );
}

export function getCachedArgument(
  key: string,
  clientId = '',
  clientName = '',
  productId = ''
): CachedArgumentEntry | null {
  syncFromLocalStorage();
  const nowMs = Date.now();

  const searchInBucket = (bucketKey: string): CachedArgumentEntry | null => {
    const entries = bucketMemoryCache.get(bucketKey);
    if (!entries || entries.length === 0) return null;
    const idx = entries.findIndex((e) => e.key === key && isValidEntry(e, nowMs));
    if (idx === -1) return null;
    const found = entries[idx];
    const touched: CachedArgumentEntry = {
      ...found,
      compositeKey: getEntryCompositeKey(found),
      lastAccessedAt: new Date().toISOString(),
    };
    const reordered = [touched, ...entries.filter((_, i) => i !== idx)].slice(0, MAX_ENTRIES_PER_CLIENT_PRODUCT);
    bucketMemoryCache.set(bucketKey, reordered);
    persistToStorage();
    return touched;
  };

  if (productId.trim()) {
    const directBucket = buildClientProductKey(clientId, clientName, productId);
    const hit = searchInBucket(directBucket);
    if (hit) return hit;
  }

  for (const bucketKey of bucketMemoryCache.keys()) {
    const hit = searchInBucket(bucketKey);
    if (hit) return hit;
  }

  return null;
}

export function setCachedArgument(
  input: ArgumentCacheKeyInput,
  argument: string,
  meta: { productName: string; labProfileName?: string }
): CachedArgumentEntry {
  syncFromLocalStorage();
  const nowIso = new Date().toISOString();
  const clientProductKey = buildClientProductKey(input.clientId || '', input.clientName, input.productId);
  const compositeKey = buildCompositeToneCacheKey(
    input.clientId || '',
    input.clientName,
    input.productId,
    input.toneStyle
  );
  const key = buildArgumentCacheKey(input);

  const entry: CachedArgumentEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    key,
    compositeKey,
    clientProductKey,
    clientId: (input.clientId || '').trim(),
    clientName: input.clientName.trim() || 'Cliente Geral',
    productId: input.productId.trim(),
    productName: meta.productName,
    labId: input.labId.trim(),
    labProfileName: meta.labProfileName || '',
    resistanceType: input.resistanceType,
    competitorName: input.competitorName.trim(),
    negotiationStage: input.negotiationStage,
    tone: input.tone,
    toneStyle: input.toneStyle,
    channel: input.channel,
    customNotes: input.customNotes.trim(),
    argument,
    createdAt: nowIso,
    lastAccessedAt: nowIso,
  };

  const existing = (bucketMemoryCache.get(clientProductKey) || []).filter((e) => e.key !== key);
  const nextBucket = [entry, ...existing].slice(0, MAX_ENTRIES_PER_CLIENT_PRODUCT);
  bucketMemoryCache.set(clientProductKey, nextBucket);
  persistToStorage();
  return entry;
}

export function markCachedEntryAccessed(clientProductKey: string, entryKey: string): CachedArgumentEntry | null {
  syncFromLocalStorage();
  const entries = bucketMemoryCache.get(clientProductKey);
  if (!entries) return null;
  const idx = entries.findIndex((e) => e.key === entryKey);
  if (idx === -1) return null;
  const updated: CachedArgumentEntry = {
    ...entries[idx],
    compositeKey: getEntryCompositeKey(entries[idx]),
    lastAccessedAt: new Date().toISOString(),
  };
  const reordered = [updated, ...entries.filter((_, i) => i !== idx)].slice(0, MAX_ENTRIES_PER_CLIENT_PRODUCT);
  bucketMemoryCache.set(clientProductKey, reordered);
  persistToStorage();
  return updated;
}

export function removeCachedArgumentEntry(clientProductKey: string, entryKey: string): void {
  syncFromLocalStorage();
  const entries = bucketMemoryCache.get(clientProductKey);
  if (!entries) return;
  const remaining = entries.filter((e) => e.key !== entryKey);
  if (remaining.length > 0) {
    bucketMemoryCache.set(clientProductKey, remaining);
  } else {
    bucketMemoryCache.delete(clientProductKey);
  }
  persistToStorage();
}

export function clearClientProductCache(clientId: string, clientName: string, productId: string): void {
  syncFromLocalStorage();
  const bucketKey = buildClientProductKey(clientId, clientName, productId);
  bucketMemoryCache.delete(bucketKey);
  persistToStorage();
}

export function clearArgumentCache(): void {
  bucketMemoryCache.clear();
  lastSyncedRaw = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getArgumentCacheCount(): number {
  syncFromLocalStorage();
  let total = 0;
  for (const entries of bucketMemoryCache.values()) {
    total += entries.length;
  }
  return total;
}

export function getArgumentCacheBucketCount(): number {
  syncFromLocalStorage();
  return bucketMemoryCache.size;
}
