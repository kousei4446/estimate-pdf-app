export type TaxRounding = "round" | "floor" | "ceil";

export interface EstimateItem {
  name?: string;
  unitPrice?: number | string;
  quantity?: number | string;
  amount?: number | string;
  unit?: string;
  spec?: string;
}

export interface EstimatePayload {
  customer?: string;
  date?: string;
  taxRate?: number | string;
  taxRounding?: TaxRounding;
  estimateTotal?: number | string;
  items?: EstimateItem[];
  projectName?: string;
  projectPlace?: string;
  validity?: string;
  payment?: string;
  issuerTitle?: string;
  issuerName?: string;
  issuerAddr?: string;
  issuerTel?: string;
  issuerMobile?: string;
  company?: string;
  companyMain?: string;
  postId?: string;
  address?: string;
  tel?: string;
  phone?: string;
  showStamp?: boolean;
  stampImageDataUrl?: string;
  staffImageDataUrl?: string;
  creatorImageDataUrl?: string;
}
