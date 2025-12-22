import { LayoutDashboard, Mail, HelpCircle, BarChart3, Building2, LogOut, Package, FileText, Receipt, TrendingUp, Calendar, Settings, BookOpen, ShoppingCart, Truck, Palette, FileEdit, ExternalLink, ListOrdered, User, Image } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Fejlett Dashboard",
    url: "/admin/enhanced",
    icon: TrendingUp,
  },
  {
    title: "Könyvek / Szolgáltatások",
    url: "/admin/products",
    icon: BookOpen,
  },
  {
    title: "Megjelenések / Linkek",
    url: "/admin/featured-links",
    icon: ExternalLink,
  },
  {
    title: "Rendelések",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Szállítási díjak",
    url: "/admin/shipping",
    icon: Truck,
  },
  {
    title: "Időpontfoglalások",
    url: "/admin/bookings",
    icon: Calendar,
  },
  {
    title: "Kapcsolatok",
    url: "/admin/leads",
    icon: Mail,
  },
  {
    title: "B2B Ajánlatok",
    url: "/admin/b2b-leads",
    icon: Building2,
  },
  {
    title: "FAQ Kezelés",
    url: "/admin/faq",
    icon: HelpCircle,
  },
  {
    title: "Hogyan Működik",
    url: "/admin/process-steps",
    icon: ListOrdered,
  },
  {
    title: "Számlák",
    url: "/admin/invoices",
    icon: Receipt,
  },
  {
    title: "Analitika",
    url: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Céges adatok",
    url: "/admin/company",
    icon: FileText,
  },
  {
    title: "Levelező",
    url: "/admin/email",
    icon: Mail,
  },
  {
    title: "Számlázz.hu",
    url: "/admin/szamlazz",
    icon: Settings,
  },
  {
    title: "Főoldal",
    url: "/admin/landing",
    icon: LayoutDashboard,
  },
  {
    title: "Rólam oldal",
    url: "/admin/about",
    icon: User,
  },
  {
    title: "Tartalom (CMS)",
    url: "/admin/cms",
    icon: FileEdit,
  },
  {
    title: "Design / Téma",
    url: "/admin/theme",
    icon: Palette,
  },
];

export function AdminSidebar() {
  const { signOut } = useAuth();

  return (
    <Sidebar 
      className="border-r" 
      style={{ 
        backgroundColor: 'hsl(var(--admin-sidebar))',
        borderColor: 'hsl(var(--admin-border))'
      }}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 uppercase text-xs px-3 font-semibold tracking-wider">
            Admin Panel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                          isActive
                            ? "font-semibold text-white shadow-lg border-l-4"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`
                      }
                      style={({ isActive }) => 
                        isActive 
                          ? { 
                              backgroundColor: 'hsl(var(--admin-active))',
                              borderLeftColor: 'hsl(var(--admin-primary-hover))'
                            }
                          : undefined
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t" style={{ borderColor: 'hsl(var(--admin-border))' }}>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Kijelentkezés
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}