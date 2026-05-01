import type {
  MBClient,
  MBSale,
  MBAppointment,
  MBTokenResponse,
} from "@/lib/types/mindbody";

const MB_BASE = "https://api.mindbodyonline.com/public/v6";

// Token is cached in-process; refreshed when expired
let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && tokenExpiry && tokenExpiry > new Date()) {
    return cachedToken;
  }

  const res = await fetch(`${MB_BASE}/usertoken/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.MINDBODY_API_KEY!,
      SiteId: process.env.MINDBODY_SITE_ID!,
    },
    body: JSON.stringify({
      Username: process.env.MINDBODY_STAFF_USERNAME,
      Password: process.env.MINDBODY_STAFF_PASSWORD,
    }),
  });

  if (!res.ok) {
    throw new Error(`Mindbody auth failed: ${res.status} ${await res.text()}`);
  }

  const data: MBTokenResponse = await res.json();
  cachedToken = data.AccessToken;
  tokenExpiry = new Date(data.TokenExpirationTime);
  return cachedToken;
}

async function mbFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${MB_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.MINDBODY_API_KEY!,
      SiteId: process.env.MINDBODY_SITE_ID!,
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mindbody ${options.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function getMBClientById(clientId: string): Promise<MBClient | null> {
  const data = await mbFetch<{ Clients: MBClient[] }>(
    `/client/clients?ClientIds=${encodeURIComponent(clientId)}`
  );
  return data.Clients?.[0] ?? null;
}

export async function getMBClientByEmail(email: string): Promise<MBClient | null> {
  const data = await mbFetch<{ Clients: MBClient[] }>(
    `/client/clients?SearchText=${encodeURIComponent(email)}`
  );
  return data.Clients?.find((c) => c.Email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createMBClient(
  client: Partial<MBClient>
): Promise<MBClient> {
  const data = await mbFetch<{ Client: MBClient }>("/client/addclient", {
    method: "POST",
    body: JSON.stringify(client),
  });
  return data.Client;
}

export async function updateMBClient(
  clientId: string,
  updates: Partial<MBClient>
): Promise<MBClient> {
  const data = await mbFetch<{ Client: MBClient }>("/client/updateclient", {
    method: "POST",
    body: JSON.stringify({ ...updates, Id: clientId }),
  });
  return data.Client;
}

export async function getSale(saleId: number): Promise<MBSale | null> {
  const data = await mbFetch<{ Sales: MBSale[] }>(
    `/sale/sales?SaleIds=${saleId}`
  );
  return data.Sales?.[0] ?? null;
}

export async function bookAppointment(
  appointment: Omit<MBAppointment, "Id">
): Promise<MBAppointment> {
  const data = await mbFetch<{ Appointment: MBAppointment }>(
    "/appointment/addappointment",
    {
      method: "POST",
      body: JSON.stringify(appointment),
    }
  );
  return data.Appointment;
}

// Add a service/package to a client account
export async function addServiceToClient(payload: {
  ClientId: string;
  ServiceId: number;
  LocationId?: number;
}): Promise<void> {
  await mbFetch("/sale/checkoutshoppingcart", {
    method: "POST",
    body: JSON.stringify({
      ClientId: payload.ClientId,
      InStore: false,
      CartItems: [
        {
          Item: { Type: "Service", Metadata: { Id: payload.ServiceId } },
          DiscountAmount: 0,
          Quantity: 1,
        },
      ],
      LocationId: payload.LocationId ?? parseInt(process.env.MINDBODY_SITE_ID ?? "0"),
      Payments: [],
    }),
  });
}
