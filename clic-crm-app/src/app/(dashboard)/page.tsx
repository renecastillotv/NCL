'use client';

import { usePropertyStats } from '@/hooks/use-properties';
import { useContactStats } from '@/hooks/use-contacts';
import { useDealStats } from '@/hooks/use-deals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Briefcase, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { data: propertyStats, isLoading: loadingProperties } = usePropertyStats();
  const { data: contactStats, isLoading: loadingContacts } = useContactStats();
  const { data: dealStats, isLoading: loadingDeals } = useDealStats();

  const stats = [
    {
      title: 'Propiedades Activas',
      value: propertyStats?.data?.active || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Contactos Nuevos',
      value: contactStats?.data?.new || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Negocios Abiertos',
      value: dealStats?.data?.open || 0,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Valor en Pipeline',
      value: formatCurrency(dealStats?.data?.totalValue || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      isString: true,
    },
  ];

  const secondaryStats = [
    {
      title: 'Total Visitas',
      value: formatNumber(propertyStats?.data?.totalViews || 0),
      icon: Eye,
    },
    {
      title: 'Consultas',
      value: formatNumber(propertyStats?.data?.totalInquiries || 0),
      icon: MessageSquare,
    },
    {
      title: 'Contactos Hot',
      value: contactStats?.data?.hot || 0,
      icon: Users,
    },
    {
      title: 'Negocios Ganados',
      value: dealStats?.data?.won || 0,
      icon: Briefcase,
    },
  ];

  const isLoading = loadingProperties || loadingContacts || loadingDeals;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {isLoading ? '...' : stat.isString ? stat.value : formatNumber(stat.value as number)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  <p className="text-lg font-semibold">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              La actividad reciente aparecerá aquí
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span>Agregar nueva propiedad</span>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-600" />
                <span>Registrar nuevo contacto</span>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-purple-600" />
                <span>Crear nuevo negocio</span>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
