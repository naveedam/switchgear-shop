export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          gst_registration_type: string | null
          gstin: string | null
          id: string
          is_vendor: boolean | null
          legal_name: string | null
          name: string
          pan_number: string | null
          phone: string | null
          role: string | null
          state_code: string | null
          status: string | null
          trade_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          gst_registration_type?: string | null
          gstin?: string | null
          id?: string
          is_vendor?: boolean | null
          legal_name?: string | null
          name: string
          pan_number?: string | null
          phone?: string | null
          role?: string | null
          state_code?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          gst_registration_type?: string | null
          gstin?: string | null
          id?: string
          is_vendor?: boolean | null
          legal_name?: string | null
          name?: string
          pan_number?: string | null
          phone?: string | null
          role?: string | null
          state_code?: string | null
          status?: string | null
          trade_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string | null
          description: string
          discount: number | null
          hsn_code: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_id: string
          product_id: string | null
          quantity: number
          sgst_amount: number | null
          sgst_rate: number | null
          taxable_value: number
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          description: string
          discount?: number | null
          hsn_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id: string
          product_id?: string | null
          quantity?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_value: number
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          description?: string
          discount?: number | null
          hsn_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_value?: number
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          created_at: string | null
          financial_year: string
          id: string
          last_number: number
          prefix: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          financial_year: string
          id?: string
          last_number?: number
          prefix?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          financial_year?: string
          id?: string
          last_number?: number
          prefix?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          buyer_address: Json | null
          buyer_gstin: string | null
          buyer_id: string
          buyer_name: string | null
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string | null
          due_date: string
          e_way_bill_date: string | null
          e_way_bill_no: string | null
          financial_year: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_number: string
          invoice_type: string | null
          irn: string | null
          irn_date: string | null
          notes: string | null
          order_id: string
          payment_terms: string | null
          place_of_supply: string | null
          qr_code_data: string | null
          reverse_charge: boolean | null
          seller_address: Json | null
          seller_gstin: string | null
          seller_id: string | null
          seller_name: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_amount: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_address?: Json | null
          buyer_gstin?: string | null
          buyer_id: string
          buyer_name?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          due_date: string
          e_way_bill_date?: string | null
          e_way_bill_no?: string | null
          financial_year?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number: string
          invoice_type?: string | null
          irn?: string | null
          irn_date?: string | null
          notes?: string | null
          order_id: string
          payment_terms?: string | null
          place_of_supply?: string | null
          qr_code_data?: string | null
          reverse_charge?: boolean | null
          seller_address?: Json | null
          seller_gstin?: string | null
          seller_id?: string | null
          seller_name?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_amount?: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_address?: Json | null
          buyer_gstin?: string | null
          buyer_id?: string
          buyer_name?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string | null
          due_date?: string
          e_way_bill_date?: string | null
          e_way_bill_no?: string | null
          financial_year?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number?: string
          invoice_type?: string | null
          irn?: string | null
          irn_date?: string | null
          notes?: string | null
          order_id?: string
          payment_terms?: string | null
          place_of_supply?: string | null
          qr_code_data?: string | null
          reverse_charge?: boolean | null
          seller_address?: Json | null
          seller_gstin?: string | null
          seller_id?: string | null
          seller_name?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
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
          {
            foreignKeyName: "invoices_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          seller_order_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          seller_order_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          seller_order_id?: string | null
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
          {
            foreignKeyName: "order_items_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_company_name: string | null
          buyer_email: string | null
          buyer_gstin: string | null
          buyer_id: string
          buyer_phone: string | null
          cart_id: string | null
          created_at: string | null
          fulfillment_status: string | null
          id: string
          is_multi_seller: boolean | null
          notes: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_status: string | null
          shipping_address: Json | null
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_company_name?: string | null
          buyer_email?: string | null
          buyer_gstin?: string | null
          buyer_id: string
          buyer_phone?: string | null
          cart_id?: string | null
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          is_multi_seller?: boolean | null
          notes?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_company_name?: string | null
          buyer_email?: string | null
          buyer_gstin?: string | null
          buyer_id?: string
          buyer_phone?: string | null
          cart_id?: string | null
          created_at?: string | null
          fulfillment_status?: string | null
          id?: string
          is_multi_seller?: boolean | null
          notes?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
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
          {
            foreignKeyName: "orders_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "shopping_carts"
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
          accuracy: string | null
          adjustable_magnetic_setting: boolean | null
          adjustable_thermal_setting: boolean | null
          air_delivery: string | null
          air_flow_direction: string | null
          armoured: boolean | null
          auto_ranging: boolean | null
          auxiliary_contact_type: string | null
          battery_life: string | null
          battery_type: string | null
          beam_angle: string | null
          bearing_type: string | null
          bend_radius: string | null
          bis_certification_number: string | null
          braking_method: string | null
          brand_id: string | null
          breaking_capacity: string | null
          breaking_capacity_ac23: string | null
          breaking_capacity_ics: string | null
          breaking_capacity_icu: string | null
          burial_depth: string | null
          busbar_material: string | null
          busbar_rating: string | null
          button_color: string | null
          button_type: string | null
          cable_entry_size: string | null
          cable_entry_type: string | null
          calibration_period: string | null
          capacitance: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          ce_marked: boolean | null
          changeover_type: string | null
          closing_time: string | null
          coating_thickness: string | null
          coating_type: string | null
          coil_voltage: string | null
          color_rendering_index: string | null
          color_temperature: string | null
          communication_interface: string | null
          communication_protocol: string | null
          compression_strength: string | null
          conductor_material: string | null
          conductor_resistance: string | null
          conductor_shape: string | null
          conductor_size: string | null
          conductor_type: string | null
          conduit_material: string | null
          conduit_type: string | null
          connection_type: string | null
          contact_configuration: string | null
          contact_material: string | null
          contact_plating: string | null
          contact_rating: string | null
          control_method: string | null
          control_type: string | null
          controller_type: string | null
          cooling_method: string | null
          cooling_type: string | null
          core_material: string | null
          core_type: string | null
          corrosion_resistance_rating: string | null
          created_at: string | null
          currency: string
          current_carrying_capacity: string | null
          data_logging_capacity: string | null
          description: string | null
          detuning_factor: string | null
          dielectric_type: string | null
          dimensions: string | null
          dimming_capability: boolean | null
          dimming_range: string | null
          discharge_resistor: boolean | null
          display_type: string | null
          door_type: string | null
          drawout_type: boolean | null
          driver_type: string | null
          earth_resistance: string | null
          efficiency_rating: string | null
          electrical_life_cycles: string | null
          energy_efficiency_rating: string | null
          fan_mounting_type: string | null
          finish_type: string | null
          fire_resistance_rating: string | null
          fire_retardant: boolean | null
          frame_size: string | null
          frequency_range: string | null
          grip_type: string | null
          halogen_free: boolean | null
          handle_material: string | null
          hardness_rating: string | null
          harmonic_handling_capacity: string | null
          head_type: string | null
          hsn_code: string | null
          id: string
          iec_standards_compliance: string[] | null
          illumination_color: string | null
          illumination_type: string | null
          Images: string | null
          impedance_percentage: string | null
          impulse_withstand_voltage: string | null
          incoming_terminal_size: string | null
          indicator_type: string | null
          ingress_protection: string | null
          inner_diameter: string | null
          input_voltage_range: string | null
          installation_type: string | null
          insulation_class: string | null
          insulation_color: string | null
          insulation_material: string | null
          insulation_rating: string | null
          interlocking_type: string | null
          ip_rating: string | null
          length: string | null
          light_distribution_pattern: string | null
          locking_mechanism: string | null
          luminous_flux: string | null
          magnetic_setting_range: string | null
          making_capacity: string | null
          manual_operation_override: boolean | null
          material_composition: string | null
          measurement_category: string | null
          measurement_range: string | null
          mechanical_life_cycles: string | null
          min_order_quantity: number | null
          model_number: string | null
          monitoring_parameters: string[] | null
          mounting_orientation: string | null
          mounting_type: string | null
          name: string
          neutral_pole_setting: string | null
          noise_level_db: string | null
          noise_level_fan: string | null
          nominal_cross_section: string | null
          number_of_blades: number | null
          number_of_cores: number | null
          number_of_poles: number | null
          number_of_rows: number | null
          number_of_ways: number | null
          opening_time: string | null
          operating_life_hours: string | null
          operating_temperature_range: string | null
          operation_time_motorized: string | null
          outer_diameter: string | null
          outgoing_terminal_size: string | null
          output_voltage_range: string | null
          overload_capacity: string | null
          pin_configuration: string | null
          pin_material: string | null
          pole_count: number | null
          positive_break_indication: boolean | null
          power_consumption: string | null
          power_loss: string | null
          power_range: string | null
          power_rating: string | null
          price: number
          primary_voltage: string | null
          programming_interface: string | null
          protection_features: string[] | null
          protection_release_type: string | null
          rated_current: string | null
          rated_frequency: string | null
          rated_insulation_voltage: string | null
          rated_voltage: string | null
          reactor_current: string | null
          reactor_inductance: string | null
          reactor_type: string | null
          residual_current_rating: string | null
          residual_current_type: string | null
          resolution: string | null
          rohs_compliant: boolean | null
          sampling_rate: string | null
          search_vector: unknown
          secondary_voltage: string | null
          selective_type: boolean | null
          series_name: string | null
          sheath_color: string | null
          sheath_material: string | null
          sheet_metal_thickness: string | null
          sku: string | null
          socket_material: string | null
          soil_resistivity_range: string | null
          sort_order: number | null
          sound_level: string | null
          source_position_indication: boolean | null
          speed_range: string | null
          speed_rpm: string | null
          spring_charging_time: string | null
          standard_length_per_roll: string | null
          status: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          surface_treatment: string | null
          sweep_size: string | null
          switching_time: string | null
          tap_configuration: string | null
          tax_rate: number | null
          temperature_category: string | null
          temperature_rating: string | null
          temperature_resistance: string | null
          temperature_rise: string | null
          terminal_capacity: string | null
          terminal_type: string | null
          thermal_setting_range: string | null
          time_current_characteristic: string | null
          tool_type: string | null
          transition_type: string | null
          tripping_characteristic: string | null
          updated_at: string | null
          utilization_category: string | null
          utilization_category_lb: string | null
          uv_resistant: boolean | null
          vector_group: string | null
          vendor_id: string
          vfd_communication_protocol: string | null
          vfd_display_type: string | null
          voltage_grade: string | null
          voltage_rating: string | null
          warranty_period: string | null
          weather_resistant: boolean | null
          width_per_pole: string | null
          winding_material: string | null
          working_length: string | null
        }
        Insert: {
          accuracy?: string | null
          adjustable_magnetic_setting?: boolean | null
          adjustable_thermal_setting?: boolean | null
          air_delivery?: string | null
          air_flow_direction?: string | null
          armoured?: boolean | null
          auto_ranging?: boolean | null
          auxiliary_contact_type?: string | null
          battery_life?: string | null
          battery_type?: string | null
          beam_angle?: string | null
          bearing_type?: string | null
          bend_radius?: string | null
          bis_certification_number?: string | null
          braking_method?: string | null
          brand_id?: string | null
          breaking_capacity?: string | null
          breaking_capacity_ac23?: string | null
          breaking_capacity_ics?: string | null
          breaking_capacity_icu?: string | null
          burial_depth?: string | null
          busbar_material?: string | null
          busbar_rating?: string | null
          button_color?: string | null
          button_type?: string | null
          cable_entry_size?: string | null
          cable_entry_type?: string | null
          calibration_period?: string | null
          capacitance?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          ce_marked?: boolean | null
          changeover_type?: string | null
          closing_time?: string | null
          coating_thickness?: string | null
          coating_type?: string | null
          coil_voltage?: string | null
          color_rendering_index?: string | null
          color_temperature?: string | null
          communication_interface?: string | null
          communication_protocol?: string | null
          compression_strength?: string | null
          conductor_material?: string | null
          conductor_resistance?: string | null
          conductor_shape?: string | null
          conductor_size?: string | null
          conductor_type?: string | null
          conduit_material?: string | null
          conduit_type?: string | null
          connection_type?: string | null
          contact_configuration?: string | null
          contact_material?: string | null
          contact_plating?: string | null
          contact_rating?: string | null
          control_method?: string | null
          control_type?: string | null
          controller_type?: string | null
          cooling_method?: string | null
          cooling_type?: string | null
          core_material?: string | null
          core_type?: string | null
          corrosion_resistance_rating?: string | null
          created_at?: string | null
          currency?: string
          current_carrying_capacity?: string | null
          data_logging_capacity?: string | null
          description?: string | null
          detuning_factor?: string | null
          dielectric_type?: string | null
          dimensions?: string | null
          dimming_capability?: boolean | null
          dimming_range?: string | null
          discharge_resistor?: boolean | null
          display_type?: string | null
          door_type?: string | null
          drawout_type?: boolean | null
          driver_type?: string | null
          earth_resistance?: string | null
          efficiency_rating?: string | null
          electrical_life_cycles?: string | null
          energy_efficiency_rating?: string | null
          fan_mounting_type?: string | null
          finish_type?: string | null
          fire_resistance_rating?: string | null
          fire_retardant?: boolean | null
          frame_size?: string | null
          frequency_range?: string | null
          grip_type?: string | null
          halogen_free?: boolean | null
          handle_material?: string | null
          hardness_rating?: string | null
          harmonic_handling_capacity?: string | null
          head_type?: string | null
          hsn_code?: string | null
          id?: string
          iec_standards_compliance?: string[] | null
          illumination_color?: string | null
          illumination_type?: string | null
          Images?: string | null
          impedance_percentage?: string | null
          impulse_withstand_voltage?: string | null
          incoming_terminal_size?: string | null
          indicator_type?: string | null
          ingress_protection?: string | null
          inner_diameter?: string | null
          input_voltage_range?: string | null
          installation_type?: string | null
          insulation_class?: string | null
          insulation_color?: string | null
          insulation_material?: string | null
          insulation_rating?: string | null
          interlocking_type?: string | null
          ip_rating?: string | null
          length?: string | null
          light_distribution_pattern?: string | null
          locking_mechanism?: string | null
          luminous_flux?: string | null
          magnetic_setting_range?: string | null
          making_capacity?: string | null
          manual_operation_override?: boolean | null
          material_composition?: string | null
          measurement_category?: string | null
          measurement_range?: string | null
          mechanical_life_cycles?: string | null
          min_order_quantity?: number | null
          model_number?: string | null
          monitoring_parameters?: string[] | null
          mounting_orientation?: string | null
          mounting_type?: string | null
          name: string
          neutral_pole_setting?: string | null
          noise_level_db?: string | null
          noise_level_fan?: string | null
          nominal_cross_section?: string | null
          number_of_blades?: number | null
          number_of_cores?: number | null
          number_of_poles?: number | null
          number_of_rows?: number | null
          number_of_ways?: number | null
          opening_time?: string | null
          operating_life_hours?: string | null
          operating_temperature_range?: string | null
          operation_time_motorized?: string | null
          outer_diameter?: string | null
          outgoing_terminal_size?: string | null
          output_voltage_range?: string | null
          overload_capacity?: string | null
          pin_configuration?: string | null
          pin_material?: string | null
          pole_count?: number | null
          positive_break_indication?: boolean | null
          power_consumption?: string | null
          power_loss?: string | null
          power_range?: string | null
          power_rating?: string | null
          price: number
          primary_voltage?: string | null
          programming_interface?: string | null
          protection_features?: string[] | null
          protection_release_type?: string | null
          rated_current?: string | null
          rated_frequency?: string | null
          rated_insulation_voltage?: string | null
          rated_voltage?: string | null
          reactor_current?: string | null
          reactor_inductance?: string | null
          reactor_type?: string | null
          residual_current_rating?: string | null
          residual_current_type?: string | null
          resolution?: string | null
          rohs_compliant?: boolean | null
          sampling_rate?: string | null
          search_vector?: unknown
          secondary_voltage?: string | null
          selective_type?: boolean | null
          series_name?: string | null
          sheath_color?: string | null
          sheath_material?: string | null
          sheet_metal_thickness?: string | null
          sku?: string | null
          socket_material?: string | null
          soil_resistivity_range?: string | null
          sort_order?: number | null
          sound_level?: string | null
          source_position_indication?: boolean | null
          speed_range?: string | null
          speed_rpm?: string | null
          spring_charging_time?: string | null
          standard_length_per_roll?: string | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          surface_treatment?: string | null
          sweep_size?: string | null
          switching_time?: string | null
          tap_configuration?: string | null
          tax_rate?: number | null
          temperature_category?: string | null
          temperature_rating?: string | null
          temperature_resistance?: string | null
          temperature_rise?: string | null
          terminal_capacity?: string | null
          terminal_type?: string | null
          thermal_setting_range?: string | null
          time_current_characteristic?: string | null
          tool_type?: string | null
          transition_type?: string | null
          tripping_characteristic?: string | null
          updated_at?: string | null
          utilization_category?: string | null
          utilization_category_lb?: string | null
          uv_resistant?: boolean | null
          vector_group?: string | null
          vendor_id: string
          vfd_communication_protocol?: string | null
          vfd_display_type?: string | null
          voltage_grade?: string | null
          voltage_rating?: string | null
          warranty_period?: string | null
          weather_resistant?: boolean | null
          width_per_pole?: string | null
          winding_material?: string | null
          working_length?: string | null
        }
        Update: {
          accuracy?: string | null
          adjustable_magnetic_setting?: boolean | null
          adjustable_thermal_setting?: boolean | null
          air_delivery?: string | null
          air_flow_direction?: string | null
          armoured?: boolean | null
          auto_ranging?: boolean | null
          auxiliary_contact_type?: string | null
          battery_life?: string | null
          battery_type?: string | null
          beam_angle?: string | null
          bearing_type?: string | null
          bend_radius?: string | null
          bis_certification_number?: string | null
          braking_method?: string | null
          brand_id?: string | null
          breaking_capacity?: string | null
          breaking_capacity_ac23?: string | null
          breaking_capacity_ics?: string | null
          breaking_capacity_icu?: string | null
          burial_depth?: string | null
          busbar_material?: string | null
          busbar_rating?: string | null
          button_color?: string | null
          button_type?: string | null
          cable_entry_size?: string | null
          cable_entry_type?: string | null
          calibration_period?: string | null
          capacitance?: string | null
          category?: Database["public"]["Enums"]["product_category"] | null
          ce_marked?: boolean | null
          changeover_type?: string | null
          closing_time?: string | null
          coating_thickness?: string | null
          coating_type?: string | null
          coil_voltage?: string | null
          color_rendering_index?: string | null
          color_temperature?: string | null
          communication_interface?: string | null
          communication_protocol?: string | null
          compression_strength?: string | null
          conductor_material?: string | null
          conductor_resistance?: string | null
          conductor_shape?: string | null
          conductor_size?: string | null
          conductor_type?: string | null
          conduit_material?: string | null
          conduit_type?: string | null
          connection_type?: string | null
          contact_configuration?: string | null
          contact_material?: string | null
          contact_plating?: string | null
          contact_rating?: string | null
          control_method?: string | null
          control_type?: string | null
          controller_type?: string | null
          cooling_method?: string | null
          cooling_type?: string | null
          core_material?: string | null
          core_type?: string | null
          corrosion_resistance_rating?: string | null
          created_at?: string | null
          currency?: string
          current_carrying_capacity?: string | null
          data_logging_capacity?: string | null
          description?: string | null
          detuning_factor?: string | null
          dielectric_type?: string | null
          dimensions?: string | null
          dimming_capability?: boolean | null
          dimming_range?: string | null
          discharge_resistor?: boolean | null
          display_type?: string | null
          door_type?: string | null
          drawout_type?: boolean | null
          driver_type?: string | null
          earth_resistance?: string | null
          efficiency_rating?: string | null
          electrical_life_cycles?: string | null
          energy_efficiency_rating?: string | null
          fan_mounting_type?: string | null
          finish_type?: string | null
          fire_resistance_rating?: string | null
          fire_retardant?: boolean | null
          frame_size?: string | null
          frequency_range?: string | null
          grip_type?: string | null
          halogen_free?: boolean | null
          handle_material?: string | null
          hardness_rating?: string | null
          harmonic_handling_capacity?: string | null
          head_type?: string | null
          hsn_code?: string | null
          id?: string
          iec_standards_compliance?: string[] | null
          illumination_color?: string | null
          illumination_type?: string | null
          Images?: string | null
          impedance_percentage?: string | null
          impulse_withstand_voltage?: string | null
          incoming_terminal_size?: string | null
          indicator_type?: string | null
          ingress_protection?: string | null
          inner_diameter?: string | null
          input_voltage_range?: string | null
          installation_type?: string | null
          insulation_class?: string | null
          insulation_color?: string | null
          insulation_material?: string | null
          insulation_rating?: string | null
          interlocking_type?: string | null
          ip_rating?: string | null
          length?: string | null
          light_distribution_pattern?: string | null
          locking_mechanism?: string | null
          luminous_flux?: string | null
          magnetic_setting_range?: string | null
          making_capacity?: string | null
          manual_operation_override?: boolean | null
          material_composition?: string | null
          measurement_category?: string | null
          measurement_range?: string | null
          mechanical_life_cycles?: string | null
          min_order_quantity?: number | null
          model_number?: string | null
          monitoring_parameters?: string[] | null
          mounting_orientation?: string | null
          mounting_type?: string | null
          name?: string
          neutral_pole_setting?: string | null
          noise_level_db?: string | null
          noise_level_fan?: string | null
          nominal_cross_section?: string | null
          number_of_blades?: number | null
          number_of_cores?: number | null
          number_of_poles?: number | null
          number_of_rows?: number | null
          number_of_ways?: number | null
          opening_time?: string | null
          operating_life_hours?: string | null
          operating_temperature_range?: string | null
          operation_time_motorized?: string | null
          outer_diameter?: string | null
          outgoing_terminal_size?: string | null
          output_voltage_range?: string | null
          overload_capacity?: string | null
          pin_configuration?: string | null
          pin_material?: string | null
          pole_count?: number | null
          positive_break_indication?: boolean | null
          power_consumption?: string | null
          power_loss?: string | null
          power_range?: string | null
          power_rating?: string | null
          price?: number
          primary_voltage?: string | null
          programming_interface?: string | null
          protection_features?: string[] | null
          protection_release_type?: string | null
          rated_current?: string | null
          rated_frequency?: string | null
          rated_insulation_voltage?: string | null
          rated_voltage?: string | null
          reactor_current?: string | null
          reactor_inductance?: string | null
          reactor_type?: string | null
          residual_current_rating?: string | null
          residual_current_type?: string | null
          resolution?: string | null
          rohs_compliant?: boolean | null
          sampling_rate?: string | null
          search_vector?: unknown
          secondary_voltage?: string | null
          selective_type?: boolean | null
          series_name?: string | null
          sheath_color?: string | null
          sheath_material?: string | null
          sheet_metal_thickness?: string | null
          sku?: string | null
          socket_material?: string | null
          soil_resistivity_range?: string | null
          sort_order?: number | null
          sound_level?: string | null
          source_position_indication?: boolean | null
          speed_range?: string | null
          speed_rpm?: string | null
          spring_charging_time?: string | null
          standard_length_per_roll?: string | null
          status?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          surface_treatment?: string | null
          sweep_size?: string | null
          switching_time?: string | null
          tap_configuration?: string | null
          tax_rate?: number | null
          temperature_category?: string | null
          temperature_rating?: string | null
          temperature_resistance?: string | null
          temperature_rise?: string | null
          terminal_capacity?: string | null
          terminal_type?: string | null
          thermal_setting_range?: string | null
          time_current_characteristic?: string | null
          tool_type?: string | null
          transition_type?: string | null
          tripping_characteristic?: string | null
          updated_at?: string | null
          utilization_category?: string | null
          utilization_category_lb?: string | null
          uv_resistant?: boolean | null
          vector_group?: string | null
          vendor_id?: string
          vfd_communication_protocol?: string | null
          vfd_display_type?: string | null
          voltage_grade?: string | null
          voltage_rating?: string | null
          warranty_period?: string | null
          weather_resistant?: boolean | null
          width_per_pole?: string | null
          winding_material?: string | null
          working_length?: string | null
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
      seller_brand_authorizations: {
        Row: {
          authorization_level: string
          brand_id: string
          certificate_number: string | null
          created_at: string
          id: string
          issued_date: string | null
          seller_id: string
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          authorization_level?: string
          brand_id: string
          certificate_number?: string | null
          created_at?: string
          id?: string
          issued_date?: string | null
          seller_id: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          authorization_level?: string
          brand_id?: string
          certificate_number?: string | null
          created_at?: string
          id?: string
          issued_date?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_brand_authorizations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_name: string | null
          document_type: Database["public"]["Enums"]["document_type_enum"]
          document_url: string
          expiry_date: string | null
          id: string
          issued_by: string | null
          seller_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_name?: string | null
          document_type: Database["public"]["Enums"]["document_type_enum"]
          document_url: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_name?: string | null
          document_type?: Database["public"]["Enums"]["document_type_enum"]
          document_url?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
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
          annual_turnover: string | null
          authorization_certificates: Json | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          business_type: string
          certifications: string[] | null
          city: string
          company_description: string | null
          company_name: string
          company_pan_number: string | null
          contact_email: string
          contact_phone: string
          country: string
          created_at: string
          gst_number: string | null
          id: string
          postal_code: string
          primary_product_categories: string[] | null
          registration_number: string | null
          state: string
          status: string | null
          step: number | null
          tax_id: string | null
          trade_license_number: string | null
          updated_at: string
          user_id: string | null
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          annual_turnover?: string | null
          authorization_certificates?: Json | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          business_type: string
          certifications?: string[] | null
          city: string
          company_description?: string | null
          company_name: string
          company_pan_number?: string | null
          contact_email: string
          contact_phone: string
          country: string
          created_at?: string
          gst_number?: string | null
          id?: string
          postal_code: string
          primary_product_categories?: string[] | null
          registration_number?: string | null
          state: string
          status?: string | null
          step?: number | null
          tax_id?: string | null
          trade_license_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          annual_turnover?: string | null
          authorization_certificates?: Json | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          business_type?: string
          certifications?: string[] | null
          city?: string
          company_description?: string | null
          company_name?: string
          company_pan_number?: string | null
          contact_email?: string
          contact_phone?: string
          country?: string
          created_at?: string
          gst_number?: string | null
          id?: string
          postal_code?: string
          primary_product_categories?: string[] | null
          registration_number?: string | null
          state?: string
          status?: string | null
          step?: number | null
          tax_id?: string | null
          trade_license_number?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      seller_order_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          new_status: string | null
          performed_by: string | null
          previous_status: string | null
          seller_order_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          seller_order_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          seller_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_order_audit_log_seller_order_id_fkey"
            columns: ["seller_order_id"]
            isOneToOne: false
            referencedRelation: "seller_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_orders: {
        Row: {
          carrier_name: string | null
          created_at: string | null
          delivered_at: string | null
          eway_bill_date: string | null
          eway_bill_number: string | null
          eway_bill_url: string | null
          id: string
          order_id: string
          rejection_reason: string | null
          seller_id: string
          seller_invoice_number: string | null
          seller_invoice_uploaded_at: string | null
          seller_invoice_url: string | null
          seller_notes: string | null
          shipped_at: string | null
          shipping_amount: number | null
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          eway_bill_date?: string | null
          eway_bill_number?: string | null
          eway_bill_url?: string | null
          id?: string
          order_id: string
          rejection_reason?: string | null
          seller_id: string
          seller_invoice_number?: string | null
          seller_invoice_uploaded_at?: string | null
          seller_invoice_url?: string | null
          seller_notes?: string | null
          shipped_at?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          eway_bill_date?: string | null
          eway_bill_number?: string | null
          eway_bill_url?: string | null
          id?: string
          order_id?: string
          rejection_reason?: string | null
          seller_id?: string
          seller_invoice_number?: string | null
          seller_invoice_uploaded_at?: string | null
          seller_invoice_url?: string | null
          seller_notes?: string | null
          shipped_at?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_products: {
        Row: {
          catalog_product_id: string
          created_at: string
          id: string
          price: number
          seller_id: string
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          catalog_product_id: string
          created_at?: string
          id?: string
          price: number
          seller_id: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          catalog_product_id?: string
          created_at?: string
          id?: string
          price?: number
          seller_id?: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_products_catalog_product_id_fkey"
            columns: ["catalog_product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
        ]
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
      get_current_financial_year: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_next_invoice_number: {
        Args: {
          p_financial_year: string
          p_prefix?: string
          p_seller_id: string
        }
        Returns: string
      }
      get_or_create_user_cart: { Args: { user_id: string }; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
      make_user_super_admin: { Args: { user_email: string }; Returns: string }
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
      document_type_enum:
        | "authorization_certificate"
        | "gst_certificate"
        | "pan_card"
        | "trade_license"
        | "bank_statement"
        | "incorporation_certificate"
        | "other"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
      document_type_enum: [
        "authorization_certificate",
        "gst_certificate",
        "pan_card",
        "trade_license",
        "bank_statement",
        "incorporation_certificate",
        "other",
      ],
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
