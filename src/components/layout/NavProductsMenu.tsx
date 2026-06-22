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

interface NavItem { name: string; href: string; badge?: string; }
interface NavSection { title: string; href: string; items: NavItem[]; }

const coreElectricalSections: NavSection[] = [
  {
    title: "Low Voltage Switchgear",
    href: "/categories/low_voltage_switchgear",
    items: [
      { name: "MCB",                  href: "/categories/low_voltage_switchgear?search=MCB" },
      { name: "MCCB",                 href: "/categories/low_voltage_switchgear?search=MCCB" },
      { name: "RCCB / ELCB",         href: "/categories/low_voltage_switchgear?search=RCCB" },
      { name: "Switch Disconnectors", href: "/categories/low_voltage_switchgear?search=Disconnector" },
    ],
  },
  {
    title: "Control & Motor Protection",
    href: "/categories/starters_and_switches",
    items: [
      { name: "Contactors",      href: "/categories/starters_and_switches?search=Contactor" },
      { name: "Motor Starters",  href: "/categories/starters_and_switches?search=Starter" },
      { name: "Overload Relays", href: "/categories/starters_and_switches?search=Overload" },
    ],
  },
  {
    title: "Power Quality",
    href: "/categories/capacitors_and_reactors",
    items: [
      { name: "Capacitors",   href: "/categories/capacitors_and_reactors?search=Capacitor" },
      { name: "APFC Panels",  href: "/categories/capacitors_and_reactors?search=APFC" },
    ],
  },
];

const measurementSections: NavSection[] = [
  {
    title: "Measurement & Instrumentation",
    href: "/categories/measuring_instruments",
    items: [
      { name: "Energy Meters",       href: "/categories/measuring_instruments?search=Energy+Meter" },
      { name: "Multifunction Meters", href: "/categories/measuring_instruments?search=Multifunction" },
    ],
  },
  {
    title: "Industrial Automation",
    href: "/categories/industrial_automation_vfd",
    items: [
      { name: "VFDs",   href: "/categories/industrial_automation_vfd?search=VFD" },
      { name: "Relays", href: "/categories/relays" },
    ],
  },
];

const accessoriesSections: NavSection[] = [
  {
    title: "Electrical Accessories",
    href: "/categories/wires_and_cables",
    items: [
      { name: "Wires & Cables",              href: "/categories/wires_and_cables" },
      { name: "Industrial Plugs & Sockets",  href: "/categories/industrial_plugs_and_sockets" },
      { name: "Switches & Sockets",          href: "/categories/switches_and_sockets" },
      { name: "Conduits & Accessories",      href: "/categories/conduits_and_accessories" },
    ],
  },
];

const quickAccessLinks: NavItem[] = [
  { name: "MCB",       href: "/categories/low_voltage_switchgear?search=MCB", badge: "330+ Products" },
  { name: "Contactors", href: "/categories/starters_and_switches?search=Contactor" },
  { name: "RCCB",      href: "/categories/low_voltage_switchgear?search=RCCB" },
];

const applicationLinks: NavItem[] = [
  { name: "Panel Building",        href: "/applications/panel-building" },
  { name: "Power Distribution",    href: "/applications/power-distribution" },
  { name: "Motor Control Centers", href: "/applications/motor-control-centers" },
  { name: "Energy Management",     href: "/applications/energy-management" },
  { name: "Industrial Automation", href: "/applications/industrial-automation" },
];

const NavBlock: React.FC<{ section: NavSection }> = ({ section }) => (
  <div className="mb-4 last:mb-0">
    <Link
      to={section.href}
      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-primary transition-colors"
    >
      {section.title}
    </Link>
    <ul className="space-y-1">
      {section.items.map((item) => (
        <li key={item.name}>
          <Link to={item.href} className="block text-sm text-foreground hover:text-primary transition-colors py-1">
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const NavProductsMenu: React.FC = () => (
  <NavigationMenu>
    <NavigationMenuList className="gap-0">
      <NavigationMenuItem>
        <NavigationMenuTrigger className="bg-transparent hover:bg-secondary/50 data-[state=open]:bg-secondary/50">Products</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="w-[900px] p-6 bg-background border rounded-lg shadow-xl">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Core Electrical</span>
                </div>
                {coreElectricalSections.map((s) => <NavBlock key={s.title} section={s} />)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Measurement & Automation</span>
                </div>
                {measurementSections.map((s) => <NavBlock key={s.title} section={s} />)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                  <Cable className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Accessories</span>
                </div>
                {accessoriesSections.map((s) => <NavBlock key={s.title} section={s} />)}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</h4>
                  <div className="space-y-2">
                    {quickAccessLinks.map((link) => (
                      <Link key={link.name} to={link.href} className="flex items-center justify-between text-sm text-foreground hover:text-primary transition-colors py-1 group">
                        <span className="flex items-center gap-2">
                          {link.name}
                          {link.badge && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{link.badge}</span>}
                        </span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <Link to="/products" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                View All Products <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-xs text-muted-foreground">3,951+ products from top brands</span>
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuTrigger className="bg-transparent hover:bg-secondary/50 data-[state=open]:bg-secondary/50">Applications</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="w-[320px] p-4 bg-background border rounded-lg shadow-xl">
            <div className="mb-3 pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Browse by Application</span>
            </div>
            <ul className="space-y-1">
              {applicationLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-secondary rounded-md transition-colors group">
                    {link.name}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border">
              <Link to="/applications" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                View All Applications <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <Link to="/brands" className="flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">Brands</Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link to="/sellers" className="flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">Sellers</Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link to="/about" className="flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/50 transition-colors">About</Link>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);

export default NavProductsMenu;
