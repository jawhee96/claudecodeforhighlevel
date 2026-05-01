// Trainerize API client (read-only — we primarily receive webhooks)

const TZ_BASE = "https://api.trainerize.com/v1";

async function tzFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TZ_BASE}${path}`, {
    headers: {
      "x-api-key": process.env.TRAINERIZE_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Trainerize GET ${path} failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function getClient(clientId: string) {
  return tzFetch<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    status: string;
  }>(`/clients/${clientId}`);
}

export async function getSubscription(subscriptionId: string) {
  return tzFetch<{
    id: string;
    client_id: string;
    plan_name: string;
    status: string;
    amount_paid: number;
    currency: string;
  }>(`/subscriptions/${subscriptionId}`);
}
