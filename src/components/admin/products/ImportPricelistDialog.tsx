
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportFormValues {
  pricelist: FileList;
}

export const ImportPricelistDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const form = useForm<ImportFormValues>();

  const handleImport = async (data: ImportFormValues) => {
    const file = data.pricelist?.[0];
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a PDF file to import.',
        variant: 'destructive',
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    try {
      const filePath = `public/pricelist-${Date.now()}-${file.name.replace(/\s/g, '_')}`;

      // 1. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pricelists')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast({
        title: 'File Uploaded',
        description: 'Your pricelist is being processed in the background.',
      });

      // 2. Trigger the Edge Function to process the file
      const { error: functionError } = await supabase.functions.invoke('process-pricelist', {
        body: { filePath },
      });

      if (functionError) throw functionError;

      toast({
        title: 'Processing Started',
        description: `You will be notified upon completion.`,
      });

      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      console.error('Error importing pricelist:', JSON.stringify(error, null, 2));
      const description = error.message || 'An unexpected error occurred.';
      const details = error.error ? ` Details: ${error.error} (${error.statusCode})` : '';
      toast({
        title: 'Import Failed',
        description: description + details,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import from Pricelist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Products from Pricelist</DialogTitle>
          <DialogDescription>
            Upload a PDF pricelist to automatically add or update products. Make sure the PDF is text-based and follows a consistent format.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleImport)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="pricelist"
              rules={{ required: "A PDF file is required."}}
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <FormItem>
                  <FormLabel>Pricelist PDF</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onBlur={onBlur}
                      name={name}
                      ref={ref}
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          onChange(files);
                        }
                      }}
                      disabled={isImporting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import Products'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
