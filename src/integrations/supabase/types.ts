export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          category: Database["public"]["Enums"]["account_category"]
          code: string
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string | null
        }
        Insert: {
          balance?: number
          category: Database["public"]["Enums"]["account_category"]
          code: string
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Update: {
          balance?: number
          category?: Database["public"]["Enums"]["account_category"]
          code?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_super_admin: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_super_admin?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_super_admin?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      bulk_imports: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_rows: number | null
          filename: string
          id: string
          status: string | null
          successful_rows: number | null
          total_rows: number | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number | null
          filename: string
          id?: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number | null
          filename?: string
          id?: string
          status?: string | null
          successful_rows?: number | null
          total_rows?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_imports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_products: {
        Row: {
          brand_id: string | null
          catalog_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          hsn_code: string | null
          id: string
          name: string
          suggested_price: number | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          name: string
          suggested_price?: number | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          catalog_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          name?: string
          suggested_price?: number | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_products_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "product_catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message: string
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message: string
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message?: string
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          order_id: string | null
          seller_id: string | null
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          seller_id?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          seller_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string
          id: string
          is_vendor: boolean | null
          name: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          is_vendor?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          is_vendor?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          order_id: string
          payment_terms: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          order_id: string
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          order_id?: string
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string
          reference_type: Database["public"]["Enums"]["reference_type"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id: string
          reference_type: Database["public"]["Enums"]["reference_type"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string
          reference_type?: Database["public"]["Enums"]["reference_type"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          fulfillment_status: string | null
          id: string
          notes: string | null
          payment_status: string | null
          shipping_address: Json | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_catalogs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_catalogs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_change_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          product_id: string | null
          requested_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          requested_changes: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_change_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_change_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          price: number
          product_id: string | null
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          price?: number
          product_id?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          price?: number
          product_id?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          created_at: string | null
          currency: string
          description: string | null
          hsn_code: string | null
          id: string
          Images: string | null
          min_order_quantity: number | null
          name: string
          price: number
          search_vector: unknown | null
          sku: string | null
          sort_order: number | null
          status: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          tax_rate: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          currency?: string
          description?: string | null
          hsn_code?: string | null
          id?: string
          Images?: string | null
          min_order_quantity?: number | null
          name: string
          price: number
          search_vector?: unknown | null
          sku?: string | null
          sort_order?: number | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          brand_id?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          created_at?: string | null
          currency?: string
          description?: string | null
          hsn_code?: string | null
          id?: string
          Images?: string | null
          min_order_quantity?: number | null
          name?: string
          price?: number
          search_vector?: unknown | null
          sku?: string | null
          sort_order?: number | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "product_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_metrics: {
        Row: {
          average_order_value: number | null
          created_at: string
          id: string
          orders_count: number | null
          period_end: string | null
          period_start: string | null
          total_sales: number | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string
          id?: string
          orders_count?: number | null
          period_end?: string | null
          period_start?: string | null
          total_sales?: number | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string
          id?: string
          orders_count?: number | null
          period_end?: string | null
          period_start?: string | null
          total_sales?: number | null
        }
        Relationships: []
      }
      seller_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          document_url: string
          id: string
          seller_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_documents_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_onboarding: {
        Row: {
          address: string
          admin_notes: string | null
          business_type: string
          city: string
          company_description: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          country: string
          created_at: string
          id: string
          postal_code: string
          registration_number: string | null
          state: string
          status: string | null
          step: number | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          business_type: string
          city: string
          company_description?: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          country: string
          created_at?: string
          id?: string
          postal_code: string
          registration_number?: string | null
          state: string
          status?: string | null
          step?: number | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          business_type?: string
          city?: string
          company_description?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          id?: string
          postal_code?: string
          registration_number?: string | null
          state?: string
          status?: string | null
          step?: number | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      shopping_carts: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_carts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      make_user_super_admin: {
        Args: { user_email: string }
        Returns: string
      }
    }
    Enums: {
      account_category:
        | "accounts_receivable"
        | "accounts_payable"
        | "cash"
        | "bank"
        | "inventory"
        | "fixed_assets"
        | "current_assets"
        | "current_liabilities"
        | "long_term_liabilities"
        | "sales"
        | "cost_of_goods_sold"
        | "operating_expenses"
        | "other_income"
        | "other_expenses"
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      invoice_status: "draft" | "sent" | "paid" | "cancelled" | "overdue"
      product_category:
        | "starters_and_switches"
        | "motors_and_pumps"
        | "control_panel_accessories"
        | "low_voltage_switchgear"
        | "control_gear_and_signalling_devices"
        | "wires_and_cables"
        | "industrial_plugs_and_sockets"
        | "transformers"
        | "capacitors"
        | "lighting"
        | "earthing_equipment"
        | "measuring_instruments"
        | "conduits_and_accessories"
        | "hand_tools"
        | "fans"
        | "led_lights"
        | "relays"
        | "switches_and_sockets"
        | "industrial_fans"
        | "industrial_automation_vfd"
        | "testing_and_measuring_instruments"
        | "capacitors_and_reactors"
        | "admin_panel"
      reference_type: "invoice" | "payment" | "adjustment"
      transaction_type: "debit" | "credit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_category: [
        "accounts_receivable",
        "accounts_payable",
        "cash",
        "bank",
        "inventory",
        "fixed_assets",
        "current_assets",
        "current_liabilities",
        "long_term_liabilities",
        "sales",
        "cost_of_goods_sold",
        "operating_expenses",
        "other_income",
        "other_expenses",
      ],
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      invoice_status: ["draft", "sent", "paid", "cancelled", "overdue"],
      product_category: [
        "starters_and_switches",
        "motors_and_pumps",
        "control_panel_accessories",
        "low_voltage_switchgear",
        "control_gear_and_signalling_devices",
        "wires_and_cables",
        "industrial_plugs_and_sockets",
        "transformers",
        "capacitors",
        "lighting",
        "earthing_equipment",
        "measuring_instruments",
        "conduits_and_accessories",
        "hand_tools",
        "fans",
        "led_lights",
        "relays",
        "switches_and_sockets",
        "industrial_fans",
        "industrial_automation_vfd",
        "testing_and_measuring_instruments",
        "capacitors_and_reactors",
        "admin_panel",
      ],
      reference_type: ["invoice", "payment", "adjustment"],
      transaction_type: ["debit", "credit"],
    },
  },
} as const
