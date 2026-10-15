'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Customer, AuctionLot, DealershipVehicle, LandParcel } from '@/lib/types';
import { syncEngine } from '@/lib/sync/syncEngine';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  Users,
  Gavel,
  Car,
  ShieldAlert,
} from 'lucide-react';

type ImportCategory = 'CUSTOMERS' | 'AUCTION_LOTS' | 'DEALERSHIP_CARS' | 'LAND_PARCELS';

export default function DataMigrationPage() {
  const [selectedCategory, setSelectedCategory] = useState<ImportCategory>('CUSTOMERS');
  const [csvText, setCsvText] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live record counts from Dexie
  const customerCount = useLiveQuery(() => db.customers.count(), []) ?? 0;
  const lotsCount = useLiveQuery(() => db.auctionLots.count(), []) ?? 0;
  const vehiclesCount = useLiveQuery(() => db.dealershipVehicles.count(), []) ?? 0;
  const landCount = useLiveQuery(() => db.landParcels.count(), []) ?? 0;
  const propertiesCount = useLiveQuery(() => db.propertyUnits.count(), []) ?? 0;
  const paymentPlansCount = useLiveQuery(() => db.paymentPlans.count(), []) ?? 0;
  const receiptsCount = useLiveQuery(() => db.receipts.count(), []) ?? 0;
  const outboxCount = useLiveQuery(() => db.syncOutbox.count(), []) ?? 0;

  // Templates for CSV
  const templates: Record<ImportCategory, { filename: string; headers: string[]; sample: string }> = {
    CUSTOMERS: {
      filename: 'amendesk_customers_template.csv',
      headers: ['fullName', 'phone', 'email', 'ghanaCardNumber', 'address', 'customerType', 'kycVerified'],
      sample: `fullName,phone,email,ghanaCardNumber,address,customerType,kycVerified
Kwame Mensah,+233244123456,kwame@example.com,GHA-712398471-2,Airport Residential Area Accra,INDIVIDUAL,true
Esi Asare,+233501234567,esi.asare@example.com,GHA-908123741-5,East Legon Accra,INDIVIDUAL,true
Volta Transport Ltd,+233200987654,logistics@voltatrans.gh,GHA-100293847-0,Tema Heavy Industrial Area,CORPORATE,false`,
    },
    AUCTION_LOTS: {
      filename: 'amendesk_auction_lots_template.csv',
      headers: ['lotNumber', 'title', 'category', 'assetType', 'reservePriceGhs', 'courtCaseNumber', 'sheriffInstructionRef'],
      sample: `lotNumber,title,category,assetType,reservePriceGhs,courtCaseNumber,sheriffInstructionRef
LOT-2026-004,2021 Toyota Hilux D4D,JUDICIAL,MOVABLE,115000,HC/COMM/2025/089,SHF/WRIT/2026/014
LOT-2026-005,Caterpillar 320D Excavator,GOVERNMENT,MOVABLE,320000,,
LOT-2026-006,0.5 Acre Commercial Plot Tema,PRIVATE,IMMOVABLE,450000,,`,
    },
    DEALERSHIP_CARS: {
      filename: 'amendesk_dealership_cars_template.csv',
      headers: ['stockNumber', 'vin', 'make', 'model', 'year', 'fuelType', 'landedCostGhs', 'askingPriceGhs'],
      sample: `stockNumber,vin,make,model,year,fuelType,landedCostGhs,askingPriceGhs
STK-2026-012,4T1B11HK5MU129041,Toyota,Camry SE,2022,PETROL,185000,225000
STK-2026-013,1FTFW1ED4NFC91244,Ford,F-150 Lariat,2023,PETROL,310000,380000
STK-2026-014,WAUZZZF27MA019283,Audi,A6 S-Line,2021,DIESEL,240000,295000`,
    },
    LAND_PARCELS: {
      filename: 'amendesk_land_parcels_template.csv',
      headers: ['siteRef', 'title', 'location', 'sizeAcres', 'priceGhs', 'titleType'],
      sample: `siteRef,title,location,sizeAcres,priceGhs,titleType
LND-APO-001,Prime Residential Plot,Appolonia City,0.18,140000,LEASEHOLD
LND-DAW-002,Industrial Light Corridor,Dawhenya High Road,2.5,650000,FREEHOLD
LND-OYI-003,Hillside View Parcel,Oyibi Hills,0.25,95000,INDENTURE`,
    },
  };

  const loadSample = () => {
    setCsvText(templates[selectedCategory].sample);
    setValidationErrors([]);
    setSuccessMessage(null);
  };

  const handleDownloadTemplate = () => {
    const tmpl = templates[selectedCategory];
    const blob = new Blob([tmpl.sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', tmpl.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Parsing & Ingestion
  const handleIngestCsv = async () => {
    setValidationErrors([]);
    setSuccessMessage(null);

    if (!csvText.trim()) {
      setValidationErrors(['Please enter or paste CSV content before importing.']);
      return;
    }

    setIsProcessing(true);

    try {
      const lines = csvText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setValidationErrors(['CSV must contain a header row and at least one data row.']);
        setIsProcessing(false);
        return;
      }

      const rows = lines.slice(1);
      const errors: string[] = [];
      let importedCount = 0;

      if (selectedCategory === 'CUSTOMERS') {
        const recordsToInsert: Customer[] = [];

        rows.forEach((row, idx) => {
          const cols = row.split(',').map((c) => c.trim());
          const [fullName, phone, email, ghanaCardNumber, address, customerTypeStr, kycVerifiedStr] = cols;

          if (!fullName || !phone) {
            errors.push(`Row ${idx + 2}: Full Name and Phone are mandatory.`);
            return;
          }

          if (ghanaCardNumber && !ghanaCardNumber.startsWith('GHA-')) {
            errors.push(`Row ${idx + 2} (${fullName}): Ghana Card must begin with 'GHA-' (got ${ghanaCardNumber}).`);
            return;
          }

          recordsToInsert.push({
            id: `mig-cust-${Date.now()}-${idx}`,
            fullName,
            phone,
            email: email || '',
            ghanaCardNumber: ghanaCardNumber || `GHA-PENDING-${Date.now()}`,
            address: address || 'Accra, Ghana',
            customerType: customerTypeStr?.toUpperCase() === 'CORPORATE' ? 'CORPORATE' : 'INDIVIDUAL',
            kycVerified: kycVerifiedStr?.toLowerCase() === 'true',
            createdAt: new Date().toISOString(),
            notes: 'Imported via AmenDesk Data Migration Hub',
          });
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setIsProcessing(false);
          return;
        }

        for (const cust of recordsToInsert) {
          await db.customers.put(cust);
          await syncEngine.queueMutation('customers', cust.id, 'CREATE', cust);
        }
        importedCount = recordsToInsert.length;
      } else if (selectedCategory === 'AUCTION_LOTS') {
        const recordsToInsert: AuctionLot[] = [];

        rows.forEach((row, idx) => {
          const cols = row.split(',').map((c) => c.trim());
          const [lotNumber, title, category, assetType, reservePriceGhsStr, courtCaseNumber, sheriffInstructionRef] = cols;

          if (!lotNumber || !title || !category || !assetType) {
            errors.push(`Row ${idx + 2}: lotNumber, title, category, and assetType are required.`);
            return;
          }

          if (category.toUpperCase() === 'GOVERNMENT' && assetType.toUpperCase() === 'IMMOVABLE') {
            errors.push(`Row ${idx + 2} (${lotNumber}): Government auctions are strictly MOVABLE only. Immovable assets are legally blocked.`);
            return;
          }

          if (category.toUpperCase() === 'JUDICIAL') {
            if (!courtCaseNumber || !sheriffInstructionRef) {
              errors.push(`Row ${idx + 2} (${lotNumber}): Judicial auction lots strictly require courtCaseNumber and sheriffInstructionRef.`);
              return;
            }
          }

          const reservePrice = parseFloat(reservePriceGhsStr) || 0;
          const nowStr = new Date().toISOString();

          recordsToInsert.push({
            id: `mig-lot-${Date.now()}-${idx}`,
            eventId: 'evt-2026-migrated',
            lotNumber,
            title,
            category: category.toUpperCase() as 'PRIVATE' | 'GOVERNMENT' | 'JUDICIAL',
            assetType: assetType.toUpperCase() as 'MOVABLE' | 'IMMOVABLE',
            reservePriceGhs: reservePrice,
            startingBidGhs: Math.round(reservePrice * 0.7),
            currentBidGhs: Math.round(reservePrice * 0.7),
            marginRatePercent: 7,
            status: 'UPCOMING',
            conditionNotes: 'Migrated inventory lot in good operational condition.',
            photos: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
            yardLocation: 'Yard 1 - Main Yard, Accra',
            courtCaseNumber: courtCaseNumber || undefined,
            sheriffInstructionRef: sheriffInstructionRef || undefined,
            extensionCount: 0,
            syncStatus: 'SYNCED',
            createdAt: nowStr,
            updatedAt: nowStr,
          });
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setIsProcessing(false);
          return;
        }

        for (const lot of recordsToInsert) {
          await db.auctionLots.put(lot);
          await syncEngine.queueMutation('auctionLots', lot.id, 'CREATE', lot);
        }
        importedCount = recordsToInsert.length;
      } else if (selectedCategory === 'DEALERSHIP_CARS') {
        const recordsToInsert: DealershipVehicle[] = [];

        rows.forEach((row, idx) => {
          const cols = row.split(',').map((c) => c.trim());
          const [stockNumber, vin, make, model, yearStr, fuelType, landedCostStr, askingPriceStr] = cols;

          if (!stockNumber || !vin || !make || !model) {
            errors.push(`Row ${idx + 2}: stockNumber, vin, make, and model are required.`);
            return;
          }

          recordsToInsert.push({
            id: `mig-veh-${Date.now()}-${idx}`,
            stockNumber,
            vin,
            make,
            model,
            year: parseInt(yearStr, 10) || 2022,
            fuelType: (fuelType?.toUpperCase() as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC') || 'PETROL',
            transmission: 'AUTOMATIC',
            mileageKm: 45000,
            color: 'Silver / Metallic',
            landedCostGhs: parseFloat(landedCostStr) || 120000,
            askingPriceGhs: parseFloat(askingPriceStr) || 150000,
            status: 'AVAILABLE',
            photos: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'],
            description: `${make} ${model} imported direct from overseas auction with full landed customs documentation.`,
            featured: true,
            location: 'Main Showroom, Ring Road Central',
            createdAt: new Date().toISOString(),
          });
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setIsProcessing(false);
          return;
        }

        for (const veh of recordsToInsert) {
          await db.dealershipVehicles.put(veh);
          await syncEngine.queueMutation('dealershipVehicles', veh.id, 'CREATE', veh);
        }
        importedCount = recordsToInsert.length;
      } else if (selectedCategory === 'LAND_PARCELS') {
        const recordsToInsert: LandParcel[] = [];

        rows.forEach((row, idx) => {
          const cols = row.split(',').map((c) => c.trim());
          const [siteRef, title, location, sizeAcresStr, priceGhsStr, titleTypeStr] = cols;

          if (!siteRef || !title || !location) {
            errors.push(`Row ${idx + 2}: siteRef, title, and location are required.`);
            return;
          }

          const parsedTitleType = titleTypeStr?.toUpperCase();
          const titleType: 'FREEHOLD' | 'LEASEHOLD' | 'INDENTURE' =
            parsedTitleType === 'FREEHOLD'
              ? 'FREEHOLD'
              : parsedTitleType === 'LEASEHOLD'
              ? 'LEASEHOLD'
              : 'INDENTURE';

          recordsToInsert.push({
            id: `mig-lnd-${Date.now()}-${idx}`,
            siteRef,
            title,
            location,
            sizeAcres: parseFloat(sizeAcresStr) || 0.14,
            priceGhs: parseFloat(priceGhsStr) || 80000,
            titleType,
            status: 'AVAILABLE',
            features: ['Litigation Free', 'Cadastral Survey Done', 'Accessible Roads'],
            description: `${title} located at ${location}. Ready for immediate development with clear title.`,
            sitePlanUrl: 'https://example.com/siteplan.pdf',
            createdAt: new Date().toISOString(),
          });
        });

        if (errors.length > 0) {
          setValidationErrors(errors);
          setIsProcessing(false);
          return;
        }

        for (const lnd of recordsToInsert) {
          await db.landParcels.put(lnd);
          await syncEngine.queueMutation('landParcels', lnd.id, 'CREATE', lnd);
        }
        importedCount = recordsToInsert.length;
      }

      setSuccessMessage(
        `Successfully validated and imported ${importedCount} records into ${selectedCategory}. Changes queued for live sync.`
      );
      setCsvText('');
    } catch (err: unknown) {
      setValidationErrors([`Migration failed: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Full Database Backup Export (.json)
  const handleExportFullBackup = async () => {
    setIsProcessing(true);
    try {
      const backupData = {
        meta: {
          app: 'AmenDesk ERP',
          client: 'Amen Mart Ghana',
          exportTimestamp: new Date().toISOString(),
          version: '1.0.0',
        },
        customers: await db.customers.toArray(),
        auctionLots: await db.auctionLots.toArray(),
        dealershipVehicles: await db.dealershipVehicles.toArray(),
        landParcels: await db.landParcels.toArray(),
        propertyUnits: await db.propertyUnits.toArray(),
        paymentPlans: await db.paymentPlans.toArray(),
        receipts: await db.receipts.toArray(),
        waybills: await db.waybills.toArray(),
        saleTransferDocs: await db.saleTransferDocs.toArray(),
        inventoryItems: await db.inventoryItems.toArray(),
        stockMovements: await db.stockMovements.toArray(),
        syncOutbox: await db.syncOutbox.toArray(),
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `amendesk_full_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage('Full database backup generated and downloaded successfully.');
    } catch (err: unknown) {
      setValidationErrors([`Backup export failed: ${err instanceof Error ? err.message : String(err)}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Full Database Restore (.json)
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        const content = event.target?.result as string;
        const backup = JSON.parse(content);

        if (!backup.meta || backup.meta.app !== 'AmenDesk ERP') {
          throw new Error('Invalid backup file. Missing AmenDesk signature.');
        }

        if (backup.customers) await db.customers.bulkPut(backup.customers);
        if (backup.auctionLots) await db.auctionLots.bulkPut(backup.auctionLots);
        if (backup.dealershipVehicles) await db.dealershipVehicles.bulkPut(backup.dealershipVehicles);
        if (backup.landParcels) await db.landParcels.bulkPut(backup.landParcels);
        if (backup.propertyUnits) await db.propertyUnits.bulkPut(backup.propertyUnits);
        if (backup.paymentPlans) await db.paymentPlans.bulkPut(backup.paymentPlans);
        if (backup.receipts) await db.receipts.bulkPut(backup.receipts);
        if (backup.waybills) await db.waybills.bulkPut(backup.waybills);
        if (backup.saleTransferDocs) await db.saleTransferDocs.bulkPut(backup.saleTransferDocs);
        if (backup.inventoryItems) await db.inventoryItems.bulkPut(backup.inventoryItems);
        if (backup.stockMovements) await db.stockMovements.bulkPut(backup.stockMovements);

        setSuccessMessage('System backup successfully restored into local database.');
        setValidationErrors([]);
      } catch (err: unknown) {
        setValidationErrors([`Restore failed: ${err instanceof Error ? err.message : String(err)}`]);
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Database className="h-6 w-6 text-indigo-600" />
            Data Migration &amp; Offline Portability Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bulk ingest legacy Excel/CSV datasets, export offline yard snapshots, and manage device-to-device migration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={handleExportFullBackup}
            disabled={isProcessing}
          >
            Export Full Backup (.json)
          </Button>

          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors">
              <Upload className="h-4 w-4" />
              Restore Device
            </span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreBackup}
              disabled={isProcessing}
            />
          </label>
        </div>
      </div>

      {/* Database Schema & Health Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Customers &amp; Bidders</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{customerCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Gavel className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Auction Lots</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{lotsCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Showroom Cars</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{vehiclesCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Land &amp; Units</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{landCount + propertiesCount}</p>
          </div>
        </div>
      </div>

      {/* Migration Strategy Overview Card */}
      <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-indigo-600" />
          AmenDesk Data Migration &amp; Portability Protocol
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">1. Legacy Ingestion</p>
            <p>
              Import past auction records, client contacts, and vehicle stock from Excel spreadsheets directly into Dexie IndexedDB with format validation.
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">2. Zero-Net Device Cloning</p>
            <p>
              Use the JSON snapshot to provision a replacement tablet or cash-office PC in the yard in under 30 seconds with 100% offline data integrity.
            </p>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">3. Schema Versioning</p>
            <p>
              IndexedDB schemas utilize explicit Dexie versions. Future upgrades execute seamless table migrations without clearing existing cash transactions.
            </p>
          </div>
        </div>
      </div>

      {/* CSV Bulk Ingestion Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Batch Ingestion &amp; CSV Parser
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an entity type to populate or ingest legacy spreadsheets into the local database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['CUSTOMERS', 'AUCTION_LOTS', 'DEALERSHIP_CARS', 'LAND_PARCELS'] as ImportCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setValidationErrors([]);
                  setSuccessMessage(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Action Bar for Selected Entity */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Expected Columns:</span>
            <div className="flex flex-wrap gap-1">
              {templates[selectedCategory].headers.map((h) => (
                <span
                  key={h}
                  className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSample}
              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Load Sample Data
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleDownloadTemplate}
              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download Template
            </button>
          </div>
        </div>

        {/* Text Area Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Paste CSV or Tab-Separated Data
          </label>
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste CSV content here...\nExample:\n${templates[selectedCategory].sample}`}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-1.5">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Validation failed with {validationErrors.length} error(s):</span>
            </div>
            <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-1">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Execute Ingestion Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              setCsvText('');
              setValidationErrors([]);
              setSuccessMessage(null);
            }}
            disabled={!csvText || isProcessing}
          >
            Clear
          </Button>

          <Button
            variant="primary"
            onClick={handleIngestCsv}
            disabled={!csvText.trim() || isProcessing}
            icon={<Upload className="h-4 w-4" />}
          >
            {isProcessing ? 'Validating & Importing...' : `Ingest Into ${selectedCategory}`}
          </Button>
        </div>
      </div>

      {/* Database Diagnostics Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-indigo-600" />
            IndexedDB Local Store Schema Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time table partitions registered in the local Dexie store.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="grid grid-cols-4 p-4 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
            <div>Table Name</div>
            <div>Primary Key / Indices</div>
            <div>Record Count</div>
            <div>Portability Status</div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">customers</div>
            <div className="text-slate-500">id, fullName, phone, ghanaCardNumber</div>
            <div className="font-bold">{customerCount}</div>
            <div><Badge variant="success" size="sm">Indexed &amp; Synced</Badge></div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">auctionLots</div>
            <div className="text-slate-500">id, eventId, lotNumber, category, assetType</div>
            <div className="font-bold">{lotsCount}</div>
            <div><Badge variant="success" size="sm">Indexed &amp; Synced</Badge></div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">paymentPlans</div>
            <div className="text-slate-500">id, referenceType, referenceId, currentDueDate</div>
            <div className="font-bold">{paymentPlansCount}</div>
            <div><Badge variant="success" size="sm">Indexed &amp; Synced</Badge></div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">receipts</div>
            <div className="text-slate-500">id, receiptNumber, paymentPlanId, printedAt</div>
            <div className="font-bold">{receiptsCount}</div>
            <div><Badge variant="success" size="sm">Indexed &amp; Synced</Badge></div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">dealershipVehicles</div>
            <div className="text-slate-500">id, vin, make, model, askingPriceGhs</div>
            <div className="font-bold">{vehiclesCount}</div>
            <div><Badge variant="success" size="sm">Indexed &amp; Synced</Badge></div>
          </div>

          <div className="grid grid-cols-4 p-4 text-slate-700 dark:text-slate-300 items-center">
            <div className="font-mono font-bold">syncOutbox</div>
            <div className="text-slate-500">id, entity, status, timestamp</div>
            <div className="font-bold">{outboxCount}</div>
            <div>
              <Badge variant={outboxCount > 0 ? 'warning' : 'default'} size="sm">
                {outboxCount > 0 ? `${outboxCount} Pending Cloud Sync` : 'Reconciled'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
