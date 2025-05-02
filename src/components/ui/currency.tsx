
import React from "react";
import { IndianRupee } from "lucide-react";

interface CurrencyProps {
  value: number;
  className?: string;
  showSymbol?: boolean;
  showIcon?: boolean;
}

export const Currency = ({
  value,
  className,
  showSymbol = false,
  showIcon = true,
}: CurrencyProps) => {
  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: showSymbol ? "currency" : "decimal",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <IndianRupee className="h-3.5 w-3.5 mr-1 text-muted-foreground" />}
      <span>{formattedValue}</span>
    </div>
  );
};

export default Currency;
