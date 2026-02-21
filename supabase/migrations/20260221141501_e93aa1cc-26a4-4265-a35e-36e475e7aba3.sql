
-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  rfq_id UUID REFERENCES public.rfqs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = buyer_id);

-- Project documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  raw_extracted_text TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their project documents" ON public.project_documents
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_documents.project_id AND projects.buyer_id = auth.uid()));
CREATE POLICY "Buyers can create project documents" ON public.project_documents
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_documents.project_id AND projects.buyer_id = auth.uid()));
CREATE POLICY "Buyers can delete project documents" ON public.project_documents
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_documents.project_id AND projects.buyer_id = auth.uid()));

-- Project BOM items table
CREATE TABLE public.project_bom_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  component_type TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rated_current TEXT,
  rated_voltage TEXT,
  poles TEXT,
  breaking_capacity TEXT,
  power_rating TEXT,
  brand TEXT,
  model_number TEXT,
  category_slug TEXT,
  confidence_score NUMERIC DEFAULT 0,
  validation_status TEXT NOT NULL DEFAULT 'needs_review',
  source_document_id UUID REFERENCES public.project_documents(id),
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their project BOM items" ON public.project_bom_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_bom_items.project_id AND projects.buyer_id = auth.uid()));
CREATE POLICY "Buyers can create project BOM items" ON public.project_bom_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_bom_items.project_id AND projects.buyer_id = auth.uid()));
CREATE POLICY "Buyers can update their project BOM items" ON public.project_bom_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_bom_items.project_id AND projects.buyer_id = auth.uid()));
CREATE POLICY "Buyers can delete their project BOM items" ON public.project_bom_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_bom_items.project_id AND projects.buyer_id = auth.uid()));

-- Storage bucket for project documents
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false);

CREATE POLICY "Buyers can upload project documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Buyers can view their project documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Buyers can delete their project documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_bom_items_updated_at BEFORE UPDATE ON public.project_bom_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
