
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

interface ImportFormValues {
  pricelist: FileList;
}

export const ImportPricelistDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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

    // This is a placeholder for the actual file processing logic,
    // which will be handled by a Supabase Edge Function.
    console.log('Importing file:', file.name);
    toast({
      title: 'Upload Started',
      description: `${file.name} is being processed. You will be notified upon completion.`,
    });
    
    // In a real implementation, we would start the upload to Supabase storage
    // and then trigger the edge function.
    
    setIsOpen(false);
    form.reset();
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Importing...' : 'Import Products'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
