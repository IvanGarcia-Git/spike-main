'use client';

import type { ProcessedTariff } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';

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
          <LineChart
            data={chartData}
            margin={{ left: 10, right: 40, top: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              dataKey="cost"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                labelFormatter={(value, payload) => payload?.[0]?.payload.name}
                formatter={(value) => `$${value}`}
                indicator="dot"
              />}
            />
            <Line
              dataKey="cost"
              stroke="var(--color-cost)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-cost)" }}
              activeDot={{ r: 6 }}
            >
              <LabelList
                dataKey="cost"
                position="top"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `$${value}`}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
