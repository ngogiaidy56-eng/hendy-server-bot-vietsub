export interface SubtitleCue {
  id: string;
  start: string;
  end: string;
  startSec: number;
  endSec: number;
  speaker: string;
  originalText: string;
  vietsubText: string;
  style: "Default" | "CyberNeon" | "SignTop" | "KaraokeFX";
  effectTag: string;
}

export interface D1User {
  id: string;
  telegramId: string;
  username: string;
  fullName: string;
  role: string;
  vipTier: string;
  balanceVnd: number;
  totalSpentVnd: number;
  status: string;
  updatedAt: string;
}

export interface D1Transaction {
  id: string;
  userId: string;
  username: string;
  type: string;
  route: string;
  amountVnd: number;
  bankCode: string;
  referenceCode: string;
  status: string;
  createdAt: string;
}

export interface D1ShopItem {
  id: string;
  code: string;
  name: string;
  category: string;
  priceVnd: number;
  salesCount: number;
  version: string;
  storageKeyR2: string;
}

export interface D1Gifcode {
  code: string;
  rewardVnd: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  status: string;
}

export interface D1MxhOrder {
  id: string;
  userId: string;
  platform: string;
  serviceName: string;
  targetUrl: string;
  quantity: number;
  priceVnd: number;
  status: string;
  createdAt: string;
}

export interface D1VietsubJob {
  id: string;
  title: string;
  submittedBy: string;
  sourceLang: string;
  targetLang: string;
  sttEngine: string;
  translateEngine: string;
  renderMode: string;
  progress: number;
  status: string;
  r2OutputKey: string;
  assFileKey: string;
  updatedAt: string;
}

export interface KvConfigItem {
  key: string;
  namespace: string;
  value: string;
  description: string;
  updatedAt: string;
}

export interface KvApiKeyItem {
  keyName: string;
  namespace: string;
  maskedValue: string;
  provider: string;
  status: string;
  lastRotated: string;
}

export interface KvSessionItem {
  sessionId: string;
  userId: string;
  username: string;
  clientChannel: string;
  activeRoute: string;
  ttlSeconds: number;
  hmacVerified: boolean;
}

export interface R2ObjectItem {
  key: string;
  bucket: string;
  sizeMb: number;
  contentType: string;
  tierOrigin: string;
  updatedAt: string;
}

export interface DevOpsBindingItem {
  bindingName: string;
  resourceType: string;
  resourceId: string;
  targetTier: string;
  status: string;
}

export interface GatewayLogItem {
  id: string;
  timestamp: string;
  sourceClient: string;
  route: string;
  targetEngine: string;
  hmacSignature: string;
  rbacRole: string;
  latencyMs: number;
  status: "200 OK" | "403 RBAC_DENIED";
  summary: string;
}

export interface PlatformState {
  metrics: {
    totalRevenueVnd: number;
    totalPurchasesVnd: number;
    activeUsers: number;
    activeKvKeys: number;
    r2StorageMb: number;
    queueJobsCount: number;
  };
  d1Database: {
    users: D1User[];
    transactions: D1Transaction[];
    shopItems: D1ShopItem[];
    gifcodes: D1Gifcode[];
    mxhOrders: D1MxhOrder[];
    vietsubQueue: D1VietsubJob[];
  };
  kvStore: {
    config: KvConfigItem[];
    apiKeys: KvApiKeyItem[];
    sessions: KvSessionItem[];
  };
  r2Objects: R2ObjectItem[];
  devopsBindings: DevOpsBindingItem[];
  gatewayLogs: GatewayLogItem[];
  studioSubtitles: SubtitleCue[];
}

export interface MonorepoFileItem {
  path: string;
  category: string;
  sizeBytes: number;
  content: string;
}

export type ActiveWorkspaceTab =
  | "admin"
  | "studio"
  | "client"
  | "devops"
  | "architecture"
  | "monorepo";
