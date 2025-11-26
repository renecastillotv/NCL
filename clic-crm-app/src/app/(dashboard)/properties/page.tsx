'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProperties } from '@/hooks/use-properties';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Bed,
  Bath,
  Square,
  Eye,
  Heart,
} from 'lucide-react';
import { formatCurrency, propertyStatusColors, cn } from '@/lib/utils';
import type { Property } from '@/types';

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useProperties({
    q: search || undefined,
    status: statusFilter || undefined,
  });

  const properties = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Propiedades</h1>
          <p className="text-muted-foreground">
            {meta?.total || 0} propiedades en total
          </p>
        </div>

        <Link href="/properties/new">
          <Button>
            <Plus size={16} className="mr-2" />
            Nueva Propiedad
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por título, código o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="draft">Borrador</option>
          <option value="pending">Pendientes</option>
          <option value="sold">Vendidas</option>
          <option value="rented">Alquiladas</option>
        </select>

        <Button variant="outline" size="icon">
          <Filter size={18} />
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-8 text-center">
          <p className="text-destructive">Error al cargar propiedades</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message}
          </p>
        </Card>
      )}

      {/* Properties Grid */}
      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: Property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && properties.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay propiedades</h3>
          <p className="text-muted-foreground mt-1">
            Comienza agregando tu primera propiedad
          </p>
          <Link href="/properties/new" className="inline-block mt-4">
            <Button>
              <Plus size={16} className="mr-2" />
              Agregar Propiedad
            </Button>
          </Link>
        </Card>
      )}

      {/* Pagination */}
      {meta && meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(meta.pages)].map((_, i) => (
            <Button
              key={i}
              variant={meta.page === i + 1 ? 'default' : 'outline'}
              size="sm"
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const primaryImage = property.images.find((img) => img.isPrimary) || property.images[0];

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {/* Image */}
        <div className="relative h-48 bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Status Badge */}
          <span
            className={cn(
              'absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium',
              propertyStatusColors[property.status]
            )}
          >
            {property.status}
          </span>

          {/* Operation Type */}
          <span className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium bg-black/70 text-white">
            {property.operationType === 'sale' ? 'Venta' : 'Alquiler'}
          </span>
        </div>

        <CardContent className="p-4">
          {/* Price */}
          <p className="text-lg font-bold text-primary">
            {formatCurrency(property.priceUsd)}
          </p>

          {/* Title */}
          <h3 className="font-semibold mt-1 line-clamp-1">{property.title}</h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin size={14} />
            <span className="line-clamp-1">{property.address || 'Sin dirección'}</span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed size={14} />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath size={14} />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.areaM2 && (
              <div className="flex items-center gap-1">
                <Square size={14} />
                <span>{property.areaM2}m²</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{property.viewsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} />
              <span>{property.favoritesCount}</span>
            </div>
            <span className="ml-auto font-medium text-foreground">
              {property.code}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
