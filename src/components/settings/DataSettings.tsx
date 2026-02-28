// src/components/settings/DataSettings.tsx - MULTI-USUÁRIO

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Download, Upload, Database, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { csvToLeads } from '@/utils/csvToLeads';
import { firebaseDB } from '@/lib/firebaseDB';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataSettingsProps {
  onReloadLeads: () => Promise<void>;
  onClearAllLeads: () => void;
  totalLeads: number;
}

export function DataSettings({ onReloadLeads, totalLeads }: DataSettingsProps) {
  const [isReloading, setIsReloading]     = useState(false);
  const [territory, setTerritory]         = useState('');
  const [file, setFile]                   = useState<File | null>(null);
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInputKey, setFileInputKey]   = useState(Date.now());
  const [uploadStatus, setUploadStatus]   = useState('');
  const [errorMessage, setErrorMessage]   = useState('');
  const { toast } = useToast();

  const handleReload = async () => {
    setIsReloading(true);
    try {
      await onReloadLeads();
      toast({ title: 'Dados atualizados!', description: 'Leads recarregados.' });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } finally {
      setIsReloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(''); setUploadStatus('');
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) { setErrorMessage('Selecione um arquivo .csv'); return; }
    if (f.size > 10 * 1024 * 1024)              { setErrorMessage('Arquivo muito grande. Máximo 10MB'); return; }
    if (f.size === 0)                            { setErrorMessage('Arquivo vazio'); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file)      { toast({ title: 'Selecione um arquivo', variant: 'destructive' }); return; }
    if (!territory) { toast({ title: 'Informe o território/cidade', variant: 'destructive' }); return; }

    setIsUploading(true); setErrorMessage(''); setUploadStatus('Lendo arquivo...'); setUploadProgress(0);
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error('Arquivo CSV está vazio');

      setUploadStatus('Convertendo dados...');
      const leads = csvToLeads(text);
      if (leads.length === 0) throw new Error('Nenhum lead válido encontrado no CSV');

      const leadsComTerritorio = leads.map(lead => {
        const idConsistente = (lead.companyName.trim() + territory)
          .toLowerCase().replace(/[^a-z0-9]/g, '');
        return { ...lead, id: idConsistente, territory };
      });

      setUploadStatus('Enviando para Firebase...');
      const importados = await firebaseDB.importLeads(leadsComTerritorio, setUploadProgress);

      toast({ title: 'Importação concluída!', description: `${importados} leads importados em "${territory}".` });
      setFile(null); setTerritory(''); setFileInputKey(Date.now());
      setUploadStatus('Recarregando...');
      setTimeout(async () => { await onReloadLeads(); setUploadStatus(''); }, 500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro desconhecido');
      toast({ title: 'Erro ao importar', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false); setUploadProgress(0);
    }
  };

  const exportarDados = async () => {
    try {
      const leads = await firebaseDB.exportarLeads();
      if (leads.length === 0) { toast({ title: 'Nenhum dado para exportar', variant: 'destructive' }); return; }
      const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup criado!', description: `${leads.length} leads exportados.` });
    } catch {
      toast({ title: 'Erro ao exportar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus dados e sincronização</p>
      </div>

      {/* IMPORTAR CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />Importar Leads do CSV</CardTitle>
          <CardDescription>Faça upload do arquivo CSV gerado pelo scraper</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Os leads importados ficam visíveis <strong>apenas para você</strong>. Informe a cidade/região para organizar o território.
            </AlertDescription>
          </Alert>

          {/* Território — agora campo livre */}
          <div className="space-y-2">
            <Label>Cidade / Território *</Label>
            <Input
              placeholder="Ex: São Paulo, Belém, Paragominas..."
              value={territory}
              onChange={e => setTerritory(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Arquivo */}
          <div className="space-y-2">
            <Label>Arquivo CSV *</Label>
            <input
              key={fileInputKey}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:opacity-50"
            />
            {file && !errorMessage && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />{file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            {errorMessage && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" />{errorMessage}
              </p>
            )}
          </div>

          {isUploading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {uploadStatus} {uploadProgress > 0 && `(${uploadProgress}%)`}
                <Progress value={uploadProgress} className="mt-2" />
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || !territory || isUploading || !!errorMessage}
            className="w-full gap-2"
          >
            {isUploading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Importando...</>
              : <><Upload className="w-4 h-4" />Importar Leads</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* GERENCIAMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" />Gerenciamento</CardTitle>
          <CardDescription>{totalLeads} leads na sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Atualizar Leads</h3>
              <p className="text-sm text-muted-foreground">Recarrega do Firebase</p>
            </div>
            <Button onClick={handleReload} disabled={isReloading} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
              {isReloading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Exportar Dados</h3>
              <p className="text-sm text-muted-foreground">Backup JSON dos seus leads</p>
            </div>
            <Button onClick={exportarDados} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />Exportar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}