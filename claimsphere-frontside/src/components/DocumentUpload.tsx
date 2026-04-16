import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  FileCheck,
  Briefcase,
  DollarSign,
  ChevronDown,
} from 'lucide-react';

type DocumentType = 'pv_police' | 'rapport_expert' | 'devis';

interface DocumentData {
  [key: string]: any;
}

interface UploadResponse {
  success: boolean;
  document: any;
  extractedData: DocumentData;
  message: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const documentTypeConfig = {
  pv_police: {
    label: 'PV Police',
    description: 'Procès-Verbal de Police (Accident Report)',
    icon: FileCheck,
    color: 'bg-blue-500',
    endpoint: '/api/ocr/upload-pv-police',
  },
  rapport_expert: {
    label: 'Rapport Expert',
    description: 'Expert Vehicle Inspection Report',
    icon: Briefcase,
    color: 'bg-orange-500',
    endpoint: '/api/ocr/upload-rapport-expert',
  },
  devis: {
    label: 'Devis',
    description: 'Repair Quote (Garagiste)',
    icon: DollarSign,
    color: 'bg-green-500',
    endpoint: '/api/ocr/upload-devis',
  },
};

export function DocumentUpload() {
  const [documentType, setDocumentType] = useState<DocumentType>('pv_police');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const config = documentTypeConfig[documentType];
  const IconComponent = config.icon;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        toast.success('PDF sélectionné');
      } else {
        toast.error('Veuillez déposer un fichier PDF');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:4000${config.endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data: UploadResponse = await response.json();

      if (data.success) {
        setResult(data);
        toast.success(`${config.label} traité avec succès!`);
      } else {
        toast.error('Erreur lors du traitement');
      }
    } catch (error) {
      console.error('Erreur d\'upload:', error);
      toast.error('Erreur d\'upload. Assurez-vous que le serveur fonctionne sur le port 4000.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
  };

  const renderExtractedData = () => {
    if (!result?.extractedData) return null;

    const data = result.extractedData;

    // PV Police specific fields
    if (documentType === 'pv_police') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">N° du PV</p>
              <p className="font-semibold text-foreground">{data.pv_number || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date de l'accident</p>
              <p className="font-semibold text-foreground">{data.accident_date || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lieu</p>
              <p className="font-semibold text-foreground text-sm">{data.accident_location || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Responsabilité</p>
              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                {data.responsibility ? `Conducteur ${data.responsibility}` : 'Non déterminée'}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Conducteur A</p>
              <p className="font-semibold text-foreground">{data.driver_a_name || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">CIN: {data.driver_a_cin || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Conducteur B</p>
              <p className="font-semibold text-foreground">{data.driver_b_name || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">CIN: {data.driver_b_cin || '—'}</p>
            </div>
            {data.circumstances && (
              <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Circonstances</p>
                <p className="text-sm text-foreground leading-relaxed">{data.circumstances}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Rapport Expert specific fields
    if (documentType === 'rapport_expert') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Référence</p>
              <p className="font-semibold text-foreground">{data.reference || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date d'expertise</p>
              <p className="font-semibold text-foreground">{data.expertise_date || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expert</p>
              <p className="font-semibold text-foreground">{data.expert_name || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Agrément</p>
              <p className="font-semibold text-foreground">{data.expert_agrément || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Véhicule</p>
              <p className="font-semibold text-foreground text-sm">
                {data.vehicle_make} {data.vehicle_model}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Immatriculation: {data.vehicle_registration || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conclusion</p>
              <Badge
                variant="outline"
                className={`${
                  data.conclusion === 'Repairable'
                    ? 'bg-green-500/10 border-green-500/20 text-green-700'
                    : 'bg-red-500/10 border-red-500/20 text-red-700'
                }`}
              >
                {data.conclusion || 'Non déterminée'}
              </Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valeur estimation réparation</p>
              <p className="font-semibold text-foreground">
                {data.repair_value_estimate ? `${data.repair_value_estimate.toLocaleString()} TND` : '—'}
              </p>
            </div>
            {data.damages_description && (
              <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Dommages constatés</p>
                <p className="text-sm text-foreground leading-relaxed">{data.damages_description}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Devis specific fields
    if (documentType === 'devis') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Référence Devis</p>
              <p className="font-semibold text-foreground">{data.reference || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-foreground">{data.devis_date || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Garage</p>
              <p className="font-semibold text-foreground">{data.garage_name || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Immatriculation véhicule</p>
              <p className="font-semibold text-foreground">{data.vehicle_registration || '—'}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sous-total HT</p>
              <p className="font-semibold text-foreground">
                {data.subtotal_ht ? `${data.subtotal_ht.toLocaleString()} TND` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">TVA (19%)</p>
              <p className="font-semibold text-foreground">
                {data.tva_19 ? `${data.tva_19.toLocaleString()} TND` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total TTC</p>
              <p className="font-bold text-lg text-primary">
                {data.total_ttc ? `${data.total_ttc.toLocaleString()} TND` : '—'}
              </p>
            </div>
            {data.items_list && (
              <div className="p-4 rounded-lg bg-muted/50 border sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Articles</p>
                <p className="text-sm text-foreground leading-relaxed">{data.items_list}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
      <Card className="p-8 bg-card rounded-xl border shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Déclarer un sinistre
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Uploadez vos documents (PV Police, Rapport Expert, ou Devis) pour traiter votre sinistre.
            </p>
          </div>
        </div>

        {!result ? (
          <>
            {/* Document Type Selector */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-2 block">Type de document</label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full p-4 rounded-lg border bg-card hover:bg-muted/50 flex items-center justify-between text-foreground transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${config.color} text-white`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-10 overflow-hidden">
                    {(Object.entries(documentTypeConfig) as Array<[DocumentType, typeof documentTypeConfig.pv_police]>).map(
                      ([type, typeConfig]) => (
                        <button
                          key={type}
                          onClick={() => {
                            setDocumentType(type);
                            setShowDropdown(false);
                          }}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition text-left ${
                            documentType === type ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className={`p-2 rounded ${typeConfig.color} text-white`}>
                            <typeConfig.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{typeConfig.label}</p>
                            <p className="text-xs text-muted-foreground">{typeConfig.description}</p>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/20 hover:border-primary/50'
              }`}
            >
              <Upload className="mx-auto mb-4 text-muted-foreground w-10 h-10" />

              <label className="cursor-pointer">
                <span className="text-primary hover:text-primary/80 font-semibold">
                  Cliquez pour télécharger
                </span>
                {' '}ou glissez-déposez
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      toast.success('PDF sélectionné');
                    }
                  }}
                  className="hidden"
                />
              </label>

              <p className="text-xs text-muted-foreground mt-2">
                {file ? (
                  <span className="text-success font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {file.name}
                  </span>
                ) : (
                  'Fichiers PDF uniquement (max 50MB)'
                )}
              </p>
            </div>

            {/* Upload Buttons */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={18} />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" size={18} />
                    Analyser le document
                  </>
                )}
              </Button>
              {file && (
                <Button
                  onClick={() => setFile(null)}
                  variant="outline"
                  size="lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle className="text-success w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-success">Extraction terminée!</p>
                  <p className="text-sm text-success/80">Les informations ont été analysées et sauvegardées.</p>
                </div>
              </div>

              {/* Extracted Data */}
              {renderExtractedData()}

              {/* Confidence Score */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Score de confiance</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full transition-all"
                        style={{ width: `${(result.extractedData.confidence || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground min-w-fit">
                    {((result.extractedData.confidence || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Raw JSON */}
              <details className="p-4 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted/70 transition">
                <summary className="font-medium text-foreground select-none">
                  Afficher les données JSON brutes
                </summary>
                <pre className="mt-4 bg-foreground/5 p-4 rounded text-xs overflow-auto max-h-64 text-foreground/80">
                  {JSON.stringify(result.extractedData, null, 2)}
                </pre>
              </details>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Télécharger un autre document
                </Button>
                <Button
                  className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90"
                  size="lg"
                >
                  Valider et continuer
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}