// Mindbody API v6 types

export interface MBClient {
  Id: string;
  UniqueId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  MobilePhone: string;
  HomePhone?: string;
  WorkPhone?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  State?: string;
  PostalCode?: string;
  Country?: string;
  BirthDate?: string;
  Gender?: string;
  EmergencyContactInfoName?: string;
  EmergencyContactInfoPhone?: string;
  CreationDate: string;
  LastModifiedDateTime: string;
  Active: boolean;
  Status: string;
  // Mindbody client index: 0–5 scale representing visit frequency/value
  ClientIndexes?: MBClientIndex[];
  Memberships?: MBMembership[];
}

export interface MBClientIndex {
  Id: number;
  RequiredAge?: number;
  Value?: MBClientIndexValue;
}

export interface MBClientIndexValue {
  Id: number;
  Name: string; // e.g. "High", "Medium", "Low"
}

export interface MBMembership {
  Name: string;
  MembershipId: number;
  RestrictedLocations?: number[];
  IconCode?: string;
}

export interface MBSaleItem {
  Id: number;
  Type: "Service" | "Product" | "GiftCard" | "Tip";
  Name: string;
  Count: number;
  AMTPaid: number;
  AMTDiscount: number;
  Expiration?: string;
}

export interface MBSale {
  Id: number;
  SaleDate: string;
  SaleTime: string;
  ClientId: string;
  LocationId: number;
  Payments: MBPayment[];
  PurchasedItems?: MBSaleItem[];
  TotalAmountPaid?: number;
}

export interface MBPayment {
  Id: number;
  Amount: number;
  Method: number;
  MethodDescription: string;
  Notes?: string;
}

export interface MBAppointment {
  Id: number;
  Status: string;
  StartDateTime: string;
  EndDateTime: string;
  ClientId: string;
  StaffId: number;
  LocationId: number;
  ServiceId: number;
  Notes?: string;
  ClientServiceId?: number;
}

// ── Webhook event shapes ──────────────────────────────────────────────────────

export type MBWebhookEventType =
  | "client.created"
  | "client.updated"
  | "client.deactivated"
  | "sale.completed"
  | "appointment.created"
  | "appointment.updated"
  | "appointment.cancelled"
  | "class.registration.created"
  | "class.registration.cancelled";

export interface MBWebhookPayload<T = unknown> {
  messageId: string;
  eventId: string;
  eventSchemaVersion: number;
  subscriberGUID: string;
  eventInstanceOriginationDateTime: string;
  siteId: number;
  eventType: MBWebhookEventType;
  eventContent: T;
}

export interface MBClientEventContent {
  siteId: number;
  clientId: string;
  clientUniqueId?: number;
}

export interface MBSaleEventContent {
  siteId: number;
  saleId: number;
  clientId: string;
  totalAmountPaid?: number;
  items?: MBSaleItem[];
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface MBTokenResponse {
  AccessToken: string;
  TokenExpirationTime: string;
}
