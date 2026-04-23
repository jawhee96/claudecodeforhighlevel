export type Status = 'won' | 'open' | 'lost'
export type Location = 'RD' | 'SP'

export interface MetaRow {
  campaign: string
  spend: number
  clicks: number
  impressions: number
  leads: number
  date: string
}

export interface CrmRow {
  status: Status
  value: number
  location: Location
}
