'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { LandParcel } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { DocumentUploader } from '@/components/erp/DocumentUploader';
import { formatGHS } from '@/lib/utils/currency';
import { MapPin, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface EditLandModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcel: LandParcel | null;
  onSuccess?: () => void;
}

interface EditLandFormProps {
  parcel: LandParcel;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditLandForm({ parcel, onClose, onSuccess }: EditLandFormProps) {
  const [siteRef, setSiteRef] = useState(parcel.siteRef || '');
  const [title, setTitle] = useState(parcel.title || '');
  const [location, setLocation] = useState(parcel.location || '');
  const [sizeAcres, setSizeAcres] = useState<number>(parcel.sizeAcres || 1);
  const [priceGhs, setPriceGhs] = useState<number>(parcel.priceGhs || 0);
  const [titleType, setTitleType] = useState<'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE'>(parcel.titleType || 'INDENTURE');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'SOLD'>(parcel.status || 'AVAILABLE');
  const [featuresStr, setFeaturesStr] = useState(parcel.features ? parcel.features.join(', ') : 'Demarcated, Clear Documentation');
  const [description, setDescription] = useState(parcel.description || '');
  const [photos, setPhotos] = useState<string[]>(parcel.photos || []);
  const [sitePlanUrl, setSitePlanUrl] = useState<string | undefined>(parcel.sitePlanUrl);
  const [indentureDocUrl, setIndentureDocUrl] = useState<string | undefined>(parcel.indentureDocUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!siteRef.trim() || !title.trim() || !location.trim()) {
      setErrorMsg('Site Reference, Title, and Location are mandatory fields.');
      return;
    }

    if (priceGhs <= 0) {
      setErrorMsg('Direct sale price must be greater than GH₵ 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFeatures = featuresStr
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const updatedParcel: LandParcel = {
        ...parcel,
        siteRef: siteRef.trim().toUpperCase(),
        title: title.trim(),
        location: location.trim(),
        sizeAcres: sizeAcres > 0 ? sizeAcres : 1,
        priceGhs,
        status,
        titleType,
        features: parsedFeatures.length > 0 ? parsedFeatures : ['Demarcated', 'Clear Documentation'],
        description: description.trim(),
        photos:
          photos.length > 0
            ? photos
            : [
                'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
              ],
        sitePlanUrl: sitePlanUrl || undefined,
        indentureDocUrl: indentureDocUrl || undefined,
      };

      await db.landParcels.put(updatedParcel);
      await syncEngine.queueMutation('landParcels', parcel.id, 'UPDATE', updatedParcel);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update land parcel:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update land parcel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await db.landParcels.delete(parcel.id);
      await syncEngine.queueMutation('landParcels', parcel.id, 'DELETE', { id: parcel.id });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete land parcel:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete land parcel.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* References and Title */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Site / Parcel Reference *
          </label>
          <input
            type="text"
            required
            value={siteRef}
            onChange={(e) => setSiteRef(e.target.value.toUpperCase())}
            placeholder="e.g. AM-LND-EL-109"
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Listing Headline Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2.5 Acres Titled Industrial Land in Prampram"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>
      </div>

      {/* Location, Size, Title Type, Status */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Geographic Location / Enclave *
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-indigo-500" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. East Legon Hills, Accra"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Size (Acres) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.05"
            required
            value={sizeAcres || ''}
            onChange={(e) => setSizeAcres(parseFloat(e.target.value) || 1)}
            className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Title Type *
          </label>
          <select
            value={titleType}
            onChange={(e) => setTitleType(e.target.value as 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE')}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="INDENTURE">Customary Indenture</option>
            <option value="LEASEHOLD">Titled Leasehold</option>
            <option value="FREEHOLD">Titled Freehold</option>
          </select>
        </div>
      </div>

      {/* Pricing & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Direct Sale Price (GH₵) *
          </label>
          <input
            type="number"
            min={0}
            step="any"
            required
            value={priceGhs || ''}
            onChange={(e) => setPriceGhs(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 185000"
            className="w-full px-3 py-2 text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Formatted: {formatGHS(priceGhs)}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Sale Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'AVAILABLE' | 'RESERVED' | 'SOLD')}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="AVAILABLE">AVAILABLE (Active Catalog)</option>
            <option value="RESERVED">RESERVED (Deposit Received)</option>
            <option value="SOLD">SOLD (Transfer Executed)</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Directly syncs status with the public website land page.
          </span>
        </div>
      </div>

      {/* Features & Amenities */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Features &amp; Highlights (comma-separated)
        </label>
        <input
          type="text"
          value={featuresStr}
          onChange={(e) => setFeaturesStr(e.target.value)}
          placeholder="Demarcated, Survey Plan Attached, Road Access, Electricity, Titled"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
      </div>

      {/* Photos Uploader */}
      <div>
        <ProductPhotoUploader
          photos={photos}
          onChange={setPhotos}
          entityType="LAND"
          label="Land Site Photos & Cadastral Scans"
          helperText="Upload or take site photos. First photo serves as primary catalog thumbnail."
          maxPhotos={10}
        />
      </div>

      {/* Document Attachments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <DocumentUploader
          documentUrl={sitePlanUrl}
          onChange={(url) => setSitePlanUrl(url)}
          entityType="LAND"
          label="Cadastral Survey Plan Document (PDF / Scan)"
          helperText="Official surveyor-certified cadastral site plan."
          buttonText="Upload Survey Plan"
        />

        <DocumentUploader
          documentUrl={indentureDocUrl}
          onChange={(url) => setIndentureDocUrl(url)}
          entityType="LAND"
          label="Legal Indenture / Title Deed"
          helperText="Executed indenture document or land title certificate."
          buttonText="Upload Legal Indenture"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Detailed Parcel Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide context on soil condition, topography, nearby developments, road accessibility..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                Delete parcel?
              </span>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Parcel'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete Parcel
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={isSubmitting}
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Parcel Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditLandModal({
  isOpen,
  onClose,
  parcel,
  onSuccess,
}: EditLandModalProps) {
  if (!isOpen || !parcel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Land Parcel • ${parcel.siteRef}`}
      subtitle="Update titled land particulars, demarcation, survey plans, and catalog status."
      maxWidth="2xl"
    >
      <EditLandForm
        key={parcel.id}
        parcel={parcel}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
