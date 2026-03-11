import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DuplicateItem {
  id: string;
  name: string;
  price: number;
}

interface DuplicateWarningProps {
  duplicates: DuplicateItem[];
  onContinue: () => void;
  onCancel: () => void;
}

const DuplicateWarning: React.FC<DuplicateWarningProps> = ({ duplicates, onContinue, onCancel }) => {
  if (duplicates.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-yellow-800">
            Similar products already in your inventory
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            You may already have this product listed. Review below before continuing.
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {duplicates.map(d => (
          <div key={d.id} className="flex justify-between items-center text-sm bg-white rounded px-3 py-2 border">
            <span className="truncate text-foreground">{d.name}</span>
            <span className="text-muted-foreground ml-2 shrink-0">₹{d.price.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Edit Existing Instead
        </Button>
        <Button size="sm" onClick={onContinue}>
          Continue Adding New
        </Button>
      </div>
    </div>
  );
};

export default DuplicateWarning;
