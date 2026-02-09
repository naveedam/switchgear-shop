import { LucideIcon } from 'lucide-react';
import { 
  Zap, Cable, Ruler, Palette, Layers, Settings, Thermometer, Shield, 
  Wrench, Lightbulb, Activity, Gauge, Database, HardDrive, 
  Power, CircuitBoard, Fan, Battery, Clock, PlugZap
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

// ────────────────────────────────────────────────────────
// Shared field fragments reused across multiple categories
// ────────────────────────────────────────────────────────

const commonElectricalFields: CategoryField[] = [
  { name: 'rated_voltage', label: 'Rated Voltage (Ue)', type: 'text', placeholder: 'e.g., 415V AC', icon: Zap, required: true },
  { name: 'rated_current', label: 'Rated Current (In)', type: 'text', placeholder: 'e.g., 63A', unit: 'A', required: true },
  { name: 'rated_frequency', label: 'Rated Frequency', type: 'text', placeholder: 'e.g., 50 Hz', unit: 'Hz' },
  { name: 'number_of_poles', label: 'Number of Poles', type: 'number', required: true },
];

const commonPhysicalFields: CategoryField[] = [
  { name: 'mounting_type', label: 'Mounting Type', type: 'select', options: ['DIN Rail', 'Fixed', 'Plug-in', 'Withdrawable', 'Panel Mount', 'Flush Mount', 'Surface Mount'] },
  { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP20', 'IP40', 'IP42', 'IP54', 'IP55', 'IP65', 'IP66', 'IP67'], icon: Shield },
  { name: 'operating_temperature_range', label: 'Operating Temperature', type: 'text', placeholder: 'e.g., -25°C to +70°C', icon: Thermometer },
];

const commonComplianceFields: CategoryField[] = [
  { name: 'bis_certification_number', label: 'BIS Certification No.', type: 'text', placeholder: 'e.g., R-12345678' },
  { name: 'rohs_compliant', label: 'RoHS Compliant', type: 'boolean' },
  { name: 'ce_marked', label: 'CE Marked', type: 'boolean' },
];

// ────────────────────────────────────────────────────────
// Category → Field Group mappings
// Keys MUST match product_categories.slug from the database
// ────────────────────────────────────────────────────────

export const categoryFieldMappings: Record<string, CategoryFieldGroup[]> = {

  // ═══════════════════════════════════════════════════════
  // LOW VOLTAGE SWITCHGEARS
  // MCB, MCCB, ACB, RCCB, RCBO, Isolators, DB, ATS, etc.
  // IEC 60898, IEC 60947-2, IEC 61008/61009
  // ═══════════════════════════════════════════════════════
  'low-voltage-switchgears': [
    {
      title: 'Electrical Ratings (IEC 60947 / IS 60947)',
      fields: [
        ...commonElectricalFields,
        { name: 'rated_insulation_voltage', label: 'Rated Insulation Voltage (Ui)', type: 'text', placeholder: 'e.g., 500V', unit: 'V' },
        { name: 'impulse_withstand_voltage', label: 'Impulse Withstand Voltage (Uimp)', type: 'text', placeholder: 'e.g., 6kV', unit: 'kV' },
        { name: 'breaking_capacity', label: 'Breaking Capacity (Icn/Icu)', type: 'text', placeholder: 'e.g., 10kA', unit: 'kA', required: true },
        { name: 'breaking_capacity_icu', label: 'Ultimate Breaking Capacity (Icu)', type: 'text', placeholder: 'e.g., 50kA at 415V', unit: 'kA' },
        { name: 'breaking_capacity_ics', label: 'Service Breaking Capacity (Ics)', type: 'text', placeholder: 'e.g., 50% Icu', unit: 'kA' },
        { name: 'making_capacity', label: 'Making Capacity (Icm)', type: 'text', placeholder: 'e.g., 105kA peak' },
        { name: 'tripping_characteristic', label: 'Tripping Curve', type: 'select', options: ['B', 'C', 'D', 'K', 'Z'], required: true },
        { name: 'utilization_category', label: 'Utilization Category', type: 'select', options: ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-7a', 'AC-7b'] },
      ]
    },
    {
      title: 'Protection & Trip Settings',
      fields: [
        { name: 'protection_release_type', label: 'Protection Release Type', type: 'select', options: ['Thermal-Magnetic', 'Microprocessor', 'Electronic', 'Motor Protection'] },
        { name: 'adjustable_thermal_setting', label: 'Adjustable Thermal (Ir)', type: 'boolean' },
        { name: 'thermal_setting_range', label: 'Thermal Setting Range', type: 'text', placeholder: 'e.g., 0.7–1.0 × In' },
        { name: 'adjustable_magnetic_setting', label: 'Adjustable Magnetic (Im)', type: 'boolean' },
        { name: 'magnetic_setting_range', label: 'Magnetic Setting Range', type: 'text', placeholder: 'e.g., 5–10 × In' },
        { name: 'neutral_pole_setting', label: 'Neutral Pole Setting', type: 'select', options: ['50% of phase', '100% of phase', 'Solid neutral', 'Switched neutral'] },
        { name: 'residual_current_rating', label: 'Residual Current Rating (IΔn)', type: 'text', placeholder: 'e.g., 30mA', unit: 'mA' },
        { name: 'residual_current_type', label: 'Residual Current Type', type: 'select', options: ['Type AC', 'Type A', 'Type F', 'Type B'] },
      ]
    },
    {
      title: 'Mechanical & Physical',
      fields: [
        ...commonPhysicalFields,
        { name: 'frame_size', label: 'Frame Size', type: 'text', placeholder: 'e.g., 100A / 250AF' },
        { name: 'width_per_pole', label: 'Width per Pole', type: 'text', placeholder: 'e.g., 18mm', unit: 'mm' },
        { name: 'terminal_capacity', label: 'Terminal Capacity', type: 'text', placeholder: 'e.g., 35 sq mm', unit: 'sq mm' },
        { name: 'mechanical_life_cycles', label: 'Mechanical Endurance', type: 'text', placeholder: 'e.g., 20,000 cycles' },
        { name: 'electrical_life_cycles', label: 'Electrical Endurance', type: 'text', placeholder: 'e.g., 10,000 cycles' },
        { name: 'drawout_type', label: 'Drawout / Withdrawable', type: 'boolean' },
        { name: 'positive_break_indication', label: 'Positive Break Indication', type: 'boolean' },
      ]
    },
    {
      title: 'ACB-Specific (IEC 60947-2)',
      fields: [
        { name: 'closing_time', label: 'Closing Time', type: 'text', placeholder: 'e.g., 80ms', unit: 'ms' },
        { name: 'opening_time', label: 'Opening Time', type: 'text', placeholder: 'e.g., 40ms', unit: 'ms' },
        { name: 'spring_charging_time', label: 'Spring Charging Time', type: 'text', placeholder: 'e.g., 15s', unit: 's' },
        { name: 'communication_protocol', label: 'Communication', type: 'select', options: ['Modbus RTU', 'Modbus TCP', 'Profibus', 'Ethernet/IP', 'None'] },
      ]
    },
    {
      title: 'Distribution Board Specific',
      fields: [
        { name: 'number_of_ways', label: 'Number of Ways', type: 'number' },
        { name: 'number_of_rows', label: 'Number of Rows', type: 'number' },
        { name: 'busbar_rating', label: 'Busbar Rating', type: 'text', placeholder: 'e.g., 100A', unit: 'A' },
        { name: 'busbar_material', label: 'Busbar Material', type: 'select', options: ['Copper', 'Aluminium'] },
        { name: 'incoming_terminal_size', label: 'Incoming Terminal Size', type: 'text', placeholder: 'e.g., 70 sq mm' },
        { name: 'outgoing_terminal_size', label: 'Outgoing Terminal Size', type: 'text', placeholder: 'e.g., 25 sq mm' },
        { name: 'door_type', label: 'Door Type', type: 'select', options: ['Metal', 'Transparent', 'Flush', 'Surface'] },
        { name: 'enclosure_material', label: 'Enclosure Material', type: 'select', options: ['Sheet Steel', 'ABS Plastic', 'Polycarbonate', 'SMC/DMC'] },
      ]
    },
    {
      title: 'Standards & Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // CONTROLLING GEAR & SIGNALLING DEVICES
  // Contactors, Overload Relays, Motor Starters, Push Buttons
  // IEC 60947-4, IEC 60947-5
  // ═══════════════════════════════════════════════════════
  'controlling-gear-signalling-devices': [
    {
      title: 'Contactor Ratings (IEC 60947-4-1)',
      fields: [
        { name: 'rated_voltage', label: 'Rated Voltage (Ue)', type: 'text', placeholder: 'e.g., 415V AC', icon: Zap, required: true },
        { name: 'rated_current', label: 'Rated Current (Ie)', type: 'text', placeholder: 'e.g., 32A at AC-3', unit: 'A', required: true },
        { name: 'coil_voltage', label: 'Coil Voltage', type: 'text', placeholder: 'e.g., 220V AC / 24V DC', required: true },
        { name: 'utilization_category', label: 'Utilization Category', type: 'select', options: ['AC-1', 'AC-3', 'AC-4', 'AC-6a', 'AC-6b', 'AC-7a', 'AC-7b'] },
        { name: 'power_rating', label: 'Power Rating', type: 'text', placeholder: 'e.g., 15kW at AC-3', unit: 'kW' },
        { name: 'number_of_poles', label: 'Number of Main Poles', type: 'number', required: true },
        { name: 'rated_frequency', label: 'Rated Frequency', type: 'text', placeholder: '50/60 Hz', unit: 'Hz' },
      ]
    },
    {
      title: 'Contact Configuration',
      fields: [
        { name: 'contact_configuration', label: 'Main Contact Config', type: 'text', placeholder: 'e.g., 3NO' },
        { name: 'auxiliary_contact_type', label: 'Built-in Auxiliary Contacts', type: 'text', placeholder: 'e.g., 1NO + 1NC' },
        { name: 'contact_material', label: 'Contact Material', type: 'select', options: ['Silver Alloy', 'AgSnO2', 'AgCdO', 'Silver Nickel'] },
        { name: 'contact_rating', label: 'Auxiliary Contact Rating', type: 'text', placeholder: 'e.g., 10A at 240V AC' },
      ]
    },
    {
      title: 'Performance & Endurance',
      fields: [
        { name: 'mechanical_life_cycles', label: 'Mechanical Endurance', type: 'text', placeholder: 'e.g., 10 million operations' },
        { name: 'electrical_life_cycles', label: 'Electrical Endurance', type: 'text', placeholder: 'e.g., 2 million at AC-3' },
        { name: 'making_capacity', label: 'Making Capacity', type: 'text', placeholder: 'e.g., 250A peak' },
        { name: 'breaking_capacity_ac23', label: 'Breaking Capacity (AC-3)', type: 'text', placeholder: 'e.g., 10 × Ie' },
      ]
    },
    {
      title: 'Overload Relay (IEC 60947-4-1)',
      fields: [
        { name: 'overload_capacity', label: 'Overload Setting Range', type: 'text', placeholder: 'e.g., 23–32A' },
        { name: 'reset_type', label: 'Reset Type', type: 'select', options: ['Manual', 'Automatic', 'Manual/Automatic'] },
        { name: 'protection_features', label: 'Protection Features', type: 'text', placeholder: 'e.g., Phase loss, Phase imbalance' },
      ]
    },
    {
      title: 'Motor Starter Specific',
      fields: [
        { name: 'starter_type', label: 'Starter Type', type: 'select', options: ['DOL', 'Star-Delta', 'Soft Starter', 'Reversing', 'Auto-Transformer'] },
        { name: 'frame_size', label: 'Frame / Size', type: 'text', placeholder: 'e.g., Size 1 / Frame A' },
        { name: 'enclosure_type', label: 'Enclosure Type', type: 'select', options: ['Open', 'Enclosed IP54', 'Enclosed IP65', 'Panel Mount'] },
      ]
    },
    {
      title: 'Signalling Devices (IEC 60947-5-1)',
      fields: [
        { name: 'button_type', label: 'Button/Actuator Type', type: 'select', options: ['Flush', 'Extended', 'Mushroom Head', 'Key Operated', 'Illuminated', 'Selector', 'E-Stop'] },
        { name: 'button_color', label: 'Button Color', type: 'select', options: ['Red', 'Green', 'Yellow', 'Blue', 'White', 'Black'], icon: Palette },
        { name: 'illumination_type', label: 'Illumination Type', type: 'select', options: ['LED', 'Incandescent', 'Neon', 'None'] },
        { name: 'illumination_color', label: 'Illumination Color', type: 'select', options: ['Red', 'Green', 'Yellow', 'Blue', 'White', 'Amber'] },
        { name: 'indicator_type', label: 'Indicator Type', type: 'select', options: ['Pilot Light', 'Panel Indicator', 'Stack Light', 'Buzzer'] },
      ]
    },
    {
      title: 'Physical & Compliance',
      fields: [
        ...commonPhysicalFields,
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // RELAYS
  // Plug-in Relays, Timer Relays, Monitoring Relays
  // IEC 61810, IEC 60947-4-1
  // ═══════════════════════════════════════════════════════
  'relays': [
    {
      title: 'Relay Ratings',
      fields: [
        { name: 'relay_type', label: 'Relay Type', type: 'select', options: ['General Purpose', 'Timer', 'Monitoring', 'Safety', 'Latching', 'Solid State', 'Reed'], required: true },
        { name: 'coil_voltage', label: 'Coil Voltage', type: 'text', placeholder: 'e.g., 24V DC / 230V AC', required: true },
        { name: 'contact_configuration', label: 'Contact Configuration', type: 'select', options: ['SPDT', 'DPDT', '3PDT', '4PDT', 'SPST-NO', 'SPST-NC'], required: true },
        { name: 'contact_rating', label: 'Contact Rating', type: 'text', placeholder: 'e.g., 10A at 250V AC', required: true },
        { name: 'contact_material', label: 'Contact Material', type: 'select', options: ['AgNi', 'AgSnO2', 'AgCdO'] },
      ]
    },
    {
      title: 'Timer Relay Specifications',
      fields: [
        { name: 'timing_range', label: 'Timing Range', type: 'text', placeholder: 'e.g., 0.1s – 100h' },
        { name: 'control_type', label: 'Timer Function', type: 'select', options: ['On-Delay', 'Off-Delay', 'Star-Delta', 'Cyclic', 'Multifunction'] },
      ]
    },
    {
      title: 'Monitoring Relay Specifications',
      fields: [
        { name: 'monitoring_parameters', label: 'Monitoring Parameters', type: 'text', placeholder: 'e.g., Voltage, Phase, Current, Temperature' },
        { name: 'measurement_range', label: 'Measurement Range', type: 'text', placeholder: 'e.g., 160–690V AC' },
      ]
    },
    {
      title: 'Performance',
      fields: [
        { name: 'mechanical_life_cycles', label: 'Mechanical Endurance', type: 'text', placeholder: 'e.g., 20 million cycles' },
        { name: 'electrical_life_cycles', label: 'Electrical Endurance', type: 'text', placeholder: 'e.g., 100,000 cycles' },
        { name: 'operating_temperature_range', label: 'Operating Temperature', type: 'text', placeholder: '-20°C to +55°C', icon: Thermometer },
      ]
    },
    {
      title: 'Physical',
      fields: [
        { name: 'mounting_type', label: 'Mounting', type: 'select', options: ['DIN Rail Socket', 'PCB Mount', 'Panel Mount', 'Plug-in'] },
        { name: 'dimensions', label: 'Dimensions (W×H×D)', type: 'text', placeholder: 'e.g., 27×75×98 mm', unit: 'mm' },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // METERS
  // Energy Meters, Multifunction Meters, Panel Meters
  // IEC 62053, IEC 61557
  // ═══════════════════════════════════════════════════════
  'meters': [
    {
      title: 'Meter Specifications (IEC 62053)',
      fields: [
        { name: 'meter_type', label: 'Meter Type', type: 'select', options: ['Energy Meter', 'Multifunction Meter', 'Ammeter', 'Voltmeter', 'Power Factor Meter', 'Frequency Meter', 'Power Meter', 'kWh Meter'], required: true, icon: Gauge },
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: 'e.g., 415V L-L', icon: Zap, required: true },
        { name: 'rated_current', label: 'Rated Current / CT Input', type: 'text', placeholder: 'e.g., 5A CT / 63A Direct', required: true },
        { name: 'rated_frequency', label: 'Rated Frequency', type: 'text', placeholder: '50 Hz', unit: 'Hz' },
        { name: 'class_accuracy', label: 'Accuracy Class', type: 'select', options: ['Class 0.2S', 'Class 0.5S', 'Class 0.5', 'Class 1.0', 'Class 2.0'], required: true },
        { name: 'ct_ratio', label: 'CT Ratio', type: 'text', placeholder: 'e.g., ../5A or ../1A' },
      ]
    },
    {
      title: 'Measurement Parameters',
      fields: [
        { name: 'measurement_range', label: 'Measurement Range', type: 'text', placeholder: 'e.g., 0–500V, 0–6000A' },
        { name: 'monitoring_parameters', label: 'Parameters Measured', type: 'text', placeholder: 'e.g., V, A, kW, kVAr, kVA, PF, Hz, kWh' },
        { name: 'display_type', label: 'Display Type', type: 'select', options: ['LCD', 'LED', 'TFT Color', 'Analog', 'No Display'] },
        { name: 'resolution', label: 'Resolution', type: 'text', placeholder: 'e.g., 0.01 kWh' },
      ]
    },
    {
      title: 'Communication & Data',
      fields: [
        { name: 'communication_protocol', label: 'Communication Protocol', type: 'select', options: ['Modbus RTU', 'Modbus TCP', 'BACnet', 'DLMS/COSEM', 'M-Bus', 'Ethernet', 'None'] },
        { name: 'communication_interface', label: 'Physical Interface', type: 'select', options: ['RS-485', 'RS-232', 'Ethernet RJ45', 'Optical Port', 'Wireless', 'None'] },
        { name: 'data_logging_capacity', label: 'Data Logging', type: 'text', placeholder: 'e.g., 30-day load profile' },
      ]
    },
    {
      title: 'Physical & Mounting',
      fields: [
        { name: 'mounting_type', label: 'Mounting', type: 'select', options: ['DIN Rail', 'Panel Cutout 96×96', 'Panel Cutout 72×72', 'Panel Cutout 48×48'] },
        { name: 'supply_voltage', label: 'Auxiliary Supply', type: 'text', placeholder: 'e.g., 85–265V AC/DC' },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // CAPACITORS & REACTORS
  // Power Factor Correction, APFC Panels
  // IEC 60831, IEC 60076-6
  // ═══════════════════════════════════════════════════════
  'capacitors-reactors': [
    {
      title: 'Capacitor Ratings (IEC 60831)',
      fields: [
        { name: 'capacitance', label: 'Capacitor Rating', type: 'text', placeholder: 'e.g., 25 kVAr', unit: 'kVAr', required: true },
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: 'e.g., 440V', icon: Zap, required: true },
        { name: 'rated_frequency', label: 'Frequency', type: 'text', placeholder: '50 Hz', unit: 'Hz' },
        { name: 'number_of_poles', label: 'Number of Phases', type: 'number' },
        { name: 'dielectric_type', label: 'Dielectric Type', type: 'select', options: ['Polypropylene (MPP)', 'APP', 'Paper', 'Mixed'] },
        { name: 'temperature_category', label: 'Temperature Category', type: 'text', placeholder: 'e.g., -25/D (55°C)' },
        { name: 'power_loss', label: 'Power Loss', type: 'text', placeholder: 'e.g., ≤0.2 W/kVAr', unit: 'W/kVAr' },
        { name: 'discharge_resistor', label: 'Built-in Discharge Resistor', type: 'boolean' },
      ]
    },
    {
      title: 'Reactor Specifications (IEC 60076-6)',
      fields: [
        { name: 'reactor_type', label: 'Reactor Type', type: 'select', options: ['Detuned', 'Tuned', 'Line', 'Harmonic Filter'] },
        { name: 'reactor_inductance', label: 'Inductance', type: 'text', placeholder: 'e.g., 0.189 mH', unit: 'mH' },
        { name: 'reactor_current', label: 'Reactor Current', type: 'text', placeholder: 'e.g., 36A', unit: 'A' },
        { name: 'detuning_factor', label: 'Detuning Factor (p)', type: 'text', placeholder: 'e.g., 7% / 5.67% / 14%', unit: '%' },
        { name: 'harmonic_handling_capacity', label: 'Harmonic Current Handling', type: 'text', placeholder: 'e.g., 1.8 × In (THD 30%)' },
      ]
    },
    {
      title: 'Physical & Compliance',
      fields: [
        ...commonPhysicalFields,
        { name: 'connection_type', label: 'Connection Type', type: 'select', options: ['Stud Terminal', 'Wire Lead', 'Quick Connect'] },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // WIRES & CABLES
  // IS 694, IS 1554, IS 7098, IEC 60502
  // ═══════════════════════════════════════════════════════
  'wires-cables': [
    {
      title: 'Conductor Properties (IS 694 / IS 8130)',
      fields: [
        { name: 'conductor_material', label: 'Conductor Material', type: 'select', options: ['Electrolytic Copper', 'Aluminium', 'Tinned Copper'], icon: Cable, required: true },
        { name: 'conductor_type', label: 'Conductor Type', type: 'select', options: ['Solid (Class 1)', 'Stranded (Class 2)', 'Flexible (Class 5)', 'Extra Flexible (Class 6)'], required: true },
        { name: 'nominal_cross_section', label: 'Cross Section', type: 'text', placeholder: 'e.g., 2.5 sq mm', unit: 'sq mm', required: true },
        { name: 'number_of_cores', label: 'Number of Cores', type: 'number', icon: Layers, required: true },
        { name: 'conductor_resistance', label: 'DC Resistance at 20°C', type: 'text', placeholder: 'e.g., 7.41 Ω/km', unit: 'Ω/km' },
        { name: 'conductor_shape', label: 'Conductor Shape', type: 'select', options: ['Round', 'Flat', 'Sector Shaped'] },
        { name: 'current_carrying_capacity', label: 'Current Rating (In Air)', type: 'text', placeholder: 'e.g., 25A', unit: 'A', required: true },
      ]
    },
    {
      title: 'Insulation & Sheath (IS 1554 / IS 7098)',
      fields: [
        { name: 'insulation_material', label: 'Insulation Material', type: 'select', options: ['PVC (IS 1554)', 'XLPE (IS 7098)', 'EPR', 'LSZH', 'Rubber'], required: true },
        { name: 'insulation_color', label: 'Insulation Color', type: 'select', options: ['Red', 'Yellow', 'Blue', 'Black', 'Green', 'White', 'Grey', 'Brown'], icon: Palette },
        { name: 'sheath_material', label: 'Outer Sheath Material', type: 'select', options: ['PVC', 'PE', 'LSZH', 'Neoprene'] },
        { name: 'voltage_grade', label: 'Voltage Grade', type: 'select', options: ['450/750V', '600/1000V', '1.1kV', '1.9/3.3kV', '3.8/6.6kV', '6.35/11kV', '12.7/22kV'], icon: Zap, required: true },
        { name: 'temperature_rating', label: 'Max Conductor Temperature', type: 'text', placeholder: 'e.g., 70°C (PVC) / 90°C (XLPE)', icon: Thermometer },
      ]
    },
    {
      title: 'Cable Construction',
      fields: [
        { name: 'armoured', label: 'Armoured', type: 'boolean' },
        { name: 'fire_retardant', label: 'Fire Retardant (FR)', type: 'boolean' },
        { name: 'halogen_free', label: 'Low Smoke Zero Halogen (LSZH)', type: 'boolean' },
        { name: 'uv_resistant', label: 'UV Resistant', type: 'boolean' },
        { name: 'standard_length_per_roll', label: 'Standard Length', type: 'text', placeholder: 'e.g., 90m / 100m / 500m', unit: 'm' },
        { name: 'bend_radius', label: 'Min. Bend Radius', type: 'text', placeholder: 'e.g., 6 × OD' },
      ]
    },
    {
      title: 'Standards & Compliance',
      fields: [
        ...commonComplianceFields,
        { name: 'fire_resistance_rating', label: 'Fire Performance', type: 'select', options: ['FR', 'FRLS', 'FRLSH', 'Fire Survival (2 hrs)'] },
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // INDUSTRIAL AUTOMATION (VFD / Drives / PLC)
  // IEC 61800, IEC 61131
  // ═══════════════════════════════════════════════════════
  'industrial-automation': [
    {
      title: 'VFD / Drive Ratings (IEC 61800)',
      fields: [
        { name: 'power_range', label: 'Power Rating', type: 'text', placeholder: 'e.g., 0.37–500 kW', unit: 'kW', icon: Power, required: true },
        { name: 'supply_voltage', label: 'Supply Voltage', type: 'text', placeholder: 'e.g., 380–480V AC, 3-Phase', required: true },
        { name: 'output_current_range', label: 'Output Current Range', type: 'text', placeholder: 'e.g., 1.2–880A', unit: 'A', required: true },
        { name: 'output_voltage_range', label: 'Output Voltage', type: 'text', placeholder: 'e.g., 0–Input Voltage' },
        { name: 'frequency_range', label: 'Output Frequency Range', type: 'text', placeholder: 'e.g., 0–500 Hz', unit: 'Hz' },
        { name: 'rated_frequency', label: 'Input Frequency', type: 'text', placeholder: '50/60 Hz' },
        { name: 'overload_capacity', label: 'Overload Capacity', type: 'text', placeholder: 'e.g., 150% for 60s / 200% for 3s' },
      ]
    },
    {
      title: 'Control & Performance',
      fields: [
        { name: 'control_method', label: 'Control Method', type: 'select', options: ['V/f', 'Sensorless Vector', 'Closed-loop Vector', 'Direct Torque Control (DTC)', 'FOC'] },
        { name: 'braking_method', label: 'Braking', type: 'select', options: ['DC Injection', 'Dynamic (Resistor)', 'Regenerative', 'None'] },
        { name: 'torque_control', label: 'Torque Control', type: 'text', placeholder: 'e.g., ±5% at 0.5 Hz' },
        { name: 'speed_range', label: 'Speed Range', type: 'text', placeholder: 'e.g., 1:100 (open loop)' },
        { name: 'acceleration_time', label: 'Acceleration Time', type: 'text', placeholder: 'e.g., 0.1–3600s' },
      ]
    },
    {
      title: 'Communication & I/O',
      fields: [
        { name: 'communication_protocol', label: 'Fieldbus Protocol', type: 'select', options: ['Modbus RTU', 'Profibus DP', 'Profinet', 'EtherNet/IP', 'CANopen', 'BACnet', 'None'] },
        { name: 'communication_interface', label: 'Built-in Interfaces', type: 'text', placeholder: 'e.g., RS-485, Ethernet, USB' },
        { name: 'programming_interface', label: 'Programming Tool', type: 'text', placeholder: 'e.g., Keypad / PC Software / App' },
      ]
    },
    {
      title: 'Physical & Environmental',
      fields: [
        ...commonPhysicalFields,
        { name: 'cooling_type', label: 'Cooling', type: 'select', options: ['Forced Air', 'Natural Convection', 'Liquid Cooled'] },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // SWITCHES & SOCKETS
  // IS 3854, IS 1293, IEC 60669
  // ═══════════════════════════════════════════════════════
  'switches-sockets': [
    {
      title: 'Switch Specifications (IS 3854 / IEC 60669)',
      fields: [
        { name: 'switch_type', label: 'Switch Type', type: 'select', options: ['Modular Switch', 'MCB Type', 'Rotary', 'Piano', 'Toggle', 'Bell Push', 'Dimmer'], required: true },
        { name: 'rated_current', label: 'Rated Current', type: 'text', placeholder: 'e.g., 6A / 16A / 25A', unit: 'A', required: true },
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: 'e.g., 240V AC', icon: Zap, required: true },
        { name: 'gang_count', label: 'Number of Gangs', type: 'number' },
        { name: 'number_of_poles', label: 'Number of Poles', type: 'number' },
      ]
    },
    {
      title: 'Socket Specifications (IS 1293)',
      fields: [
        { name: 'socket_type', label: 'Socket Type', type: 'select', options: ['5A 3-Pin', '6A 3-Pin', '16A 3-Pin', 'Universal', 'USB Charger', 'Data (RJ45)', 'TV Coaxial', 'Telephone (RJ11)'] },
        { name: 'pin_configuration', label: 'Pin Configuration', type: 'text', placeholder: 'e.g., 2P+E' },
        { name: 'socket_material', label: 'Body Material', type: 'select', options: ['Polycarbonate', 'ABS', 'Urea', 'Glass Reinforced'] },
      ]
    },
    {
      title: 'Physical & Safety',
      fields: [
        { name: 'installation_type', label: 'Installation', type: 'select', options: ['Flush / Concealed', 'Surface Mount', 'Modular Plate'] },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP20', 'IP44', 'IP55', 'IP65'], icon: Shield },
        { name: 'contact_material', label: 'Contact Material', type: 'select', options: ['Silver Alloy', 'Brass', 'Phosphor Bronze'] },
        { name: 'mechanical_life_cycles', label: 'Mechanical Life', type: 'text', placeholder: 'e.g., 50,000 operations' },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // INDUSTRIAL PLUGS & SOCKETS
  // IEC 60309, IS 60309
  // ═══════════════════════════════════════════════════════
  'industrial-plugs-sockets': [
    {
      title: 'Ratings (IEC 60309-2)',
      fields: [
        { name: 'plug_type', label: 'Product Type', type: 'select', options: ['Industrial Plug', 'Industrial Socket', 'Panel Mounted Socket', 'Connector', 'Coupler', 'Combination Box'], required: true, icon: PlugZap },
        { name: 'rated_current', label: 'Rated Current', type: 'select', options: ['16A', '32A', '63A', '125A'], required: true },
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: 'e.g., 200–250V / 380–415V', icon: Zap, required: true },
        { name: 'number_of_poles', label: 'Poles (P+E)', type: 'select', options: ['2P+E (3-pin)', '3P+E (4-pin)', '3P+N+E (5-pin)'], required: true },
        { name: 'hours_position', label: 'Hours Position', type: 'select', options: ['6h (200–250V)', '9h (380–415V)', '4h (100–130V)', '3h (>50V DC)'], required: true },
        { name: 'rated_frequency', label: 'Frequency', type: 'text', placeholder: '50/60 Hz', unit: 'Hz' },
      ]
    },
    {
      title: 'Construction & Protection',
      fields: [
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP44', 'IP67'], icon: Shield, required: true },
        { name: 'enclosure_material', label: 'Body Material', type: 'select', options: ['PA6 (Nylon)', 'Polycarbonate', 'ABS', 'Die-cast Metal'] },
        { name: 'contact_material', label: 'Contact Material', type: 'select', options: ['Brass (Nickel Plated)', 'Phosphor Bronze'] },
        { name: 'cable_entry_type', label: 'Cable Entry', type: 'select', options: ['Compression Gland', 'Screw Terminal', 'Quick Connect'] },
        { name: 'cable_entry_size', label: 'Cable Entry Size', type: 'text', placeholder: 'e.g., M25 / M32' },
        { name: 'interlocking_type', label: 'Interlocking', type: 'select', options: ['Without', 'Mechanical', 'Electrical', 'Mechanical + Electrical'] },
        { name: 'locking_mechanism', label: 'Locking Mechanism', type: 'select', options: ['Screw Ring', 'Bayonet', 'Quick Lock'] },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // LED LIGHTS
  // IS 16102, IEC 62722, IEC 62717
  // ═══════════════════════════════════════════════════════
  'led-lights': [
    {
      title: 'Light Output (IEC 62722 / IS 16102)',
      fields: [
        { name: 'power_rating', label: 'Wattage', type: 'text', placeholder: 'e.g., 20W', unit: 'W', icon: Power, required: true },
        { name: 'luminous_flux', label: 'Luminous Flux', type: 'text', placeholder: 'e.g., 2000 lm', unit: 'lm', icon: Lightbulb, required: true },
        { name: 'color_temperature', label: 'CCT', type: 'select', options: ['2700K (Warm White)', '3000K (Warm White)', '4000K (Neutral White)', '5000K (Cool White)', '6500K (Daylight)'], required: true },
        { name: 'color_rendering_index', label: 'CRI (Ra)', type: 'text', placeholder: 'e.g., >80 / >90' },
        { name: 'beam_angle', label: 'Beam Angle', type: 'text', placeholder: 'e.g., 120°', unit: '°' },
        { name: 'light_distribution_pattern', label: 'Distribution', type: 'select', options: ['Symmetric', 'Asymmetric', 'Batwing', 'Narrow Spot', 'Wide Flood'] },
      ]
    },
    {
      title: 'Electrical & Driver',
      fields: [
        { name: 'input_voltage_range', label: 'Input Voltage', type: 'text', placeholder: 'e.g., 100–277V AC', required: true },
        { name: 'driver_type', label: 'Driver Type', type: 'select', options: ['Constant Current', 'Constant Voltage', 'Integrated', 'External'] },
        { name: 'dimming_capability', label: 'Dimmable', type: 'boolean' },
        { name: 'dimming_range', label: 'Dimming Protocol', type: 'select', options: ['DALI', 'DALI-2', '0-10V', 'PWM', 'Triac', 'None'] },
        { name: 'power_consumption', label: 'Total System Power', type: 'text', placeholder: 'e.g., 22W (including driver)', unit: 'W' },
        { name: 'energy_efficiency_rating', label: 'Efficacy', type: 'text', placeholder: 'e.g., 100 lm/W', unit: 'lm/W' },
      ]
    },
    {
      title: 'Lifetime & Construction',
      fields: [
        { name: 'operating_life_hours', label: 'Rated Life (L70)', type: 'text', placeholder: 'e.g., 50,000 hrs', unit: 'hrs' },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP20', 'IP40', 'IP44', 'IP54', 'IP65', 'IP66', 'IP67'], icon: Shield },
        { name: 'mounting_type', label: 'Mounting', type: 'select', options: ['Recessed', 'Surface', 'Suspended', 'Pole/Arm Mount', 'Track Mount'] },
        { name: 'operating_temperature_range', label: 'Operating Temp', type: 'text', placeholder: '-20°C to +50°C', icon: Thermometer },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // FANS (Domestic / Commercial)
  // IS 374, IEC 60879
  // ═══════════════════════════════════════════════════════
  'fans': [
    {
      title: 'Fan Performance (IS 374)',
      fields: [
        { name: 'air_delivery', label: 'Air Delivery', type: 'text', placeholder: 'e.g., 230 CMM / 13,800 CMH', unit: 'CMM', icon: Fan, required: true },
        { name: 'sweep_size', label: 'Sweep / Size', type: 'text', placeholder: 'e.g., 1200mm / 1400mm', unit: 'mm', required: true },
        { name: 'speed_rpm', label: 'Speed', type: 'text', placeholder: 'e.g., 350 RPM', unit: 'RPM' },
        { name: 'power_consumption', label: 'Power Consumption', type: 'text', placeholder: 'e.g., 75W', unit: 'W', icon: Power, required: true },
        { name: 'noise_level_fan', label: 'Noise Level', type: 'text', placeholder: 'e.g., <55 dB(A)', unit: 'dB(A)' },
        { name: 'number_of_blades', label: 'Number of Blades', type: 'number' },
        { name: 'energy_efficiency_rating', label: 'BEE Star Rating', type: 'select', options: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'] },
      ]
    },
    {
      title: 'Construction & Control',
      fields: [
        { name: 'fan_mounting_type', label: 'Mounting', type: 'select', options: ['Ceiling', 'Wall', 'Pedestal', 'Table', 'Exhaust'], required: true },
        { name: 'control_type', label: 'Speed Control', type: 'select', options: ['Regulator', 'Remote', 'IoT/App', 'Pull Chain'] },
        { name: 'bearing_type', label: 'Bearing Type', type: 'select', options: ['Double Ball Bearing', 'Sleeve Bearing', 'Sealed Bearing'] },
        { name: 'rated_voltage', label: 'Rated Voltage', type: 'text', placeholder: '220–240V AC', icon: Zap },
        { name: 'rated_frequency', label: 'Frequency', type: 'text', placeholder: '50 Hz', unit: 'Hz' },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // INDUSTRIAL FANS
  // Heavy-duty exhaust, ventilation, cooling fans
  // ═══════════════════════════════════════════════════════
  'industrial-fans': [
    {
      title: 'Performance Specifications',
      fields: [
        { name: 'air_delivery', label: 'Air Volume Flow', type: 'text', placeholder: 'e.g., 5000 CMH', unit: 'CMH', icon: Fan, required: true },
        { name: 'power_rating', label: 'Motor Power', type: 'text', placeholder: 'e.g., 0.75 kW', unit: 'kW', icon: Power, required: true },
        { name: 'speed_rpm', label: 'Speed', type: 'text', placeholder: 'e.g., 1400 RPM', unit: 'RPM' },
        { name: 'sweep_size', label: 'Fan Diameter', type: 'text', placeholder: 'e.g., 600mm / 900mm', unit: 'mm', required: true },
        { name: 'noise_level_fan', label: 'Sound Level', type: 'text', placeholder: 'e.g., 65 dB(A) at 3m', unit: 'dB(A)' },
        { name: 'air_flow_direction', label: 'Air Flow', type: 'select', options: ['Exhaust', 'Supply / Fresh Air', 'Bidirectional / Reversible'] },
        { name: 'number_of_blades', label: 'Number of Blades', type: 'number' },
      ]
    },
    {
      title: 'Electrical & Construction',
      fields: [
        { name: 'rated_voltage', label: 'Supply Voltage', type: 'text', placeholder: 'e.g., 415V 3-Phase', icon: Zap, required: true },
        { name: 'rated_frequency', label: 'Frequency', type: 'text', placeholder: '50 Hz', unit: 'Hz' },
        { name: 'fan_mounting_type', label: 'Mounting', type: 'select', options: ['Wall Mount', 'Roof/Turbo Vent', 'Duct Inline', 'Pedestal', 'Man Cooler'] },
        { name: 'bearing_type', label: 'Bearing Type', type: 'select', options: ['Ball Bearing', 'Roller Bearing', 'Self-aligning'] },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP44', 'IP54', 'IP55', 'IP65'], icon: Shield },
        { name: 'insulation_class', label: 'Motor Insulation', type: 'select', options: ['Class B', 'Class F', 'Class H'] },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // TEST & MEASURING INSTRUMENTS
  // IEC 61010, IEC 61557, CAT ratings
  // ═══════════════════════════════════════════════════════
  'test-measuring-instruments': [
    {
      title: 'Measurement Specifications (IEC 61010)',
      fields: [
        { name: 'measurement_range', label: 'Measurement Range', type: 'text', placeholder: 'e.g., 0–1000V AC/DC', icon: Gauge, required: true },
        { name: 'accuracy', label: 'Accuracy', type: 'text', placeholder: 'e.g., ±(0.5% + 3 digits)', required: true },
        { name: 'resolution', label: 'Resolution', type: 'text', placeholder: 'e.g., 0.001V' },
        { name: 'measurement_category', label: 'Measurement Category', type: 'select', options: ['CAT I', 'CAT II', 'CAT III 600V', 'CAT III 1000V', 'CAT IV 600V'], required: true },
        { name: 'sampling_rate', label: 'Sampling Rate', type: 'text', placeholder: 'e.g., 2 samples/sec' },
        { name: 'display_type', label: 'Display Type', type: 'select', options: ['Digital LCD', 'True RMS Digital', 'Analog', 'TFT Color', 'Backlit LCD'] },
        { name: 'auto_ranging', label: 'Auto Ranging', type: 'boolean' },
      ]
    },
    {
      title: 'Power & Communication',
      fields: [
        { name: 'battery_type', label: 'Battery Type', type: 'select', options: ['9V Alkaline', 'AA Alkaline', 'Li-ion Rechargeable', 'AAA'], icon: Battery },
        { name: 'battery_life', label: 'Battery Life', type: 'text', placeholder: 'e.g., 200 hrs', unit: 'hrs' },
        { name: 'communication_interface', label: 'Data Interface', type: 'select', options: ['USB', 'Bluetooth', 'WiFi', 'RS-232', 'Optical', 'None'] },
        { name: 'data_logging_capacity', label: 'Data Logging', type: 'text', placeholder: 'e.g., 10,000 readings' },
        { name: 'calibration_period', label: 'Calibration Interval', type: 'text', placeholder: 'e.g., 12 months', icon: Clock },
      ]
    },
    {
      title: 'Safety & Compliance',
      fields: [
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP40', 'IP54', 'IP65', 'IP67'], icon: Shield },
        ...commonComplianceFields,
      ]
    }
  ],

  // ═══════════════════════════════════════════════════════
  // HAND TOOLS
  // IEC 60900 (Insulated Tools), IS 6032
  // ═══════════════════════════════════════════════════════
  'hand-tools': [
    {
      title: 'Tool Specifications (IEC 60900)',
      fields: [
        { name: 'tool_type', label: 'Tool Type', type: 'select', options: ['Screwdriver', 'Pliers', 'Wire Cutter', 'Wire Stripper', 'Crimping Tool', 'Cable Cutter', 'Torque Wrench', 'Hex Key Set', 'Knife'], icon: Wrench, required: true },
        { name: 'insulation_rating', label: 'VDE Insulation Rating', type: 'select', options: ['1000V AC VDE', '1500V DC VDE', 'Non-insulated'] },
        { name: 'handle_material', label: 'Handle Material', type: 'select', options: ['2-Component Ergonomic', 'PVC Dipped', 'Rubber', 'Fiber'] },
        { name: 'grip_type', label: 'Grip Type', type: 'select', options: ['Ergonomic', 'Anti-slip', 'Cushioned', 'Standard'] },
        { name: 'working_length', label: 'Overall Length', type: 'text', placeholder: 'e.g., 200mm', unit: 'mm' },
      ]
    },
    {
      title: 'Construction',
      fields: [
        { name: 'head_type', label: 'Head/Tip Type', type: 'select', options: ['Phillips PH', 'Slotted/Flat', 'Pozidriv PZ', 'Torx T', 'Hex/Allen', 'Square'] },
        { name: 'finish_type', label: 'Finish', type: 'select', options: ['Chrome Vanadium', 'Black Oxide', 'Nickel Plated', 'Burnished'] },
        { name: 'hardness_rating', label: 'Steel Hardness', type: 'text', placeholder: 'e.g., HRC 56–62' },
        { name: 'material_composition', label: 'Blade/Jaw Material', type: 'select', options: ['Chrome Vanadium (Cr-V)', 'Chrome Molybdenum (Cr-Mo)', 'Carbon Steel', 'Stainless Steel'] },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],

  // ═══════════════════════════════════════════════════════
  // CONDUITS & ACCESSORIES
  // IS 9537, IS 3480, IEC 61386
  // ═══════════════════════════════════════════════════════
  'conduits-accessories': [
    {
      title: 'Conduit Specifications (IEC 61386 / IS 9537)',
      fields: [
        { name: 'conduit_material', label: 'Material', type: 'select', options: ['PVC Rigid', 'GI (Galvanized Iron)', 'MS (Mild Steel)', 'HDPE', 'Flexible PVC', 'Flexible Metallic (LT)'], required: true },
        { name: 'conduit_type', label: 'Type', type: 'select', options: ['Rigid', 'Flexible', 'Corrugated', 'Liquid-tight'], required: true },
        { name: 'inner_diameter', label: 'Inner Diameter', type: 'text', placeholder: 'e.g., 20mm / 25mm', unit: 'mm', icon: Ruler, required: true },
        { name: 'outer_diameter', label: 'Outer Diameter', type: 'text', placeholder: 'e.g., 25mm / 32mm', unit: 'mm' },
        { name: 'length', label: 'Standard Length', type: 'text', placeholder: 'e.g., 3m', unit: 'm' },
        { name: 'bend_radius', label: 'Min. Bend Radius', type: 'text', placeholder: 'e.g., 6 × OD' },
      ]
    },
    {
      title: 'Performance',
      fields: [
        { name: 'compression_strength', label: 'Compression Strength', type: 'text', placeholder: 'e.g., 1250N', unit: 'N' },
        { name: 'ip_rating', label: 'IP Rating', type: 'select', options: ['IP40', 'IP54', 'IP65', 'IP66', 'IP67', 'IP68'], icon: Shield },
        { name: 'fire_resistance_rating', label: 'Fire Resistance', type: 'select', options: ['Self-extinguishing', 'FH-1', 'FH-2', 'Non-flame propagating'] },
        { name: 'operating_temperature_range', label: 'Temperature Range', type: 'text', placeholder: 'e.g., -5°C to +60°C', icon: Thermometer },
        { name: 'halogen_free', label: 'Halogen Free', type: 'boolean' },
        { name: 'uv_resistant', label: 'UV Resistant', type: 'boolean' },
      ]
    },
    {
      title: 'Compliance',
      fields: commonComplianceFields,
    }
  ],
};

/**
 * Get category-specific field definitions by slug.
 * The slug must match the `product_categories.slug` column in the database.
 */
export const getCategoryFields = (categorySlug: string): CategoryFieldGroup[] => {
  return categoryFieldMappings[categorySlug] || [];
};

/**
 * Returns a flat list of all field names for a category – useful for
 * building validation schemas or database queries.
 */
export const getCategoryFieldNames = (categorySlug: string): string[] => {
  const groups = getCategoryFields(categorySlug);
  return groups.flatMap(g => g.fields.map(f => f.name));
};

/**
 * Returns only the required field names for a category.
 */
export const getRequiredCategoryFields = (categorySlug: string): string[] => {
  const groups = getCategoryFields(categorySlug);
  return groups.flatMap(g => g.fields.filter(f => f.required).map(f => f.name));
};
