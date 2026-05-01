// Oncehub API client (read-only — we only receive webhooks from Oncehub)
// This client is used if we ever need to pull booking details via API.

const ONCEHUB_BASE = "https://api.oncehub.com/v2";

async function oncehubFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${ONCEHUB_BASE}${path}`, {
    headers: {
      "API-Key": process.env.ONCEHUB_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Oncehub GET ${path} failed: ${res.status} ${body}`);
  }

  return res.json();
}

export async function getBooking(bookingId: string) {
  return oncehubFetch<{
    id: string;
    subject: string;
    status: string;
    start_time: string;
    end_time: string;
    customer: { name: string; email: string; phone?: string };
  }>(`/bookings/${bookingId}`);
}
