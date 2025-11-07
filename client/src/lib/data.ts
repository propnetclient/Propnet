import { supabase } from "./supabase";

type AnyRecord = Record<string, any>;

function toCamel<T extends AnyRecord>(row: AnyRecord): T {
  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out as T;
}

function toSnake<T extends AnyRecord>(row: AnyRecord): T {
  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(row)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out as T;
}

function withoutUndefined(obj: AnyRecord): AnyRecord {
  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function getProperties(): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(
      [
        "id",
        "owner_id",
        "title",
        "property_type",
        "transaction_type",
        "price",
        "rent_frequency",
        "size",
        "size_unit",
        "location",
        "full_address",
        "flat_number",
        "floor_number",
        "building_society",
        "description",
        "bhk",
        "listing_type",
        "is_publicly_visible",
        "photos",
        "owner_name",
        "owner_phone",
        "commission_terms",
        "scope_of_work",
        "agreement_document",
        "owner_approval_status",
        "approval_timestamp",
        "owner_client_id",
        "is_active",
        "created_at",
      ].join(",")
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function getPropertyById(id: number): Promise<AnyRecord | null> {
  const { data: propRows, error: propErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .limit(1);
  if (propErr) throw propErr;
  if (!propRows || propRows.length === 0) return null;
  const property = toCamel(propRows[0]);

  // Owner
  const { data: ownerRows } = await supabase
    .from("users")
    .select("id,name,agency_name")
    .eq("id", property.ownerId)
    .limit(1);
  const owner = ownerRows && ownerRows[0] ? toCamel(ownerRows[0]) : null;

  // Co-agents via co_listings
  const { data: coListRows } = await supabase
    .from("co_listings")
    .select("agent_id")
    .eq("property_id", id);
  const agentIds = (coListRows || []).map(r => r.agent_id);
  let coAgents: AnyRecord[] = [];
  if (agentIds.length) {
    const { data: agents } = await supabase
      .from("users")
      .select("id,name")
      .in("id", agentIds);
    coAgents = (agents || []).map(toCamel);
  }

  return { ...property, owner, coAgents };
}

// Properties CRUD
export async function createProperty(property: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(property));
  const { data, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function updateProperty(id: number, updates: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(updates));
  const { data, error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function deleteProperty(id: number): Promise<void> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
}

export async function getClients(): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function getFirstUser(): Promise<AnyRecord | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data && data[0] ? toCamel(data[0]) : null;
}

export async function upsertUser(user: AnyRecord): Promise<AnyRecord | null> {
  // Map camelCase to snake_case keys expected by DB
  const payload: AnyRecord = {};
  for (const [k, v] of Object.entries(user)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    payload[snake] = v;
  }
  const { data, error } = await supabase
    .from("users")
    .upsert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return data && data[0] ? toCamel(data[0]) : null;
}

export async function getBetaSignups(): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("beta_signups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function updateBetaSignupStatus(id: number, status: string, notes?: string): Promise<void> {
  const { error } = await supabase
    .from("beta_signups")
    .update({ status, notes })
    .eq("id", id);
  if (error) throw error;
}

// Storage uploads (optional)
export async function uploadPublicFile(bucket: string, file: File, pathPrefix: string = ""): Promise<string | null> {
  try {
    const filePath = `${pathPrefix}${Date.now()}_${file.name}`.replace(/\s+/g, "_");
    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      upsert: true,
    });
    if (error) return null;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}

// Clients CRUD
export async function createClient(client: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(client));
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function updateClient(id: number, updates: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(updates));
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function deleteClient(id: number): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function getDeals(): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

// Deals CRUD
export async function createDeal(deal: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(deal));
  const { data, error } = await supabase
    .from("deals")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function updateDeal(id: number, updates: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(updates));
  const { data, error } = await supabase
    .from("deals")
    .update(payload)
    .eq("id", id)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function deleteDeal(id: number): Promise<void> {
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw error;
}

export async function getTasks(): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

// Tasks CRUD
export async function createTask(task: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(task));
  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function updateTask(id: number, updates: AnyRecord): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake(updates));
  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function deleteTask(id: number): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function getClientById(id: number): Promise<AnyRecord | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .limit(1);
  if (error) throw error;
  return data && data[0] ? toCamel(data[0]) : null;
}

export async function getDealsByClientId(clientId: number): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function getTasksByClientId(clientId: number): Promise<AnyRecord[]> {
  // tasks join deals to filter by client
  const { data: dealRows, error: dealsErr } = await supabase
    .from("deals")
    .select("id")
    .eq("client_id", clientId);
  if (dealsErr) throw dealsErr;
  const dealIds = (dealRows || []).map(r => r.id);
  if (dealIds.length === 0) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("deal_id", dealIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

// Conversations & Messages
export async function getNetworkUsers(excludeUserId?: number): Promise<AnyRecord[]> {
  let qb = supabase.from("users").select("id,name,agency_name,phone");
  if (excludeUserId) qb = qb.neq("id", excludeUserId);
  const { data, error } = await qb.order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function getConversationsByUser(userId: number): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function getMessagesByConversation(conversationId: number): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function createConversation(input: { participant1Id: number; participant2Id: number; propertyId?: number; type?: string; }): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake({
    participant1Id: input.participant1Id,
    participant2Id: input.participant2Id,
    propertyId: input.propertyId,
    type: input.type || 'general',
    lastMessageAt: new Date().toISOString(),
  }));
  const { data, error } = await supabase
    .from("conversations")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  return toCamel(data![0]);
}

export async function createMessage(input: { conversationId: number; senderId: number; content: string; messageType?: string }): Promise<AnyRecord> {
  const payload = withoutUndefined(toSnake({
    conversationId: input.conversationId,
    senderId: input.senderId,
    content: input.content,
    messageType: input.messageType || 'text',
  }));
  const { data, error } = await supabase
    .from("messages")
    .insert(payload)
    .select("*")
    .limit(1);
  if (error) throw error;
  // bump conversation last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.conversationId);
  return toCamel(data![0]);
}

// Co-listing requests
export async function getCoListingRequestsByUser(userId: number): Promise<AnyRecord[]> {
  const { data, error } = await supabase
    .from("co_listing_requests")
    .select("*")
    .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toCamel);
}

export async function updateCoListingRequestStatus(id: number, status: string): Promise<void> {
  const { error } = await supabase
    .from("co_listing_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}


