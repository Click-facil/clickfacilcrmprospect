// src/components/pipeline/RecusadosPage.tsx

import { Lead } from '@/types/lead';
import { Building2, Trash2, RotateCcw, XCircle, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface RecusadosPageProps {
  leads: Lead[];
  onRestaurar: (id: string) => void;
  onDeletar: (id: string) => void;
  onDeletarTodos: () => void;
}

export function RecusadosPage({ leads, onRestaurar, onDeletar, onDeletarTodos }: RecusadosPageProps) {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const handleDeletarTodos = () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      setTimeout(() => setConfirmDeleteAll(false), 4000);
      return;
    }
    onDeletarTodos();
    setConfirmDeleteAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Recusados</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} recusado{leads.length !== 1 ? 's' : ''}.
            Leads que não demonstraram interesse. Você pode restaurar ou apagar.
          </p>
        </div>

        {leads.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeletarTodos}
            className="gap-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {confirmDeleteAll
              ? 'Clique de novo para confirmar'
              : `Apagar todos (${leads.length})`}
          </Button>
        )}
      </div>

      {/* Lista */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <XCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum lead recusado</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Leads marcados como Recusados aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {leads.map(lead => (
            <div
              key={lead.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3 opacity-75 hover:opacity-100 transition-opacity"
            >
              {/* Nome */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {lead.companyName || `Lead #${lead.id.slice(0, 8)}`}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {lead.niche || 'Outros'}
                    </Badge>
                    {lead.territory && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        📍 {lead.territory}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contato */}
              {lead.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.phone}</span>
                </div>
              )}
              {lead.googleMaps && (
                <a
                  href={lead.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  Ver no Maps
                </a>
              )}
              {lead.notes && (
                <p className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1.5 rounded-md truncate">
                  {lead.notes}
                </p>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestaurar(lead.id)}
                  className="flex-1 gap-1.5 text-xs h-8"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Apagar ${lead.companyName || 'este lead'} permanentemente?`)) {
                      onDeletar(lead.id);
                    }
                  }}
                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}