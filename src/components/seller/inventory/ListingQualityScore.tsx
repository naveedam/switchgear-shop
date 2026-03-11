import React from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface QualityCheck {
  label: string;
  met: boolean;
}

interface ListingQualityScoreProps {
  checks: QualityCheck[];
}

const ListingQualityScore: React.FC<ListingQualityScoreProps> = ({ checks }) => {
  const score = Math.round((checks.filter(c => c.met).length / checks.length) * 100);
  
  const getColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Listing Quality</span>
        <span className={`text-sm font-bold ${getColor()}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            {check.met ? (
              <Check className="h-3 w-3 text-green-600 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListingQualityScore;
