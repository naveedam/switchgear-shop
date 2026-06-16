// src/components/HomeCategories.tsx
// FIX: renders human-readable labels instead of raw product_category enum values

import { useNavigate } from "react-router-dom";

// ─── Label map ────────────────────────────────────────────────────────────────
// Extend this map whenever a new value is added to the product_category enum.
export const CATEGORY_LABELS: Record<string, string> = {
  starters_and_switches:            "Starters & Switches",
  low_voltage_switchgear:           "Low Voltage Switchgear",
  wires_and_cables:                 "Wires & Cables",
  capacitors_and_reactors:          "Capacitors & Reactors",
  control_gear_and_signalling_devices: "Control Gear & Signalling",
  circuit_breakers:                 "Circuit Breakers",
  busbars_and_enclosures:           "Busbars & Enclosures",
  meters_and_monitoring:            "Meters & Monitoring",
  surge_protection:                 "Surge Protection",
  transformers:                     "Transformers",
};

/** Returns a human-readable label for any product_category enum value.
 *  Falls back to title-casing the raw value so nothing ever renders ugly. */
export function categoryLabel(raw: string): string {
  return (
    CATEGORY_LABELS[raw] ??
    raw
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Category icon map (optional — add SVG/emoji per category) ────────────────
const CATEGORY_ICONS: Record<string, string> = {
  starters_and_switches:               "⚡",
  low_voltage_switchgear:              "🔌",
  wires_and_cables:                    "🔧",
  capacitors_and_reactors:             "🔋",
  control_gear_and_signalling_devices: "🎛️",
  circuit_breakers:                    "🛡️",
  busbars_and_enclosures:              "📦",
  meters_and_monitoring:               "📊",
  surge_protection:                    "⚡",
  transformers:                        "🔆",
};

interface Category {
  value: string;   // raw enum value from DB / API
  count?: number;
}

interface HomeCategoriesProps {
  categories: Category[];
  heading?: string;
}

export default function HomeCategories({
  categories,
  heading = "Shop by Category",
}: HomeCategoriesProps) {
  const navigate = useNavigate();

  if (!categories.length) return null;

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      {/* ── Heading ── */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map(({ value, count }) => (
          <button
            key={value}
            onClick={() =>
              navigate(`/products?category=${encodeURIComponent(value)}`)
            }
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-5
                       shadow-sm hover:shadow-md hover:border-blue-400 transition-all group"
          >
            <span className="text-3xl" aria-hidden>
              {CATEGORY_ICONS[value] ?? "📦"}
            </span>

            {/* ✅ FIX: use categoryLabel() — never renders raw enum */}
            <span className="text-sm font-semibold text-gray-800 text-center leading-tight group-hover:text-blue-600">
              {categoryLabel(value)}
            </span>

            {count !== undefined && (
              <span className="text-xs text-gray-400">{count} products</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
