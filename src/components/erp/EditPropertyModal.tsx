'use client';

import { useState, type FormEvent } from 'react';
import { db } from '@/lib/db';
import { syncEngine } from '@/lib/sync/syncEngine';
import type { PropertyUnit } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProductPhotoUploader } from '@/components/erp/ProductPhotoUploader';
import { formatGHS } from '@/lib/utils/currency';
import { AlertCircle, Trash2, CheckCircle2, MapPin } from 'lucide-react';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyUnit | null;
  onSuccess?: () => void;
}

interface EditPropertyFormProps {
  property: PropertyUnit;
  onClose: () => void;
  onSuccess?: () => void;
}

function EditPropertyForm({ property, onClose, onSuccess }: EditPropertyFormProps) {
  const [unitRef, setUnitRef] = useState(property.unitRef || '');
  const [title, setTitle] = useState(property.title || '');
  const [propertyType, setPropertyType] = useState<'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL'>(property.propertyType || 'RESIDENTIAL');
  const [location, setLocation] = useState(property.location || '');
  const [bedrooms, setBedrooms] = useState<number>(property.bedrooms || 3);
  const [bathrooms, setBathrooms] = useState<number>(property.bathrooms || 3);
  const [priceGhs, setPriceGhs] = useState<number>(property.priceGhs || 0);
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'SOLD'>(property.status || 'AVAILABLE');
  const [featuresStr, setFeaturesStr] = useState(property.features ? property.features.join(', ') : 'Executive Finishing, 24/7 Security');
  const [description, setDescription] = useState(property.description || '');
  const [photos, setPhotos] = useState<string[]>(property.photos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!unitRef.trim() || !title.trim() || !location.trim()) {
      setErrorMsg('Unit Reference, Title, and Location are required fields.');
      return;
    }

    if (priceGhs <= 0) {
      setErrorMsg('Asking price must be greater than GH₵ 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedFeatures = featuresStr
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      const updatedProperty: PropertyUnit = {
        ...property,
        unitRef: unitRef.trim().toUpperCase(),
        title: title.trim(),
        propertyType,
        location: location.trim(),
        bedrooms: propertyType === 'RESIDENTIAL' ? bedrooms : undefined,
        bathrooms: propertyType === 'RESIDENTIAL' ? bathrooms : undefined,
        priceGhs,
        status,
        features: parsedFeatures.length > 0 ? parsedFeatures : ['Executive Finishing', '24/7 Security', 'Titled'],
        description: description.trim(),
        photos:
          photos.length > 0
            ? photos
            : [
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
              ],
      };

      await db.propertyUnits.put(updatedProperty);
      await syncEngine.queueMutation('propertyUnits', property.id, 'UPDATE', updatedProperty);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update property unit:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update property unit.');
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
      await db.propertyUnits.delete(property.id);
      await syncEngine.queueMutation('propertyUnits', property.id, 'DELETE', { id: property.id });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete property unit:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete property unit.');
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

      {/* References and Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Unit Reference *
          </label>
          <input
            type="text"
            required
            value={unitRef}
            onChange={(e) => setUnitRef(e.target.value.toUpperCase())}
            placeholder="e.g. AM-PROP-CNT-04"
            className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Property Type *
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL')}
            className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="RESIDENTIAL">Residential (House / Apartment / Townhouse)</option>
            <option value="COMMERCIAL">Commercial (Office / Retail Complex)</option>
            <option value="INDUSTRIAL">Industrial (Warehouse / Factory Yard)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Listing Status *
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'AVAILABLE' | 'RESERVED' | 'SOLD')}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="AVAILABLE">AVAILABLE (Active Catalog)</option>
            <option value="RESERVED">RESERVED (Deposit Paid)</option>
            <option value="SOLD">SOLD (Discharged)</option>
          </select>
        </div>
      </div>

      {/* Title & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Property Headline Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 4-Bedroom Luxury Smart Villa in Cantonments"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Location / Area *
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-indigo-500" />
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Cantonments, Accra"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Residential Specifics & Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        {propertyType === 'RESIDENTIAL' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={bathrooms}
                onChange={(e) => setBathrooms(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </>
        )}

        <div className={propertyType === 'RESIDENTIAL' ? 'sm:col-span-1' : 'sm:col-span-3'}>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Asking Price (GH₵) *
          </label>
          <input
            type="number"
            min={0}
            step="any"
            required
            value={priceGhs || ''}
            onChange={(e) => setPriceGhs(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 1450000"
            className="w-full px-3 py-2 text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            Formatted: {formatGHS(priceGhs)}
          </span>
        </div>
      </div>

      {/* Features & Amenities */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Features &amp; Amenities (comma-separated)
        </label>
        <input
          type="text"
          value={featuresStr}
          onChange={(e) => setFeaturesStr(e.target.value)}
          placeholder="Executive Finishing, 24/7 Security, Backup Power, Swimming Pool, Gated Enclave"
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
        />
      </div>

      {/* Photos & Gallery */}
      <div>
        <ProductPhotoUploader
          photos={photos}
          onChange={setPhotos}
          entityType="PROPERTY"
          label="Property Architectural &amp; Interior Photos"
          helperText="Upload or take photos. The first image will be the primary catalog card thumbnail."
          maxPhotos={10}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Property Description &amp; Highlights
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe architectural layout, land title status, neighborhood security, fitted kitchen, master suites..."
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
        />
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                Delete unit?
              </span>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Unit'}
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
              Delete Unit
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
            {isSubmitting ? 'Saving Changes...' : 'Save Unit Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function EditPropertyModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}: EditPropertyModalProps) {
  if (!isOpen || !property) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Property Unit • ${property.unitRef}`}
      subtitle="Modify residential or commercial listing specifications, pricing, amenities, and gallery."
      maxWidth="2xl"
    >
      <EditPropertyForm
        key={property.id}
        property={property}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Modal>
  );
}
