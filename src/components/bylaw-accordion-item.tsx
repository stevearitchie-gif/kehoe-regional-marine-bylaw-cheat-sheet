import type { ElementType, ReactNode } from 'react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Bylaw } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { format } from 'date-fns';
import { MapPin, Building, Mail, User, Info, FileText, Shield } from 'lucide-react';

type BylawAccordionItemProps = {
  record: Bylaw;
};

const cleanText = (value?: string | null) => {
  const cleaned = String(value ?? '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const cleanLink = (value?: string | null) => {
  const cleaned = String(value ?? '').trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value?: ReactNode;
}) => {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === false
  ) {
    return null;
  }

  return (
    <div className="flex items-start text-sm">
      <Icon className="h-4 w-4 mt-0.5 mr-3 text-muted-foreground flex-shrink-0" />
      <div className="flex flex-col">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="text-foreground break-words">{value}</span>
      </div>
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <div className="mt-6 pt-4 border-t first:mt-0 first:pt-0 first:border-t-0">
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
        {children}
      </div>
    </div>
  );
};

const booleanToYesNo = (value?: boolean) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return undefined;
};

const SourceLinkValue = ({ href }: { href?: string }) => {
  const cleanedHref = cleanLink(href);
  if (!cleanedHref) return null;

  return (
    <a
      href={cleanedHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      Open source
    </a>
  );
};

export function BylawAccordionItem({ record }: BylawAccordionItemProps) {
  let formattedDate: string | null = null;
  let formattedSourceCheck: string | null = null;

  if (record.lastVerified) {
    const date = new Date(record.lastVerified);
    if (!isNaN(date.getTime())) {
      formattedDate = format(date, 'MMMM d, yyyy');
    }
  }

  if (record.lastSourceCheck) {
    const sourceCheckDate = new Date(record.lastSourceCheck);
    if (!isNaN(sourceCheckDate.getTime())) {
      formattedSourceCheck = format(sourceCheckDate, 'MMMM d, yyyy h:mm a');
    }
  }

  const municipalSourceLink = cleanLink(record.sourceLink);
  const parksCanadaSourceLink = cleanLink(record.parksCanadaSourceLink);
  const conservationAuthoritySourceLink = cleanLink(record.conservationAuthoritySourceLink);
  const mnrSourceLink = cleanLink(record.mnrSourceLink);

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
        <div className="pt-4 border-t">
          <Section title="Municipality">
            <DetailItem icon={MapPin} label="Municipality" value={cleanText(record.municipality)} />
            <DetailItem icon={Building} label="Region" value={cleanText(record.region)} />
            <DetailItem icon={Info} label="Area Regulation" value={cleanText(record.areaRegulation)} />
            <DetailItem icon={Info} label="Perimeter Regulation" value={cleanText(record.perimeterRegulation)} />
            <DetailItem icon={Info} label="Width Regulation" value={cleanText(record.widthRegulation)} />
            <DetailItem icon={Info} label="Length Regulation" value={cleanText(record.lengthRegulation)} />
            <DetailItem icon={Info} label="Side Lot Setback" value={cleanText(record.sideLotSetback)} />
            <DetailItem icon={Info} label="Lot Line Projection" value={cleanText(record.lotLineProjection)} />
            <DetailItem icon={Info} label="Height Limit" value={cleanText(record.heightLimit)} />
            <DetailItem icon={FileText} label="Permit Requirements" value={cleanText(record.permitRequirements)} />
            <DetailItem
              icon={FileText}
              label="Municipal Source Link"
              value={municipalSourceLink ? <SourceLinkValue href={municipalSourceLink} /> : undefined}
            />
            <DetailItem icon={FileText} label="Municipal Source Section" value={cleanText(record.sourceSection)} />
          </Section>

          <Section title="Parks Canada">
            <DetailItem icon={Shield} label="Parks Canada Applies" value={booleanToYesNo(record.parksCanadaApplies)} />
            <DetailItem icon={FileText} label="Parks Canada Rules" value={cleanText(record.parksCanadaRules)} />
            <DetailItem
              icon={FileText}
              label="Parks Canada Source Link"
              value={parksCanadaSourceLink ? <SourceLinkValue href={parksCanadaSourceLink} /> : undefined}
            />
            <DetailItem icon={FileText} label="Parks Canada Source Section" value={cleanText(record.parksCanadaSourceSection)} />
          </Section>

          <Section title="Conservation Authority">
            <DetailItem icon={Building} label="Conservation Authority" value={cleanText(record.conservationAuthority)} />
            <DetailItem icon={FileText} label="Conservation Authority Rules" value={cleanText(record.conservationAuthorityRules)} />
            <DetailItem
              icon={FileText}
              label="Conservation Authority Source Link"
              value={
                conservationAuthoritySourceLink
                  ? <SourceLinkValue href={conservationAuthoritySourceLink} />
                  : undefined
              }
            />
            <DetailItem
              icon={FileText}
              label="Conservation Authority Source Section"
              value={cleanText(record.conservationAuthoritySourceSection)}
            />
          </Section>

          <Section title="MNR">
            <DetailItem icon={Shield} label="MNR Applies" value={booleanToYesNo(record.mnrApplies)} />
            <DetailItem icon={FileText} label="MNR Rules" value={cleanText(record.mnrRules)} />
            <DetailItem
              icon={FileText}
              label="MNR Source Link"
              value={mnrSourceLink ? <SourceLinkValue href={mnrSourceLink} /> : undefined}
            />
            <DetailItem icon={FileText} label="MNR Source Section" value={cleanText(record.mnrSourceSection)} />
          </Section>

          <Section title="General Notes">
            <DetailItem icon={Info} label="Authority General Notes" value={cleanText(record.authorityGeneralNotes)} />
            <DetailItem icon={User} label="Contact Name" value={cleanText(record.contactName)} />
            <DetailItem icon={Mail} label="Contact Method" value={cleanText(record.contactMethod)} />
            <DetailItem icon={User} label="Last Verified" value={formattedDate} />
            <DetailItem icon={User} label="Last Source Check" value={formattedSourceCheck ?? "Not entered"} />
          </Section>

          {cleanText(record.notes) && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-sm mb-2">Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cleanText(record.notes)}</p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
