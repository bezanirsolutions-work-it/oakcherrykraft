export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          name: string | null;
          slug: string | null;
          category: string | null;
          description: string | null;
          material: string | null;
          finish: string | null;
          colour: string | null;
          dimensions: string | null;
          price: number | string | null;
          price_label: string | null;
          image_url: string | null;
          cover_image?: string | null;
          image_urls?: string[] | null;
          features?: string[] | null;
          specifications?: string[] | null;
          status: string | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          name?: string | null;
          slug?: string | null;
          category?: string | null;
          description?: string | null;
          material?: string | null;
          finish?: string | null;
          colour?: string | null;
          dimensions?: string | null;
          price?: number | string | null;
          price_label?: string | null;
          image_url?: string | null;
          cover_image?: string | null;
          image_urls?: string[] | null;
          features?: string[] | null;
          specifications?: string[] | null;
          status?: string | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          name?: string | null;
          slug?: string | null;
          category?: string | null;
          description?: string | null;
          material?: string | null;
          finish?: string | null;
          colour?: string | null;
          dimensions?: string | null;
          price?: number | string | null;
          price_label?: string | null;
          image_url?: string | null;
          cover_image?: string | null;
          image_urls?: string[] | null;
          features?: string[] | null;
          specifications?: string[] | null;
          status?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          title: string;
          slug: string;
          description: string;
          category: string;
          client_name: string | null;
          completion_date: string | null;
          status: string;
          location: string;
          budget_range: string | null;
          wood_species: string | null;
          cover_image: string | null;
          gallery_images: string[] | null;
          before_image: string | null;
          after_image: string | null;
          featured_project: boolean | null;
          project_of_the_month: boolean | null;
          show_in_gallery: boolean | null;
          sort_order: number | null;
          duration: string | null;
          finish: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string;
          slug?: string;
          description?: string;
          category?: string;
          client_name?: string | null;
          completion_date?: string | null;
          status?: string;
          location?: string;
          budget_range?: string | null;
          wood_species?: string | null;
          cover_image?: string | null;
          gallery_images?: string[] | null;
          before_image?: string | null;
          after_image?: string | null;
          featured_project?: boolean | null;
          project_of_the_month?: boolean | null;
          show_in_gallery?: boolean | null;
          sort_order?: number | null;
          duration?: string | null;
          finish?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          title?: string;
          slug?: string;
          description?: string;
          category?: string;
          client_name?: string | null;
          completion_date?: string | null;
          status?: string;
          location?: string;
          budget_range?: string | null;
          wood_species?: string | null;
          cover_image?: string | null;
          gallery_images?: string[] | null;
          before_image?: string | null;
          after_image?: string | null;
          featured_project?: boolean | null;
          project_of_the_month?: boolean | null;
          show_in_gallery?: boolean | null;
          sort_order?: number | null;
          duration?: string | null;
          finish?: string | null;
        };
        Relationships: [];
      };
      quote_requests: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          project_type: string | null;
          room_type: string | null;
          dimensions: string | null;
          budget: string | null;
          configuration: Json | null;
          notes: string | null;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          project_type?: string | null;
          room_type?: string | null;
          dimensions?: string | null;
          budget?: string | null;
          configuration?: Json | null;
          notes?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          project_type?: string | null;
          room_type?: string | null;
          dimensions?: string | null;
          budget?: string | null;
          configuration?: Json | null;
          notes?: string | null;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      live_chat_sessions: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          status: 'pending' | 'active' | 'resolved' | 'closed';
          visitor_name: string | null;
          visitor_email: string | null;
          visitor_phone: string | null;
          visitor_token: string;
          assigned_agent_id: string | null;
          last_activity_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          status?: 'pending' | 'active' | 'resolved' | 'closed';
          visitor_name?: string | null;
          visitor_email?: string | null;
          visitor_phone?: string | null;
          visitor_token: string;
          assigned_agent_id?: string | null;
          last_activity_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          status?: 'pending' | 'active' | 'resolved' | 'closed';
          visitor_name?: string | null;
          visitor_email?: string | null;
          visitor_phone?: string | null;
          visitor_token?: string;
          assigned_agent_id?: string | null;
          last_activity_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      live_chat_messages: {
        Row: {
          id: string;
          session_id: string;
          created_at: string | null;
          author: 'visitor' | 'assistant' | 'agent' | 'system';
          content: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          created_at?: string | null;
          author: 'visitor' | 'assistant' | 'agent' | 'system';
          content: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          created_at?: string | null;
          author?: 'visitor' | 'assistant' | 'agent' | 'system';
          content?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };

      configurator_selections: {
        Row: {
          id: string;
          quote_request_id: string | null;
          material: string | null;
          finish: string | null;
          colour: string | null;
          accessories: string[] | null;
          estimated_price: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          quote_request_id?: string | null;
          material?: string | null;
          finish?: string | null;
          colour?: string | null;
          accessories?: string[] | null;
          estimated_price?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          quote_request_id?: string | null;
          material?: string | null;
          finish?: string | null;
          colour?: string | null;
          accessories?: string[] | null;
          estimated_price?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          subject: string | null;
          message: string | null;
          status: 'new' | 'read' | 'replied' | 'closed';
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string | null;
          status?: 'new' | 'read' | 'replied' | 'closed';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          subject?: string | null;
          message?: string | null;
          status?: 'new' | 'read' | 'replied' | 'closed';
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          company: string | null;
          photo_url: string | null;
          rating: number | null;
          testimonial: string;
          featured: boolean | null;
          display_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          company?: string | null;
          photo_url?: string | null;
          rating?: number | null;
          testimonial: string;
          featured?: boolean | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string | null;
          company?: string | null;
          photo_url?: string | null;
          rating?: number | null;
          testimonial?: string;
          featured?: boolean | null;
          display_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: string | null;
        };
        Insert: {
          key: string;
          value?: string | null;
        };
        Update: {
          key?: string;
          value?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
