'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, MapPin, Sparkles, TrendingUp } from 'lucide-react';

const formSchema = z.object({
  location: z.string().min(2, { message: 'Please enter a valid location.' }),
  consumption: z.coerce.number().positive({ message: 'Consumption must be a positive number.' }),
});

interface TariffFormProps {
  onCompare: (data: UserData) => void;
  isLoading: boolean;
}

export default function TariffForm({ onCompare, isLoading }: TariffFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: '',
      consumption: 150,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onCompare(values);
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Find Your Perfect Energy Plan</CardTitle>
        <CardDescription>Enter your details below to get personalized tariff recommendations.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Location (e.g., City, ZIP code)</FormLabel>
                   <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="e.g., San Francisco" {...field} className="pl-9" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Monthly Consumption (kWh)</FormLabel>
                   <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" placeholder="e.g., 150" {...field} className="pl-9" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Compare Tariffs with AI
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
