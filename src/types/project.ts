export interface Project {
  id: string;
  buyer_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'bom_generated' | 'rfq_created';
  rfq_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  file_url: string;
  file_type: string;
  filename: string;
  file_size?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'extracting' | 'extracted' | 'extraction_failed';
  raw_extracted_text?: string;
  uploaded_at: string;
}

export interface ProjectBomItem {
  id: string;
  project_id: string;
  component_type?: string;
  description: string;
  quantity: number;
  rated_current?: string;
  rated_voltage?: string;
  poles?: string;
  breaking_capacity?: string;
  power_rating?: string;
  brand?: string;
  model_number?: string;
  category_slug?: string;
  confidence_score: number;
  validation_status: 'complete' | 'missing_fields' | 'needs_review';
  source_document_id?: string;
  raw_text?: string;
  created_at: string;
  updated_at: string;
}
