import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: DashboardCardProps) {
  return (
    <Card className={cn("dashboard-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate pr-2">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs mt-2",
            trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {trend.positive ? (
              <TrendingUp className="h-3 w-3 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap">{trend.value}</span>
            <span className="text-muted-foreground whitespace-nowrap">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
