'use client';

import type { ProcessedTariff } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';

interface CostVisualizationProps {
  tariffs: ProcessedTariff[];
}

export default function CostVisualization({ tariffs }: CostVisualizationProps) {
  const chartData = tariffs
    .slice(0, 5)
    .map(t => ({
      name: t.tariffName,
      cost: parseFloat(t.annualCost.toFixed(2)),
    }))
    .reverse();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Annual Cost Comparison</CardTitle>
        <CardDescription>Estimated costs for the top 5 plans.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          cost: {
            label: "Annual Cost",
            color: "hsl(var(--chart-1))",
          },
        }} className="h-[250px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 40 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              width={100}
            />
            <XAxis dataKey="cost" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                labelFormatter={(value, payload) => payload?.[0]?.payload.name}
                formatter={(value) => `$${value}`}
                indicator="dot" 
              />}
            />
            <Bar dataKey="cost" fill="var(--color-cost)" radius={5}>
              <LabelList
                dataKey="cost"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `$${value}`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
