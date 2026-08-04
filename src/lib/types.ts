export type AgentCategory =
  | "coding"
  | "research"
  | "support"
  | "marketing"
  | "trading"
  | "design"
  | "ops"
  | "education";

export type PricingModel = "one-time" | "subscription" | "usage";

export interface Agent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: AgentCategory;
  price: number;
  pricingModel: PricingModel;
  rating: number;
  reviewCount: number;
  seller: string;
  sellerVerified: boolean;
  capabilities: string[];
  model: string;
  tags: string[];
  featured?: boolean;
  bestseller?: boolean;
  newRelease?: boolean;
  imageHue: number;
  monthlyUsers: number;
}

export interface CartItem {
  agentId: string;
  quantity: number;
}

export interface Review {
  id: string;
  agentId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}
