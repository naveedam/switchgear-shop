import { LucideIcon } from 'lucide-react';
import { 
  Zap, Cable, Ruler, Palette, Layers, Settings, Thermometer, Shield, 
  Wrench, Lightbulb, Activity, Gauge, Database, HardDrive, 
  Power, CircuitBoard, Fan, Battery, Clock
} from 'lucide-react';

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
        { name: 'nominal_cross_section', label: 'Nominal Cross Section', type: 'text', placeholder: 'e.g., 1.5 sq mm' },
        { name: 'conductor_shape', label: 'Conductor Shape', type: 'select', options: ['Round', 'Flat', 'Sector'] },
      ]
    },
    {
      title: 'Insulation & Sheath Properties',
      fields: [
        { name: 'insulation_material', label: 'Insulation Material', type: 'select', options: ['PVC', 'XLPE', 'EPR', 'Rubber'] },
        { name: 'insulation_color', label: 'Insulation Color', type: 'select', options: ['Red', 'Black', 'Blue', 'Green', 'Yellow', 'White'], icon: Palette },
        { name: 'sheath_material', label: 'Sheath Material', type: 'select', options: ['PVC', 'XLPE', 'PU', 'LSF'] },
        { name: 'sheath_color', label: 'Sheath Color', type: 'select', options: ['Black', 'Grey', 'White', 'Blue'] },
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
        { name: 'uv_resistant', label: 'UV Resistant', type: 'boolean' },
        { name: 'weather_resistant', label: 'Weather Resistant', type: 'boolean' },
        { name: 'standard_length_per_roll', label: 'Standard Length per Roll', type: 'text', placeholder: 'e.g., 100m', unit: 'm' },
        { name: 'current_carrying_capacity', label: 'Current Carrying Capacity', type: 'text', placeholder: 'e.g., 20A', unit: 'A' },
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
        { name: 'breaking_capacity_icu', label: 'Breaking Capacity (Icu)', type: 'text', placeholder: 'e.g., 10kA', unit: 'kA' },
        { name: 'breaking_capacity_ics', label: 'Breaking Capacity (Ics)', type: 'text', placeholder: 'e.g., 7.5kA', unit: 'kA' },
        { name: 'number_of_poles', label: 'Number of Poles', type: 'number' },
        { name: 'tripping_characteristic', label: 'Tripping Characteristic', type: 'select', options: ['B', 'C', 'D'] },
        { name: 'rated_frequency', label: 'Rated Frequency', type: 'text', placeholder: 'e.g., 50/60 Hz', unit: 'Hz' },
      ]
    },
    {
      title: 'Physical Properties',
      fields: [
        { name: 'mounting_type', label: 'Mounting Type', type: 'select', options: ['DIN Rail', 'Fixed', 'Plug-in', 'Withdrawable'] },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP20', 'IP40', 'IP54', 'IP65'], icon: Shield },
        { name: 'width_per_pole', label: 'Width per Pole', type: 'text', placeholder: 'e.g., 18mm', unit: 'mm' },
        { name: 'frame_size', label: 'Frame Size', type: 'text', placeholder: 'e.g., 100A' },
        { name: 'terminal_capacity', label: 'Terminal Capacity', type: 'text', placeholder: 'e.g., 35 sq mm' },
      ]
    },
    {
      title: 'Advanced Features',
      fields: [
        { name: 'adjustable_thermal_setting', label: 'Adjustable Thermal Setting', type: 'boolean' },
        { name: 'adjustable_magnetic_setting', label: 'Adjustable Magnetic Setting', type: 'boolean' },
        { name: 'thermal_setting_range', label: 'Thermal Setting Range', type: 'text', placeholder: 'e.g., 0.8-1.0' },
        { name: 'magnetic_setting_range', label: 'Magnetic Setting Range', type: 'text', placeholder: 'e.g., 5-10' },
      ]
    }
  ],

  'led-lights': [
    {
      title: 'Light Specifications',
      fields: [
        { name: 'luminous_flux', label: 'Luminous Flux', type: 'text', placeholder: 'e.g., 1000lm', unit: 'lm', icon: Lightbulb },
        { name: 'color_temperature', label: 'Color Temperature', type: 'text', placeholder: 'e.g., 4000K', unit: 'K' },
        { name: 'beam_angle', label: 'Beam Angle', type: 'text', placeholder: 'e.g., 120°', unit: '°' },
        { name: 'color_rendering_index', label: 'Color Rendering Index (CRI)', type: 'text', placeholder: 'e.g., 80+' },
        { name: 'dimming_capability', label: 'Dimmable', type: 'boolean' },
        { name: 'dimming_range', label: 'Dimming Range', type: 'text', placeholder: 'e.g., 1-100%', unit: '%' },
        { name: 'operating_life_hours', label: 'Operating Life', type: 'text', placeholder: 'e.g., 50000hrs', unit: 'hrs' },
      ]
    },
    {
      title: 'Driver & Control',
      fields: [
        { name: 'driver_type', label: 'Driver Type', type: 'select', options: ['Constant Current', 'Constant Voltage', 'DALI', 'PWM'] },
        { name: 'power_consumption', label: 'Power Consumption', type: 'text', placeholder: 'e.g., 20W', unit: 'W', icon: Power },
        { name: 'input_voltage_range', label: 'Input Voltage Range', type: 'text', placeholder: 'e.g., 85-265V AC' },
        { name: 'light_distribution_pattern', label: 'Light Distribution Pattern', type: 'select', options: ['Symmetric', 'Asymmetric', 'Batwing'] },
      ]
    }
  ],

  'motors-and-pumps': [
    {
      title: 'Motor Specifications',
      fields: [
        { name: 'power_rating', label: 'Power Rating', type: 'text', placeholder: 'e.g., 5HP', icon: Zap },
        { name: 'speed_rpm', label: 'Speed', type: 'text', placeholder: 'e.g., 1440 RPM', unit: 'RPM' },
        { name: 'efficiency_rating', label: 'Efficiency Rating', type: 'text', placeholder: 'e.g., IE3' },
        { name: 'frame_size', label: 'Frame Size', type: 'text', placeholder: 'e.g., 132M' },
        { name: 'bearing_type', label: 'Bearing Type', type: 'select', options: ['Ball Bearing', 'Roller Bearing', 'Sleeve Bearing'] },
        { name: 'cooling_type', label: 'Cooling Type', type: 'select', options: ['TEFC', 'TEAO', 'IC411', 'IC416'] },
        { name: 'insulation_class', label: 'Insulation Class', type: 'select', options: ['B', 'F', 'H'] },
      ]
    },
    {
      title: 'Performance Parameters',
      fields: [
        { name: 'starting_torque', label: 'Starting Torque', type: 'text', placeholder: 'e.g., 2.5 x Rated' },
        { name: 'maximum_torque', label: 'Maximum Torque', type: 'text', placeholder: 'e.g., 3.0 x Rated' },
        { name: 'service_factor', label: 'Service Factor', type: 'text', placeholder: 'e.g., 1.15' },
        { name: 'duty_cycle', label: 'Duty Cycle', type: 'select', options: ['S1', 'S2', 'S3', 'S6'] },
      ]
    }
  ],

  'test-measuring-instruments': [
    {
      title: 'Measurement Properties',
      fields: [
        { name: 'measurement_range', label: 'Measurement Range', type: 'text', placeholder: 'e.g., 0-1000V', icon: Gauge },
        { name: 'accuracy', label: 'Accuracy', type: 'text', placeholder: 'e.g., ±0.5%' },
        { name: 'resolution', label: 'Resolution', type: 'text', placeholder: 'e.g., 0.1V' },
        { name: 'display_type', label: 'Display Type', type: 'select', options: ['Digital', 'Analog', 'LCD', 'LED'] },
        { name: 'measurement_category', label: 'Measurement Category', type: 'select', options: ['CAT I', 'CAT II', 'CAT III', 'CAT IV'] },
        { name: 'sampling_rate', label: 'Sampling Rate', type: 'text', placeholder: 'e.g., 1000 samples/sec' },
      ]
    },
    {
      title: 'Power & Communication',
      fields: [
        { name: 'battery_type', label: 'Battery Type', type: 'select', options: ['Alkaline', 'Li-ion', 'NiMH'], icon: Battery },
        { name: 'battery_life', label: 'Battery Life', type: 'text', placeholder: 'e.g., 200 hours', unit: 'hrs' },
        { name: 'communication_interface', label: 'Communication Interface', type: 'select', options: ['USB', 'Bluetooth', 'WiFi', 'RS232', 'None'] },
        { name: 'data_logging_capacity', label: 'Data Logging Capacity', type: 'text', placeholder: 'e.g., 10000 readings' },
        { name: 'calibration_period', label: 'Calibration Period', type: 'text', placeholder: 'e.g., 12 months', icon: Clock },
        { name: 'auto_ranging', label: 'Auto Ranging', type: 'boolean' },
      ]
    }
  ],

  'transformers': [
    {
      title: 'Transformer Specifications',
      fields: [
        { name: 'power_rating', label: 'Power Rating', type: 'text', placeholder: 'e.g., 100 kVA', unit: 'kVA', icon: Power },
        { name: 'primary_voltage', label: 'Primary Voltage', type: 'text', placeholder: 'e.g., 11kV' },
        { name: 'secondary_voltage', label: 'Secondary Voltage', type: 'text', placeholder: 'e.g., 415V' },
        { name: 'frequency_range', label: 'Frequency', type: 'text', placeholder: 'e.g., 50/60 Hz', unit: 'Hz' },
        { name: 'vector_group', label: 'Vector Group', type: 'text', placeholder: 'e.g., Dyn11' },
        { name: 'impedance_percentage', label: 'Impedance', type: 'text', placeholder: 'e.g., 4%', unit: '%' },
      ]
    },
    {
      title: 'Construction & Materials',
      fields: [
        { name: 'core_material', label: 'Core Material', type: 'select', options: ['CRGO', 'Silicon Steel', 'Amorphous'] },
        { name: 'winding_material', label: 'Winding Material', type: 'select', options: ['Copper', 'Aluminum'] },
        { name: 'cooling_type', label: 'Cooling Type', type: 'select', options: ['ONAN', 'ONAF', 'OFAF', 'ODAF'] },
        { name: 'insulation_class', label: 'Insulation Class', type: 'select', options: ['A', 'E', 'B', 'F', 'H'] },
        { name: 'tap_configuration', label: 'Tap Configuration', type: 'text', placeholder: 'e.g., ±5% in 2.5% steps' },
      ]
    }
  ],

  'capacitors-and-power-factor-correction': [
    {
      title: 'Capacitor Specifications',
      fields: [
        { name: 'capacitance', label: 'Capacitance', type: 'text', placeholder: 'e.g., 25 kVAr', unit: 'kVAr' },
        { name: 'voltage_rating', label: 'Voltage Rating', type: 'text', placeholder: 'e.g., 415V', icon: Zap },
        { name: 'frequency_range', label: 'Frequency', type: 'text', placeholder: 'e.g., 50/60 Hz', unit: 'Hz' },
        { name: 'dielectric_type', label: 'Dielectric Type', type: 'select', options: ['Polypropylene', 'Paper', 'Ceramic'] },
        { name: 'temperature_category', label: 'Temperature Category', type: 'text', placeholder: 'e.g., -25/D' },
        { name: 'power_loss', label: 'Power Loss', type: 'text', placeholder: 'e.g., ≤0.3 W/kVAr', unit: 'W/kVAr' },
      ]
    },
    {
      title: 'Power Factor Correction',
      fields: [
        { name: 'harmonic_handling_capacity', label: 'Harmonic Handling', type: 'text', placeholder: 'e.g., 1.35 x In' },
        { name: 'detuning_factor', label: 'Detuning Factor', type: 'text', placeholder: 'e.g., 7%', unit: '%' },
        { name: 'reactor_inductance', label: 'Reactor Inductance', type: 'text', placeholder: 'e.g., 0.5 mH', unit: 'mH' },
        { name: 'discharge_resistor', label: 'Discharge Resistor', type: 'boolean' },
      ]
    }
  ],

  'earthing-and-lightning-protection': [
    {
      title: 'Earthing Specifications',
      fields: [
        { name: 'material_composition', label: 'Material Composition', type: 'select', options: ['Copper', 'Galvanized Steel', 'Stainless Steel'] },
        { name: 'conductor_size', label: 'Conductor Size', type: 'text', placeholder: 'e.g., 25 sq mm' },
        { name: 'earth_resistance', label: 'Earth Resistance', type: 'text', placeholder: 'e.g., <1 Ohm', unit: 'Ω' },
        { name: 'burial_depth', label: 'Burial Depth', type: 'text', placeholder: 'e.g., 2.5m', unit: 'm' },
        { name: 'soil_resistivity_range', label: 'Soil Resistivity Range', type: 'text', placeholder: 'e.g., 100-500 Ω-m' },
        { name: 'corrosion_resistance_rating', label: 'Corrosion Resistance', type: 'text', placeholder: 'e.g., 25 years' },
      ]
    },
    {
      title: 'Installation Properties',
      fields: [
        { name: 'connection_type', label: 'Connection Type', type: 'select', options: ['Welded', 'Bolted', 'Clamp'] },
        { name: 'coating_type', label: 'Coating Type', type: 'select', options: ['Hot Dip Galvanized', 'Copper Plated', 'None'] },
        { name: 'coating_thickness', label: 'Coating Thickness', type: 'text', placeholder: 'e.g., 85 microns', unit: 'μm' },
      ]
    }
  ],

  'conduits-and-accessories': [
    {
      title: 'Conduit Specifications',
      fields: [
        { name: 'conduit_material', label: 'Conduit Material', type: 'select', options: ['PVC', 'GI', 'MS', 'HDPE', 'Flexible'] },
        { name: 'conduit_type', label: 'Conduit Type', type: 'select', options: ['Rigid', 'Flexible', 'Corrugated'] },
        { name: 'inner_diameter', label: 'Inner Diameter', type: 'text', placeholder: 'e.g., 20mm', unit: 'mm', icon: Ruler },
        { name: 'outer_diameter', label: 'Outer Diameter', type: 'text', placeholder: 'e.g., 25mm', unit: 'mm' },
        { name: 'length', label: 'Standard Length', type: 'text', placeholder: 'e.g., 3m', unit: 'm' },
        { name: 'bend_radius', label: 'Minimum Bend Radius', type: 'text', placeholder: 'e.g., 6 x OD' },
      ]
    },
    {
      title: 'Performance Properties',
      fields: [
        { name: 'compression_strength', label: 'Compression Strength', type: 'text', placeholder: 'e.g., 1250N', unit: 'N' },
        { name: 'temperature_resistance', label: 'Temperature Range', type: 'text', placeholder: 'e.g., -5°C to +60°C' },
        { name: 'fire_resistance_rating', label: 'Fire Resistance', type: 'text', placeholder: 'e.g., FH-1' },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP54', 'IP65', 'IP67'], icon: Shield },
      ]
    }
  ],

  'hand-tools-and-equipment': [
    {
      title: 'Tool Specifications',
      fields: [
        { name: 'tool_type', label: 'Tool Type', type: 'select', options: ['Screwdriver', 'Pliers', 'Cutters', 'Strippers', 'Crimpers'], icon: Wrench },
        { name: 'handle_material', label: 'Handle Material', type: 'select', options: ['Plastic', 'Rubber', 'Fiber', 'Metal'] },
        { name: 'grip_type', label: 'Grip Type', type: 'select', options: ['Ergonomic', 'Anti-slip', 'Cushioned'] },
        { name: 'insulation_rating', label: 'Insulation Rating', type: 'text', placeholder: 'e.g., 1000V VDE' },
        { name: 'working_length', label: 'Working Length', type: 'text', placeholder: 'e.g., 150mm', unit: 'mm' },
      ]
    },
    {
      title: 'Construction & Finish',
      fields: [
        { name: 'head_type', label: 'Head Type', type: 'select', options: ['Phillips', 'Flathead', 'Torx', 'Hex'] },
        { name: 'finish_type', label: 'Finish', type: 'select', options: ['Chrome Plated', 'Black Oxide', 'Nickel Plated'] },
        { name: 'hardness_rating', label: 'Hardness Rating', type: 'text', placeholder: 'e.g., HRC 58-62' },
      ]
    }
  ],

  'fans-and-ventilation': [
    {
      title: 'Fan Specifications',
      fields: [
        { name: 'air_delivery', label: 'Air Delivery', type: 'text', placeholder: 'e.g., 1200 CMH', unit: 'CMH', icon: Fan },
        { name: 'power_consumption', label: 'Power Consumption', type: 'text', placeholder: 'e.g., 75W', unit: 'W', icon: Power },
        { name: 'speed_rpm', label: 'Speed', type: 'text', placeholder: 'e.g., 1400 RPM', unit: 'RPM' },
        { name: 'sweep_size', label: 'Sweep Size', type: 'text', placeholder: 'e.g., 1200mm', unit: 'mm' },
        { name: 'noise_level_fan', label: 'Noise Level', type: 'text', placeholder: 'e.g., <45 dB', unit: 'dB' },
        { name: 'air_flow_direction', label: 'Air Flow Direction', type: 'select', options: ['Exhaust', 'Fresh Air', 'Bidirectional'] },
      ]
    },
    {
      title: 'Construction & Control',
      fields: [
        { name: 'fan_mounting_type', label: 'Mounting Type', type: 'select', options: ['Wall Mount', 'Ceiling Mount', 'Duct Mount'] },
        { name: 'control_type', label: 'Control Type', type: 'select', options: ['Manual', 'Remote', 'Timer', 'Sensor'] },
        { name: 'bearing_type', label: 'Bearing Type', type: 'select', options: ['Ball Bearing', 'Sleeve Bearing', 'Maintenance Free'] },
      ]
    }
  ]
};

export const getCategoryFields = (categorySlug: string): CategoryFieldGroup[] => {
  console.log('getCategoryFields called with slug:', categorySlug);
  console.log('Available mappings:', Object.keys(categoryFieldMappings));
  
  const fields = categoryFieldMappings[categorySlug] || [];
  console.log('Found field groups:', fields.length);
  
  return fields;
};
