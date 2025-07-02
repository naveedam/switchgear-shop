
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CategoryField, CategoryFieldGroup } from '@/config/categoryFields';

interface CategoryFieldsProps {
  form: UseFormReturn<any>;
  fieldGroups: CategoryFieldGroup[];
}

export const CategoryFields: React.FC<CategoryFieldsProps> = ({ form, fieldGroups }) => {
  const renderField = (field: CategoryField) => {
    const Icon = field.icon;

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {field.label}
              {field.unit && <span className="text-sm text-gray-500">({field.unit})</span>}
            </FormLabel>
            <FormControl>
              {field.type === 'select' ? (
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formField.value || false}
                    onCheckedChange={formField.onChange}
                  />
                  <span className="text-sm text-gray-600">
                    {formField.value ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : field.type === 'number' ? (
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  {...formField}
                  onChange={(e) => formField.onChange(Number(e.target.value))}
                />
              ) : (
                <div className="relative">
                  {Icon && (
                    <Icon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  )}
                  <Input
                    placeholder={field.placeholder}
                    className={Icon ? 'pl-8' : ''}
                    {...formField}
                  />
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (fieldGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Category-Specific Fields</h3>
        {fieldGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h4 className="text-md font-medium mb-3 text-gray-700">{group.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(renderField)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
