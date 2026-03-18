
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Bylaw } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { format } from 'date-fns';
import { MapPin, Building, Phone, Mail, User, Info, FileText } from 'lucide-react';

type BylawAccordionItemProps = {
  record: Bylaw;
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) => {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm">
            <Icon className="h-4 w-4 mt-0.5 mr-3 text-muted-foreground flex-shrink-0" />
            <div className="flex flex-col">
                <span className="font-medium text-muted-foreground">{label}</span>
                <span className="text-foreground">{value}</span>
            </div>
        </div>
    );
};

export function BylawAccordionItem({ record }: BylawAccordionItemProps) {
  let formattedDate: string | null = null;
  if (record.lastVerified) {
    const date = new Date(record.lastVerified);
    if (!isNaN(date.getTime())) {
      formattedDate = format(date, 'MMMM d, yyyy');
    }
  }
  
  return (
    <AccordionItem value={record.id} className="bg-card border-b-0 rounded-lg shadow-sm overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline text-left">
        <div className="flex justify-between items-center w-full">
            <div className="flex-1">
                <h3 className="font-bold text-lg text-primary">{record.municipality}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    <span>{record.region}</span>
                    <span className="mx-2">|</span>
                    <Building className="h-4 w-4 mr-1.5" />
                    <span>{record.conservationAuthority}</span>
                </div>
            </div>
          <div className="ml-4 flex-shrink-0">
            <StatusBadge status={record.status} />
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 pt-4 border-t">
          <DetailItem icon={User} label="Contact Name" value={record.contactName} />
          <DetailItem icon={Mail} label="Contact Method" value={record.contactMethod} />
          <DetailItem icon={Info} label="Area Regulation" value={record.areaRegulation} />
          <DetailItem icon={Info} label="Perimeter Regulation" value={record.perimeterRegulation} />
          <DetailItem icon={Info} label="Width Regulation" value={record.widthRegulation} />
          <DetailItem icon={Info} label="Length Regulation" value={record.lengthRegulation} />
          <DetailItem icon={Info} label="Side Lot Setback" value={record.sideLotSetback} />
          <DetailItem icon={Info} label="Lot Line Projection" value={record.lotLineProjection} />
          <DetailItem icon={Info} label="Height Limit" value={record.heightLimit} />
          <DetailItem icon={FileText} label="Permit Requirements" value={record.permitRequirements} />
          <DetailItem 
            icon={User} 
            label="Last Verified" 
            value={formattedDate}
          />
        </div>
        {record.notes && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
