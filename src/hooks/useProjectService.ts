import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectDocument, ProjectBomItem } from '@/types/project';
import { useToast } from '@/hooks/use-toast';

export const useProjectService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createProject = async (buyerId: string, name: string, description?: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ buyer_id: buyerId, name, description })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    return data as unknown as Project;
  };

  const getProjects = useCallback(async (buyerId: string): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []) as unknown as Project[];
  }, []);

  const getProject = useCallback(async (projectId: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) return null;
    return data as unknown as Project;
  }, []);

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<boolean> => {
    const { error } = await supabase
      .from('projects')
      .update(updates as any)
      .eq('id', projectId);
    return !error;
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  };

  // Documents
  const uploadDocument = async (
    projectId: string,
    buyerId: string,
    file: File
  ): Promise<ProjectDocument | null> => {
    setIsLoading(true);
    try {
      const filePath = `${buyerId}/${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          file_url: urlData.publicUrl,
          file_type: file.type || file.name.split('.').pop() || 'unknown',
          filename: file.name,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ProjectDocument;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast({ title: 'Upload Error', description: message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDocuments = useCallback(async (projectId: string): Promise<ProjectDocument[]> => {
    const { data } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });
    return (data || []) as unknown as ProjectDocument[];
  }, []);

  // BOM Items
  const getBomItems = useCallback(async (projectId: string): Promise<ProjectBomItem[]> => {
    const { data } = await supabase
      .from('project_bom_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    return (data || []) as unknown as ProjectBomItem[];
  }, []);

  const updateBomItem = async (itemId: string, updates: Partial<ProjectBomItem>): Promise<boolean> => {
    const { error } = await supabase
      .from('project_bom_items')
      .update(updates as any)
      .eq('id', itemId);
    return !error;
  };

  const deleteBomItem = async (itemId: string): Promise<boolean> => {
    const { error } = await supabase.from('project_bom_items').delete().eq('id', itemId);
    return !error;
  };

  const addBomItem = async (item: Partial<ProjectBomItem> & { project_id: string; description: string }): Promise<ProjectBomItem | null> => {
    const { data, error } = await supabase
      .from('project_bom_items')
      .insert({
        project_id: item.project_id,
        description: item.description,
        component_type: item.component_type || null,
        quantity: item.quantity || 1,
        rated_current: item.rated_current || null,
        rated_voltage: item.rated_voltage || null,
        poles: item.poles || null,
        breaking_capacity: item.breaking_capacity || null,
        power_rating: item.power_rating || null,
        brand: item.brand || null,
        model_number: item.model_number || null,
        category_slug: item.category_slug || null,
        confidence_score: 1.0,
        validation_status: 'complete',
      })
      .select()
      .single();

    if (error) return null;
    return data as unknown as ProjectBomItem;
  };

  // Extract text from PDF server-side
  const extractPdfText = async (
    documentId: string,
    projectId: string,
    fileUrl: string
  ): Promise<{ success: boolean; extractedText?: string; message?: string }> => {
    setIsLoading(true);
    try {
      await supabase.from('project_documents').update({
        processing_status: 'extracting',
      }).eq('id', documentId);

      const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
        body: { documentId, projectId, fileUrl },
      });

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF text extraction failed';
      toast({ title: 'Extraction Error', description: message, variant: 'destructive' });
      await supabase.from('project_documents').update({ processing_status: 'extraction_failed' }).eq('id', documentId);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // Parse document with AI
  const parseDocument = async (
    projectId: string,
    documentId: string,
    rawText: string
  ): Promise<{ success: boolean; items_found: number }> => {
    setIsLoading(true);
    try {
      // Update doc status
      await supabase.from('project_documents').update({
        processing_status: 'processing',
        raw_extracted_text: rawText,
      }).eq('id', documentId);

      const { data, error } = await supabase.functions.invoke('parse-bom-document', {
        body: { documentId, projectId, rawText },
      });

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Parsing failed';
      toast({ title: 'Parse Error', description: message, variant: 'destructive' });
      // Update doc status to failed
      await supabase.from('project_documents').update({ processing_status: 'failed' }).eq('id', documentId);
      return { success: false, items_found: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  // Convert BOM to RFQ
  const convertToRfq = async (
    projectId: string,
    buyerId: string,
    title: string,
    bomItems: ProjectBomItem[],
    notes?: string
  ): Promise<string | null> => {
    setIsLoading(true);
    try {
      // Generate RFQ number
      const { data: rfqNumber } = await supabase.rpc('generate_rfq_number');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create BOM upload for RFQ workflow compatibility
      const { data: bom, error: bomError } = await supabase
        .from('bom_uploads')
        .insert({
          buyer_id: buyerId,
          filename: `Project BOM - ${title}`,
          project_name: title,
          status: 'ready',
          total_items: bomItems.length,
        })
        .select()
        .single();

      if (bomError) throw bomError;

      // Create BOM items
      const bomItemsData = bomItems.map((item, idx) => ({
        bom_id: bom.id,
        line_number: idx + 1,
        description: `${item.component_type ? item.component_type + ' - ' : ''}${item.description}`,
        quantity: item.quantity,
        unit: 'Nos',
        preferred_brand: item.brand || null,
        rating_specs: [item.rated_current, item.rated_voltage, item.poles, item.breaking_capacity, item.power_rating]
          .filter(Boolean).join(', ') || null,
        match_status: 'unmatched',
      }));

      await supabase.from('bom_items').insert(bomItemsData);

      // Create RFQ
      const { data: rfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert({
          rfq_number: rfqNumber,
          buyer_id: buyerId,
          bom_id: bom.id,
          title,
          status: 'open',
          notes,
          expires_at: expiresAt.toISOString(),
          total_items: bomItems.length,
        })
        .select()
        .single();

      if (rfqError) throw rfqError;

      // Create RFQ items
      const rfqItems = bomItemsData.map((item, idx) => ({
        rfq_id: rfq.id,
        line_number: idx + 1,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        preferred_brand: item.preferred_brand,
        rating_specs: item.rating_specs,
      }));

      await supabase.from('rfq_items').insert(rfqItems);

      // Update BOM status
      await supabase.from('bom_uploads').update({ status: 'converted' }).eq('id', bom.id);

      // Update project
      await supabase.from('projects').update({ status: 'rfq_created', rfq_id: rfq.id }).eq('id', projectId);

      // Auto-route to relevant sellers
      let routingResult = { sellers_invited: 0, categories_detected: [] as string[] };
      try {
        const { data, error } = await supabase.functions.invoke('route-rfq-sellers', {
          body: { rfqId: rfq.id, projectId },
        });
        if (!error && data) {
          routingResult = {
            sellers_invited: data.sellers_invited || 0,
            categories_detected: data.categories_detected || [],
          };
        }
      } catch (routeErr) {
        console.error('Auto-routing failed:', routeErr);
        // Fallback: invite all active sellers (capped)
        const { data: sellers } = await supabase
          .from('companies')
          .select('id')
          .eq('is_vendor', true)
          .eq('status', 'active');

        if (sellers && sellers.length > 0) {
          const invitations = sellers.slice(0, 8).map(s => ({
            rfq_id: rfq.id,
            seller_id: s.id,
            status: 'pending' as const,
            routing_method: 'fallback',
          }));
          await supabase.from('rfq_seller_invitations').insert(invitations);
          routingResult.sellers_invited = invitations.length;
        }
      }

      // If no sellers were invited, set RFQ to admin_review
      if (routingResult.sellers_invited === 0) {
        await supabase.from('rfqs').update({ status: 'admin_review' }).eq('id', rfq.id);
      }

      // Audit log
      await supabase.from('rfq_audit_log').insert({
        rfq_id: rfq.id,
        bom_id: bom.id,
        action: 'rfq_created_from_project',
        actor_id: buyerId,
        actor_type: 'buyer',
        details: { projectId, title, ...routingResult },
      });

      toast({
        title: 'RFQ Created',
        description: `RFQ sent to ${routingResult.sellers_invited} verified sellers in ${routingResult.categories_detected.length || 'relevant'} categories.`,
      });
      return rfq.id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create RFQ';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    uploadDocument,
    getDocuments,
    getBomItems,
    updateBomItem,
    deleteBomItem,
    addBomItem,
    extractPdfText,
    parseDocument,
    convertToRfq,
  };
};
