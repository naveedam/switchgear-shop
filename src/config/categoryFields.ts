
import { LucideIcon } from 'lucide-react';
import { Zap, Cable, Ruler, Palette, Layers, Settings, Thermometer, Shield } from 'lucide-react';

export interface CategoryField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required?: boolean;
  options?: string[];
  icon?: LucideIcon;
  placeholder?: string;
  unit?: string;
}

export interface CategoryFieldGroup {
  title: string;
  fields: CategoryField[];
}

export const categoryFieldMappings: Record<string, CategoryFieldGroup[]> = {
  'wires-cables': [
    {
      title: 'Conductor Properties',
      fields: [
        { name: 'conductor_material', label: 'Conductor Material', type: 'select', options: ['Copper', 'Aluminum', 'Silver'], icon: Cable },
        { name: 'conductor_type', label: 'Conductor Type', type: 'select', options: ['Solid', 'Stranded', 'Flexible'] },
        { name: 'conductor_size', label: 'Conductor Size', type: 'text', placeholder: 'e.g., 2.5 sq mm', icon: Ruler },
        { name: 'number_of_cores', label: 'Number of Cores', type: 'number', icon: Layers },
        { name: 'conductor_resistance', label: 'Conductor Resistance', type: 'text', placeholder: 'Ohm/km', unit: 'Ω/km' },
      ]
    },
    {
      title: 'Insulation Properties',
      fields: [
        { name: 'insulation_material', label: 'Insulation Material', type: 'select', options: ['PVC', 'XLPE', 'EPR', 'Rubber'] },
        { name: 'insulation_color', label: 'Insulation Color', type: 'select', options: ['Red', 'Black', 'Blue', 'Green', 'Yellow', 'White'], icon: Palette },
        { name: 'voltage_grade', label: 'Voltage Grade', type: 'text', placeholder: 'e.g., 1.1kV', icon: Zap },
        { name: 'temperature_rating', label: 'Temperature Rating', type: 'text', placeholder: 'e.g., 90°C', icon: Thermometer },
      ]
    },
    {
      title: 'Cable Properties',
      fields: [
        { name: 'armoured', label: 'Armoured', type: 'boolean' },
        { name: 'fire_retardant', label: 'Fire Retardant', type: 'boolean' },
        { name: 'halogen_free', label: 'Halogen Free', type: 'boolean' },
        { name: 'standard_length_per_roll', label: 'Standard Length per Roll', type: 'text', placeholder: 'e.g., 100m', unit: 'm' },
      ]
    }
  ],
  'low-voltage-switchgears': [
    {
      title: 'Electrical Specifications',
      fields: [
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: 'e.g., 415V', icon: Zap },
        { name: 'rated_current', label: 'Rated Current', type: 'text', placeholder: 'e.g., 63A', unit: 'A' },
        { name: 'breaking_capacity', label: 'Breaking Capacity', type: 'text', placeholder: 'e.g., 10kA', unit: 'kA' },
        { name: 'number_of_poles', label: 'Number of Poles', type: 'number' },
        { name: 'tripping_characteristic', label: 'Tripping Characteristic', type: 'select', options: ['B', 'C', 'D'] },
      ]
    },
    {
      title: 'Physical Properties',
      fields: [
        { name: 'mounting_type', label: 'Mounting Type', type: 'select', options: ['DIN Rail', 'Fixed', 'Plug-in', 'Withdrawable'] },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP20', 'IP40', 'IP54', 'IP65'], icon: Shield },
        { name: 'width_per_pole', label: 'Width per Pole', type: 'text', placeholder: 'e.g., 18mm', unit: 'mm' },
      ]
    }
  ],
  'lighting-solutions': [
    {
      title: 'Light Specifications',
      fields: [
        { name: 'luminous_flux', label: 'Luminous Flux', type: 'text', placeholder: 'e.g., 1000lm', unit: 'lm' },
        { name: 'color_temperature', label: 'Color Temperature', type: 'text', placeholder: 'e.g., 4000K', unit: 'K' },
        { name: 'beam_angle', label: 'Beam Angle', type: 'text', placeholder: 'e.g., 120°', unit: '°' },
        { name: 'dimming_capability', label: 'Dimmable', type: 'boolean' },
        { name: 'operating_life_hours', label: 'Operating Life', type: 'text', placeholder: 'e.g., 50000hrs', unit: 'hrs' },
      ]
    }
  ],
  'motors-drives': [
    {
      title: 'Motor Specifications',
      fields: [
        { name: 'power_rating', label: 'Power Rating', type: 'text', placeholder: 'e.g., 5HP', icon: Zap },
        { name: 'speed_rpm', label: 'Speed', type: 'text', placeholder: 'e.g., 1440 RPM', unit: 'RPM' },
        { name: 'efficiency_rating', label: 'Efficiency Rating', type: 'text', placeholder: 'e.g., IE3' },
        { name: 'frame_size', label: 'Frame Size', type: 'text', placeholder: 'e.g., 132M' },
      ]
    }
  ],
  'measurement-control': [
    {
      title: 'Measurement Properties',
      fields: [
        { name: 'measurement_range', label: 'Measurement Range', type: 'text', placeholder: 'e.g., 0-1000V' },
        { name: 'accuracy', label: 'Accuracy', type: 'text', placeholder: 'e.g., ±0.5%' },
        { name: 'display_type', label: 'Display Type', type: 'select', options: ['Digital', 'Analog', 'LCD', 'LED'] },
        { name: 'communication_protocol', label: 'Communication Protocol', type: 'select', options: ['Modbus', 'RS485', 'Ethernet', 'None'] },
      ]
    }
  ]
};

export const getCategoryFields = (categorySlug: string): CategoryFieldGroup[] => {
  return categoryFieldMappings[categorySlug] || [];
};
