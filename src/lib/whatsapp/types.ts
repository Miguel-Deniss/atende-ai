export interface WhatsAppTextMessage {
  body: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type?: string;
  text?: WhatsAppTextMessage;
}

export interface WhatsAppProfile {
  name?: string;
}

export interface WhatsAppContact {
  profile?: WhatsAppProfile;
  wa_id: string;
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata?: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppChange {
  field: string;
  value: WhatsAppValue;
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry?: WhatsAppEntry[];
}

export interface IncomingWhatsAppMessage {
  phoneNumberId: string;
  displayPhoneNumber: string;
  from: string;
  messageId: string;
  body: string;
  profileName?: string;
  timestamp: string;
}
