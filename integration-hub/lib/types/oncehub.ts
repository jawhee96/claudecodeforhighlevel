// Oncehub (ScheduleOnce) webhook types

export type OncehubEventType =
  | "booking.created"
  | "booking.rescheduled"
  | "booking.canceled"
  | "booking.completed"
  | "booking.no_show";

export interface OncehubBooking {
  id: string;
  status: "booked" | "rescheduled" | "canceled" | "completed" | "no_show";
  subject: string;
  start_time: string;   // ISO 8601
  end_time: string;     // ISO 8601
  duration: number;     // minutes
  location?: string;
  meeting_url?: string;
  notes?: string;
  // The page/event type this booking came from
  booking_page?: {
    id: string;
    name: string;
  };
  organizer?: {
    id: string;
    name: string;
    email: string;
  };
  customer: OncehubCustomer;
  // Custom fields the booker filled in
  custom_fields?: OncehubCustomField[];
  // Original booking id when event is a reschedule or cancellation
  original_booking_id?: string;
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface OncehubCustomer {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  timezone?: string;
  company?: string;
}

export interface OncehubCustomField {
  label: string;
  value: string;
}

export interface OncehubWebhookPayload {
  id: string;          // unique event id
  event_type: OncehubEventType;
  created_at: string;
  data: {
    booking: OncehubBooking;
  };
}
