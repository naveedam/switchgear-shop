import React from "react";
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Zap, Gauge, Cable, ArrowRight } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  badge?: string;
}

interface NavSection {
  title: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

const coreElectricalSections: NavSection[] = [
  {
    title: "Low Voltage Switchgear",
    items: [
      { name: "MCB", href: "/products?subcategory=mcb" },
      { name: "MCCB", href: "/products?subcategory=mccb" },
      { name: "ACB", href: "/products?subcategory=acb" },
      { name: "RCCB / RCBO", href: "/products?subcategory=rccb-rcbo" },
      { name: "Switch Disconnectors", href: "/products?subcategory=switch-disconnectors" },
    ],
  },
  {
    title: "Control & Motor Protection",
    items: [
      { name: "Contactors", href: "/products?subcategory=contactors" },
      { name: "Overload Relays", href: "/products?subcategory=overload-relays" },
      { name: "Motor Starters", href: "/products?subcategory=motor-starters" },
      { name: "Control Relays", href: "/products?subcategory=control-relays" },
      { name: "Timers", href: "/products?subcategory=timers" },
    ],
  },
  {
    title: "Power Quality",
    items: [
      { name: "Capacitors", href: "/products?subcategory=capacitors" },
      { name: "Detuned Reactors", href: "/products?subcategory=detuned-reactors" },
      { name: "APFC Panels", href: "/products?subcategory=apfc-panels" },
    ],
  },
];

const measurementAutomationSections: NavSection[] = [
  {
    title: "Measurement & Instrumentation",
    items: [
      { name: "Energy Meters", href: "/products?subcategory=energy-meters" },
      { name: "Multifunction Meters", href: "/products?subcategory=multifunction-meters" },
      { name: "CTs & PTs", href: "/products?subcategory=cts-pts" },
      { name: "Panel Instruments", href: "/products?subcategory=panel-instruments" },
    ],
  },
  {
    title: "Industrial Automation",
    items: [
      { name: "PLCs", href: "/products?subcategory=plcs" },
      { name: "HMIs", href: "/products?subcategory=hmis" },
      { name: "VFDs", href: "/products?subcategory=vfds" },
      { name: "Power Supplies", href: "/products?subcategory=power-supplies" },
    ],
  },
];

const accessoriesSections: NavSection[] = [
  {
    title: "Electrical Accessories",
    items: [
      { name: "Wires & Cables", href: "/products?category=wires-and-cables" },
      { name: "Industrial Plugs & Sockets", href: "/products?category=industrial-plugs-and-sockets" },
      { name: "Switches & Sockets", href: "/products?category=switches-and-sockets" },
      { name: "Conduits & Accessories", href: "/products?category=conduits-and-accessories" },
    ],
  },
];

const quickAccessLinks: NavItem[] = [
  { name: "MCCBs", href: "/products?subcategory=mccb", badge: "Most Ordered" },
  { name: "Contactors", href: "/products?subcategory=contactors" },
  { name: "Control Relays", href: "/products?subcategory=control-relays" },
  { name: "Energy Meters", href: "/products?subcategory=energy-meters" },
  { name: "Panel Accessories", href: "/products?subcategory=panel-accessories" },
];

const applicationLinks: NavItem[] = [
  { name: "Panel Building", href: "/applications/panel-building" },
  { name: "Power Distribution", href: "/applications/power-distribution" },
  { name: "Motor Control Centers (MCC)", href: "/applications/motor-control-centers" },
  { name: "Energy Management", href: "/applications/energy-management" },
  { name: "Industrial Automation", href: "/applications/industrial-automation" },
];

const NavSection: React.FC<{ section: NavSection }> = ({ section }) => (
  <div className="mb-4 last:mb-0">
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {section.title}
    </h4>
    <ul className="space-y-1">
      {section.items.map((item) => (
        <li key={item.name}>
          <Link
            to={item.href}
            className="block text-sm text-foreground hover:text-primary transition-colors py-1"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const NavProductsMenu: React.FC = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-0">
        {/* Products Mega Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-secondary/50 data-[state=open]:bg-secondary/50">
            Products
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[900px] p-6 bg-background border rounded-lg shadow-xl">
              <div className="grid grid-cols-3 gap-8">
                {/* Column 1: Core Electrical */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Core Electrical</span>
                  </div>
                  {coreElectricalSections.map((section) => (
                    <NavSection key={section.title} section={section} />
                  ))}
                </div>

                {/* Column 2: Measurement & Automation */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Measurement & Automation</span>
                  </div>
                  {measurementAutomationSections.map((section) => (
                    <NavSection key={section.title} section={section} />
                  ))}
                </div>

                {/* Column 3: Accessories & Quick Access */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                    <Cable className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Accessories & Quick Access</span>
                  </div>
                  {accessoriesSections.map((section) => (
                    <NavSection key={section.title} section={section} />
                  ))}
                  
                  {/* Quick Access Links */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Quick Access
                    </h4>
                    <div className="space-y-2">
                      {quickAccessLinks.map((link) => (
                        <Link
                          key={link.name}
                          to={link.href}
                          className="flex items-center justify-between text-sm text-foreground hover:text-primary transition-colors py-1 group"
                        >
                          <span className="flex items-center gap-2">
                            {link.name}
                            {link.badge && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                {link.badge}
                              </span>
                            )}
                          </span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer with View All */}
              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <Link
                  to="/categories"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  View All Categories
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-muted-foreground">
                  1000+ products from 50+ brands
                </span>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Applications Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent hover:bg-secondary/50 data-[state=open]:bg-secondary/50">
            Applications
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[320px] p-4 bg-background border rounded-lg shadow-xl">
              <div className="mb-3 pb-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Browse by Application
                </span>
              </div>
              <ul className="space-y-1">
                {applicationLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-md transition-colors group"
                    >
                      {link.name}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-border">
                <Link
                  to="/applications"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                  View All Applications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Brands Link */}
        <NavigationMenuItem>
          <Link
            to="/brands"
            className="flex items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            Brands
          </Link>
        </NavigationMenuItem>

        {/* Sellers Link */}
        <NavigationMenuItem>
          <Link
            to="/sellers"
            className="flex items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            Sellers
          </Link>
        </NavigationMenuItem>

        {/* About Link */}
        <NavigationMenuItem>
          <Link
            to="/about"
            className="flex items-center justify-between rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors"
          >
            About
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavProductsMenu;
