-- Insert sample catalog products for electrical equipment
INSERT INTO catalog_products (name, description, hsn_code, category, suggested_price, tax_rate) VALUES
-- Circuit Breakers
('MCB 10A Single Phase', 'Miniature Circuit Breaker 10A, Single Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 250.00, 18.0),
('MCB 16A Single Phase', 'Miniature Circuit Breaker 16A, Single Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 275.00, 18.0),
('MCB 20A Single Phase', 'Miniature Circuit Breaker 20A, Single Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 300.00, 18.0),
('MCB 32A Single Phase', 'Miniature Circuit Breaker 32A, Single Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 350.00, 18.0),
('MCB 10A Three Phase', 'Miniature Circuit Breaker 10A, Three Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 650.00, 18.0),
('MCB 16A Three Phase', 'Miniature Circuit Breaker 16A, Three Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 700.00, 18.0),
('MCB 20A Three Phase', 'Miniature Circuit Breaker 20A, Three Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 750.00, 18.0),
('MCB 32A Three Phase', 'Miniature Circuit Breaker 32A, Three Phase, C-curve tripping characteristic', '85363000', 'circuit_breakers', 850.00, 18.0),
('MCCB 100A Three Phase', 'Molded Case Circuit Breaker 100A, Three Phase, Adjustable thermal and magnetic settings', '85363000', 'circuit_breakers', 4500.00, 18.0),
('MCCB 160A Three Phase', 'Molded Case Circuit Breaker 160A, Three Phase, Adjustable thermal and magnetic settings', '85363000', 'circuit_breakers', 6500.00, 18.0),

-- Cables and Wires
('PVC Insulated Copper Wire 1.5 sq mm', 'Single core PVC insulated copper wire, 1.5 sq mm, 1100V grade', '85442000', 'cables_wires', 45.00, 18.0),
('PVC Insulated Copper Wire 2.5 sq mm', 'Single core PVC insulated copper wire, 2.5 sq mm, 1100V grade', '85442000', 'cables_wires', 75.00, 18.0),
('PVC Insulated Copper Wire 4 sq mm', 'Single core PVC insulated copper wire, 4 sq mm, 1100V grade', '85442000', 'cables_wires', 120.00, 18.0),
('PVC Insulated Copper Wire 6 sq mm', 'Single core PVC insulated copper wire, 6 sq mm, 1100V grade', '85442000', 'cables_wires', 180.00, 18.0),
('XLPE Cable 3C x 35 sq mm', 'XLPE insulated armored cable, 3 core x 35 sq mm, 1.1kV grade', '85442000', 'cables_wires', 2500.00, 18.0),
('XLPE Cable 3C x 50 sq mm', 'XLPE insulated armored cable, 3 core x 50 sq mm, 1.1kV grade', '85442000', 'cables_wires', 3500.00, 18.0),
('Flexible Cable 3C x 1.5 sq mm', 'Flexible multi-strand cable, 3 core x 1.5 sq mm, PVC insulated', '85442000', 'cables_wires', 85.00, 18.0),
('Control Cable 4C x 2.5 sq mm', 'Multi-core control cable, 4 core x 2.5 sq mm, PVC insulated', '85442000', 'cables_wires', 145.00, 18.0),

-- Contactors and Relays
('AC Contactor 9A Three Phase', 'AC Contactor 9A, Three Phase, 220V AC coil, 3 main contacts', '85365000', 'contactors_relays', 850.00, 18.0),
('AC Contactor 18A Three Phase', 'AC Contactor 18A, Three Phase, 220V AC coil, 3 main contacts', '85365000', 'contactors_relays', 1200.00, 18.0),
('AC Contactor 32A Three Phase', 'AC Contactor 32A, Three Phase, 220V AC coil, 3 main contacts', '85365000', 'contactors_relays', 1800.00, 18.0),
('AC Contactor 65A Three Phase', 'AC Contactor 65A, Three Phase, 220V AC coil, 3 main contacts', '85365000', 'contactors_relays', 3200.00, 18.0),
('Thermal Overload Relay 1.6-2.5A', 'Thermal overload relay, adjustable 1.6-2.5A, manual reset', '85365000', 'contactors_relays', 450.00, 18.0),
('Thermal Overload Relay 4-6A', 'Thermal overload relay, adjustable 4-6A, manual reset', '85365000', 'contactors_relays', 480.00, 18.0),
('Thermal Overload Relay 9-13A', 'Thermal overload relay, adjustable 9-13A, manual reset', '85365000', 'contactors_relays', 520.00, 18.0),
('Timer Relay On-Delay 0.1s-10min', 'Timer relay, on-delay type, 0.1 seconds to 10 minutes, 220V AC', '85365000', 'contactors_relays', 1200.00, 18.0),

-- Switchgear Components
('Isolator Switch 32A Three Phase', 'Isolator switch 32A, Three Phase, 4 pole, padlockable handle', '85363000', 'switchgear', 2500.00, 18.0),
('Load Break Switch 63A Three Phase', 'Load break switch 63A, Three Phase, 4 pole, motor operated', '85363000', 'switchgear', 8500.00, 18.0),
('Current Transformer 100/5A', 'Current transformer 100/5A, Class 1.0, 15VA burden', '85043100', 'switchgear', 1800.00, 18.0),
('Potential Transformer 11kV/110V', 'Potential transformer 11kV/110V, single phase, outdoor type', '85043200', 'switchgear', 12000.00, 18.0),
('Lightning Arrester 11kV', 'Lightning arrester 11kV, polymer housed, 10kA discharge capacity', '85353000', 'switchgear', 8500.00, 18.0),
('Busbar Support Insulator 11kV', 'Busbar support insulator 11kV, post type, outdoor weatherproof', '85389000', 'switchgear', 650.00, 18.0),

-- Distribution Boards
('MCB Distribution Board 4-Way', 'MCB distribution board, 4-way, single phase, IP40 protection', '85372000', 'distribution_boards', 850.00, 18.0),
('MCB Distribution Board 8-Way', 'MCB distribution board, 8-way, single phase, IP40 protection', '85372000', 'distribution_boards', 1200.00, 18.0),
('MCB Distribution Board 12-Way', 'MCB distribution board, 12-way, three phase, IP40 protection', '85372000', 'distribution_boards', 1800.00, 18.0),
('MCB Distribution Board 24-Way', 'MCB distribution board, 24-way, three phase, IP40 protection', '85372000', 'distribution_boards', 3200.00, 18.0),
('MCCB Panel 6-Way TPN', 'MCCB panel board, 6-way, TPN (Three Phase + Neutral), IP54 protection', '85372000', 'distribution_boards', 12000.00, 18.0),
('Motor Control Center 4-Way', 'Motor control center, 4-way, with starter compartments, IP54', '85372000', 'distribution_boards', 85000.00, 18.0),

-- Transformers
('Single Phase Transformer 5kVA', 'Single phase transformer 5kVA, 11kV/415V, oil filled', '85043100', 'transformers', 45000.00, 18.0),
('Single Phase Transformer 10kVA', 'Single phase transformer 10kVA, 11kV/415V, oil filled', '85043100', 'transformers', 65000.00, 18.0),
('Three Phase Transformer 100kVA', 'Three phase transformer 100kVA, 11kV/415V, oil filled', '85043100', 'transformers', 180000.00, 18.0),
('Three Phase Transformer 250kVA', 'Three phase transformer 250kVA, 11kV/415V, oil filled', '85043100', 'transformers', 350000.00, 18.0),
('Dry Type Transformer 1000kVA', 'Dry type transformer 1000kVA, 11kV/415V, cast resin insulation', '85043100', 'transformers', 850000.00, 18.0),

-- Motors
('Induction Motor 1HP Single Phase', 'Single phase induction motor 1HP, 1440 RPM, TEFC enclosure', '85014000', 'motors', 3500.00, 18.0),
('Induction Motor 2HP Single Phase', 'Single phase induction motor 2HP, 1440 RPM, TEFC enclosure', '85014000', 'motors', 5500.00, 18.0),
('Induction Motor 5HP Three Phase', 'Three phase induction motor 5HP, 1440 RPM, TEFC enclosure', '85014000', 'motors', 12000.00, 18.0),
('Induction Motor 10HP Three Phase', 'Three phase induction motor 10HP, 1440 RPM, TEFC enclosure', '85014000', 'motors', 22000.00, 18.0),
('Induction Motor 25HP Three Phase', 'Three phase induction motor 25HP, 1440 RPM, TEFC enclosure', '85014000', 'motors', 45000.00, 18.0),

-- Measuring Instruments
('Digital Multimeter Basic', 'Digital multimeter, 3.5 digit display, AC/DC voltage and current', '90303300', 'measuring_instruments', 850.00, 18.0),
('Digital Multimeter Professional', 'Digital multimeter, 4.5 digit display, true RMS, data logging', '90303300', 'measuring_instruments', 3500.00, 18.0),
('Clamp Meter AC/DC', 'Digital clamp meter, AC/DC current, voltage, resistance measurement', '90303300', 'measuring_instruments', 2200.00, 18.0),
('Insulation Tester 1000V', 'Digital insulation tester, 1000V test voltage, 2000 MOhm range', '90303300', 'measuring_instruments', 8500.00, 18.0),
('Earth Resistance Tester', 'Digital earth resistance tester, 3-wire method, 0.01-2000 Ohm', '90303300', 'measuring_instruments', 12000.00, 18.0),
('Power Quality Analyzer', 'Three phase power quality analyzer, harmonics, flicker analysis', '90303300', 'measuring_instruments', 185000.00, 18.0),

-- Cable Management
('PVC Cable Tray 100mm x 50mm', 'PVC cable tray with cover, 100mm x 50mm, 2 meter length', '39259000', 'cable_management', 450.00, 18.0),
('GI Cable Tray 200mm x 100mm', 'Galvanized iron cable tray, 200mm x 100mm, 2 meter length', '73239900', 'cable_management', 850.00, 18.0),
('Cable Ladder 300mm x 100mm', 'Galvanized cable ladder, 300mm x 100mm, 3 meter length', '73239900', 'cable_management', 1200.00, 18.0),
('Flexible Conduit 20mm', 'PVC flexible conduit 20mm diameter, corrugated, 25 meter coil', '39172900', 'cable_management', 250.00, 18.0),
('GI Conduit 25mm', 'Galvanized iron conduit 25mm diameter, 3 meter length', '73063000', 'cable_management', 180.00, 18.0),

-- Earthing Materials
('Copper Earth Rod 12mm x 1.2m', 'Copper bonded earth rod, 12mm diameter, 1.2 meter length', '74199990', 'earthing_materials', 850.00, 18.0),
('GI Earth Rod 16mm x 1.5m', 'Galvanized iron earth rod, 16mm diameter, 1.5 meter length', '73269090', 'earthing_materials', 450.00, 18.0),
('Copper Strip 25mm x 3mm', 'Copper earthing strip, 25mm x 3mm cross section, per meter', '74071000', 'earthing_materials', 285.00, 18.0),
('GI Strip 25mm x 6mm', 'Galvanized iron earthing strip, 25mm x 6mm, per meter', '72142000', 'earthing_materials', 145.00, 18.0),
('Earth Pit Cover Cast Iron', 'Cast iron earth pit cover, 300mm x 300mm, heavy duty', '73259900', 'earthing_materials', 1200.00, 18.0),

-- Fans and Ventilation
('Ceiling Fan 1200mm', 'Ceiling fan 1200mm sweep, 3 blades, decorative, 75W motor', '84145900', 'fans_ventilation', 2500.00, 18.0),
('Exhaust Fan 150mm', 'Exhaust fan 150mm, plastic body, for kitchen/bathroom use', '84145900', 'fans_ventilation', 850.00, 18.0),
('Industrial Pedestal Fan 750mm', 'Heavy duty pedestal fan, 750mm sweep, oscillating, 180W', '84145900', 'fans_ventilation', 8500.00, 18.0),
('Axial Flow Fan 300mm', 'Industrial axial flow fan, 300mm diameter, 1400 RPM, 230V', '84145900', 'fans_ventilation', 3500.00, 18.0),

-- LED Lighting
('LED Bulb 9W', 'LED bulb 9W, E27 base, 3000K warm white, 900 lumens', '85395000', 'led_lighting', 185.00, 18.0),
('LED Tube Light 18W', 'LED tube light 18W, 4 feet, 6500K cool white, 1800 lumens', '85395000', 'led_lighting', 425.00, 18.0),
('LED Panel Light 36W', 'LED panel light 36W, 600x600mm, 6500K, 3600 lumens, recessed', '85395000', 'led_lighting', 1850.00, 18.0),
('LED Flood Light 50W', 'LED flood light 50W, IP65 weatherproof, 6500K, 5000 lumens', '85395000', 'led_lighting', 2200.00, 18.0),
('LED Street Light 100W', 'LED street light 100W, IP66, 6500K, 10000 lumens, bracket mount', '85395000', 'led_lighting', 8500.00, 18.0),

-- Variable Frequency Drives
('VFD 1HP Single Phase Input', 'Variable frequency drive 1HP, single phase input, 3 phase output', '85044000', 'variable_frequency_drives', 8500.00, 18.0),
('VFD 3HP Three Phase', 'Variable frequency drive 3HP, three phase input/output, IP20', '85044000', 'variable_frequency_drives', 18500.00, 18.0),
('VFD 5HP Three Phase', 'Variable frequency drive 5HP, three phase, vector control, IP20', '85044000', 'variable_frequency_drives', 28500.00, 18.0),
('VFD 10HP Three Phase', 'Variable frequency drive 10HP, three phase, PID control, IP54', '85044000', 'variable_frequency_drives', 55000.00, 18.0);