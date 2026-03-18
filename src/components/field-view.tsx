
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion } from '@/components/ui/accordion';
import type { Bylaw } from '@/lib/types';
import { BylawAccordionItem } from './bylaw-accordion-item';
import { Search, MapPin, Building } from 'lucide-react';

export function FieldView({ records }: { records: Bylaw[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [authorityFilter, setAuthorityFilter] = useState('all');

  const regions = useMemo(() => [...new Set(records.map((r) => r.region).filter(Boolean))].sort(), [records]);
  const authorities = useMemo(() => [...new Set(records.map((r) => r.conservationAuthority).filter(Boolean))].sort(), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        record.municipality.toLowerCase().includes(searchLower) ||
        record.region.toLowerCase().includes(searchLower) ||
        (record.contactName && record.contactName.toLowerCase().includes(searchLower)) ||
        (record.notes && record.notes.toLowerCase().includes(searchLower));

      const matchesRegion = regionFilter === 'all' || record.region === regionFilter;
      const matchesAuthority = authorityFilter === 'all' || record.conservationAuthority === authorityFilter;

      return matchesSearch && matchesRegion && matchesAuthority;
    });
  }, [records, searchTerm, regionFilter, authorityFilter]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by municipality, region, contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base"
          />
        </div>
        <div className="relative flex items-center">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="pl-10 text-base w-full">
                    <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                        {region}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="relative flex items-center">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Select value={authorityFilter} onValueChange={setAuthorityFilter}>
                <SelectTrigger className="pl-10 text-base w-full">
                    <SelectValue placeholder="Filter by authority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Authorities</SelectItem>
                    {authorities.map((authority) => (
                    <SelectItem key={authority} value={authority}>
                        {authority}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      {filteredRecords.length > 0 ? (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {filteredRecords.map((record) => (
            <BylawAccordionItem key={record.id} record={record} />
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Records Found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
