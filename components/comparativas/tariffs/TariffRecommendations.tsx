import type { Recommendation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Calendar, CheckCircle, FileText, Recycle, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TariffRecommendationsProps {
  recommendation: Recommendation;
}

const InfoPill = ({ icon, text, value }: { icon: React.ElementType, text: string, value: string | number }) => (
  <div className="flex flex-col gap-1 rounded-lg bg-secondary/50 p-3 text-center">
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      {React.createElement(icon, { className: "h-4 w-4" })}
      <span>{text}</span>
    </div>
    <span className="text-lg font-semibold text-foreground">{value}</span>
  </div>
);

export default function TariffRecommendations({ recommendation }: TariffRecommendationsProps) {
  return (
    <Card className="shadow-lg border-2 border-primary/50 animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader className="pb-4">
        <Badge className="w-fit bg-accent text-accent-foreground hover:bg-accent/80 mb-2">Best Match For You</Badge>
        <CardTitle className="text-3xl font-bold">{recommendation.tariffName}</CardTitle>
        <div className="flex items-center gap-4">
            <Image 
              src={recommendation.providerLogoUrl} 
              alt={`${recommendation.provider} logo`} 
              width={100} 
              height={30} 
              className="object-contain"
              data-ai-hint="logo"
            />
          <CardDescription className="text-lg">{recommendation.provider}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Plan Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoPill icon={Zap} text="Price" value={`$${recommendation.price}/kWh`} />
            <InfoPill icon={FileText} text="Annual Cost" value={`$${recommendation.annualCost.toFixed(2)}`} />
            <InfoPill icon={Calendar} text="Contract" value={`${recommendation.contractLength} mo.`} />
            <InfoPill icon={Recycle} text="Renewables" value={`${recommendation.renewableEnergyPercentage}%`} />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Why We Recommend This Plan</h3>
          <ul className="space-y-3">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-foreground/90">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
