'use client';

import Link from 'next/link';
import { ShieldCheck, MapPin, Phone, Mail, Gavel, Car, Building2, Newspaper, BookOpen } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-slate-100/90 text-slate-600 border-t border-slate-200 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
              AM
            </div>
            <div>
              <span className="text-base font-black text-slate-900 tracking-tight block">AMEN MART</span>
              <span className="text-[10px] font-bold text-indigo-700 tracking-wider uppercase block">Auctioning Services</span>
            </div>
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            A best and trusted name in Ghana&apos;s auction industry. Led by Managing Director <strong>Dr. Francis Kwaku Yeboah</strong>, delivering professional auction services across real estate, vehicles, industrial equipment, and collectibles.
          </p>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Approved by Auctioneers Registration Board &amp; Ministry of the Interior</span>
          </div>
        </div>

        {/* Col 2: Service Lines */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Service Lines</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/auctions?cat=JUDICIAL" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5 text-indigo-600" />
                <span>Judicial Court Auctions</span>
              </Link>
            </li>
            <li>
              <Link href="/auctions?cat=GOVERNMENT" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5 text-indigo-600" />
                <span>Government Fleet Disposals</span>
              </Link>
            </li>
            <li>
              <Link href="/showroom" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-indigo-600" />
                <span>Vehicle Showroom</span>
              </Link>
            </li>
            <li>
              <Link href="/land" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                <span>Titled Land Parcels</span>
              </Link>
            </li>
            <li>
              <Link href="/properties" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>Commercial &amp; Residential Realty</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Quick Links */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Company &amp; Auctions</h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/about" className="hover:text-indigo-600 transition-colors font-medium">
                About Amen Mart &amp; Leadership
              </Link>
            </li>
            <li>
              <Link href="/auctions" className="hover:text-indigo-600 transition-colors">
                Upcoming Live &amp; Online Auctions
              </Link>
            </li>
            <li>
              <Link href="/showroom" className="hover:text-indigo-600 transition-colors">
                Online Reservation Deposits
              </Link>
            </li>
            <li>
              <Link href="/news" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5 text-indigo-600" />
                <span>News &amp; Press Announcements</span>
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                <span>Auction &amp; Buyer Guides</span>
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                Bidder Registration &amp; KYC
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Ghana Head Office */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Office &amp; Yard</h4>
          <div className="space-y-1.5 text-xs text-slate-600">
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Gbawe, Flower Junction, Accra, Ghana</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>0548517277 / 0558314744</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>amenmart2291@gmail.com</span>
            </p>
            <p className="pt-2 text-[11px] text-slate-500">
              P. O. Box DC 1013, Dansoman, Accra — Ghana
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-200/60 py-4 px-6 text-center text-[11px] text-slate-500">
        &copy; 2026 Amen Mart Limited. All rights reserved. Developed by Dev Surge Infotech Ltd.
      </div>
    </footer>
  );
}

export default SiteFooter;
