// Trainerize webhook and API types

export type TrainerizeEventType =
  | "client.created"
  | "client.updated"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "subscription.expired"
  | "purchase.completed";

export interface TrainerizeClient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
  trainer_id?: string;
  trainer_name?: string;
  tags?: string[];
}

export interface TrainerizePlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle?: "monthly" | "annual" | "one_time" | "custom";
  duration_weeks?: number;
  features?: string[];
}

export interface TrainerizeSubscription {
  id: string;
  client_id: string;
  plan_id: string;
  plan_name: string;
  status: "active" | "cancelled" | "expired" | "trial";
  start_date: string;
  end_date?: string;
  amount_paid: number;
  currency: string;
  billing_cycle?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainerizePurchase {
  id: string;
  client_id: string;
  item_id: string;
  item_name: string;
  item_type: "plan" | "addon" | "package";
  amount: number;
  currency: string;
  payment_method?: string;
  status: "completed" | "refunded" | "failed";
  purchased_at: string;
}

export interface TrainerizeWebhookPayload {
  event_id: string;
  event_type: TrainerizeEventType;
  created_at: string;
  trainer_id: string;
  data: {
    client?: TrainerizeClient;
    subscription?: TrainerizeSubscription;
    purchase?: TrainerizePurchase;
  };
}
