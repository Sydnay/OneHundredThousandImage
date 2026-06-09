export interface Purchase {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fill_type: 'color' | 'image';
  color: string | null;
  image_url: string | null;
  label: string | null;
  link_url: string | null;
  created_at: string;
  likes?: number;
}

export interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface NormalizedSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  cellCount: number;
  totalPrice: number;
}

export interface PurchasePayload {
  x: number;
  y: number;
  width: number;
  height: number;
  fill_type: 'color' | 'image';
  color?: string;
  image_url?: string;
  label?: string;
  link_url?: string;
}
