import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  PackagePlus, 
  FolderPlus, 
  Settings, 
  BarChart, 
  FileText,
  Wand2
} from 'lucide-react';

const AdminQuickActions = () => {
  const actions = [
    {
      title: 'Manage Sellers',
      icon: Users,
      href: '/admin/sellers',
      color: 'text-blue-500',
      description: 'Add, edit, or review seller accounts',
    },
    {
      title: 'Manage Products',
      icon: PackagePlus,
      href: '/admin/products',
      color: 'text-emerald-500',
      description: 'Add new products or update existing ones',
    },
    {
      title: 'Manage Categories',
      icon: FolderPlus,
      href: '/admin/categories',
      color: 'text-amber-500',
      description: 'Organize your product categories',
    },
    {
      title: 'AI Generation Center',
      icon: Wand2,
      href: '/admin/ai-generation',
      color: 'text-violet-500',
      description: 'Generate images and populate products with AI',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-purple-500',
      description: 'Configure marketplace settings',
    },
    {
      title: 'Analytics',
      icon: BarChart,
      href: '/admin/analytics',
      color: 'text-indigo-500',
      description: 'View detailed sales and user reports',
    },
    {
      title: 'Generate Report',
      icon: FileText,
      href: '/admin/reports',
      color: 'text-rose-500',
      description: 'Create custom sales and inventory reports',
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link to={action.href} key={action.title} className="block">
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 justify-start flex flex-col items-start space-y-2 transition-all hover:border-primary hover:bg-primary/5"
              >
                <div className={`${action.color} p-2 rounded-md bg-gray-50`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminQuickActions;
