import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeywordEffectivenessRadar from "@/components/research/KeywordEffectivenessRadar";
import KeywordTrendSparkline from "@/components/research/KeywordTrendSparkline";

export default function KeywordAnalytics() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Keyword Analytics</h1>
          <p className="text-muted-foreground">
            Advanced keyword analysis with visual insights and trend tracking
          </p>
        </div>
      </div>

      <Tabs defaultValue="radar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="radar">Effectiveness Radar</TabsTrigger>
          <TabsTrigger value="trends">Trend Sparklines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="radar" className="space-y-6">
          <KeywordEffectivenessRadar />
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <KeywordTrendSparkline />
        </TabsContent>
      </Tabs>
    </div>
  );
}