'use client';

import { useState, useMemo } from 'react';
import type { ProcessedTariff } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

type SortKey = keyof ProcessedTariff | 'annualCost';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const SortableHeader = ({
  children,
  columnKey,
  sortConfig,
  setSortConfig,
}: {
  children: React.ReactNode;
  columnKey: SortKey;
  sortConfig: SortConfig | null;
  setSortConfig: (config: SortConfig) => void;
}) => {
  const isSorted = sortConfig?.key === columnKey;
  const direction = isSorted ? sortConfig.direction : 'desc';

  const handleClick = () => {
    const newDirection = isSorted && direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: columnKey, direction: newDirection });
  };

  return (
    <TableHead>
      <Button variant="ghost" onClick={handleClick}>
        {children}
        <ArrowUpDown className={`ml-2 h-4 w-4 ${isSorted ? 'text-foreground' : 'text-muted-foreground'}`} />
      </Button>
    </TableHead>
  );
};

export default function TariffTable({ tariffs }: { tariffs: ProcessedTariff[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'annualCost', direction: 'asc' });

  const sortedTariffs = useMemo(() => {
    let sortableItems = [...tariffs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tariffs, sortConfig]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Full Tariff Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Tariff</TableHead>
                <SortableHeader columnKey="price" sortConfig={sortConfig} setSortConfig={setSortConfig}>
                  Price ($/kWh)
                </SortableHeader>
                <SortableHeader columnKey="annualCost" sortConfig={sortConfig} setSortConfig={setSortConfig}>
                  Est. Annual Cost
                </SortableHeader>
                <SortableHeader columnKey="contractLength" sortConfig={sortConfig} setSortConfig={setSortConfig}>
                  Contract (Months)
                </SortableHeader>
                <SortableHeader columnKey="renewableEnergyPercentage" sortConfig={sortConfig} setSortConfig={setSortConfig}>
                  Renewables (%)
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTariffs.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={tariff.providerLogoUrl}
                        alt={`${tariff.provider} logo`}
                        width={80}
                        height={26}
                        className="object-contain"
                        data-ai-hint="logo"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{tariff.tariffName}</TableCell>
                  <TableCell>${tariff.price.toFixed(3)}</TableCell>
                  <TableCell>${tariff.annualCost.toFixed(2)}</TableCell>
                  <TableCell>{tariff.contractLength}</TableCell>
                  <TableCell>
                    <Badge variant={tariff.renewableEnergyPercentage === 100 ? 'default' : 'secondary'}
                     className={tariff.renewableEnergyPercentage === 100 ? "bg-green-100 text-green-800" : ""}>
                      {tariff.renewableEnergyPercentage}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
