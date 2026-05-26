export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cart_items: {
        Row: {
          user_id: string;
          product_id: number;
          name: string;
          brand: string;
          price: number;
          image: string;
          size: string;
          color: string;
          quantity: number;
          updated_at: string;
        };
        Insert: Partial<{
          user_id: string;
          product_id: number;
          name: string;
          brand: string;
          price: number;
          image: string;
          size: string;
          color: string;
          quantity: number;
          updated_at: string;
        }>;
        Update: Partial<{
          user_id: string;
          product_id: number;
          name: string;
          brand: string;
          price: number;
          image: string;
          size: string;
          color: string;
          quantity: number;
          updated_at: string;
        }>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          image_url?: string | null;
          status: string;
          created_at: string;
          product_id?: number | null;
          order_id?: string | null;
        };
        Insert: Partial<{
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          image_url?: string | null;
          status: string;
          created_at: string;
          product_id?: number | null;
          order_id?: string | null;
        }>;
        Update: Partial<{
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          image_url?: string | null;
          status: string;
          created_at: string;
          product_id?: number | null;
          order_id?: string | null;
        }>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          status: string;
          total_amount: number;
          shipping_address: Json;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          status: string;
          total_amount: number;
          shipping_address: Json;
          created_at: string;
        }>;
        Update: Partial<{
          id: string;
          status: string;
          total_amount: number;
          shipping_address: Json;
          created_at: string;
        }>;
        Relationships: [];
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_url?: string | null;
          link_url?: string | null;
          cta_text?: string | null;
          is_active: boolean;
          start_date?: string | null;
          end_date?: string | null;
          priority: number;
        };
        Insert: Partial<{
          id: string;
          title: string;
          description: string;
          image_url?: string | null;
          link_url?: string | null;
          cta_text?: string | null;
          is_active: boolean;
          start_date?: string | null;
          end_date?: string | null;
          priority: number;
        }>;
        Update: Partial<{
          id: string;
          title: string;
          description: string;
          image_url?: string | null;
          link_url?: string | null;
          cta_text?: string | null;
          is_active: boolean;
          start_date?: string | null;
          end_date?: string | null;
          priority: number;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
