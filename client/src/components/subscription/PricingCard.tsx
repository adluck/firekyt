import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  tier: string;
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

export function PricingCard({
  tier,
  title,
  price,
  description,
  features,
  popular = false,
  current = false,
  onSelect,
  isLoading = false,
}: PricingCardProps) {
  const getIcon = () => {
    switch (tier) {
      case 'basic':
        return <Zap className="h-5 w-5" />;
      case 'pro':
        return <Star className="h-5 w-5" />;
      case 'agency':
        return <Crown className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTierClass = () => {
    switch (tier) {
      case 'basic':
        return 'tier-basic';
      case 'pro':
        return 'tier-pro';
      case 'agency':
        return 'tier-agency';
      default:
        return 'tier-free';
    }
  };

  return (
    <Card className={cn(
      "relative card-hover",
      getTierClass(),
      popular && "ring-2 ring-primary ring-offset-2",
      current && "bg-muted/50"
    )}>
      {popular && (
        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 gradient-bg text-white">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getIcon()}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <div className="text-3xl font-bold text-primary">{price}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <Button
          className={cn(
            "w-full",
            popular && "btn-gradient",
            current && "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          onClick={onSelect}
          disabled={current || isLoading}
        >
          {current ? "Current Plan" : isLoading ? "Processing..." : "Get Started"}
        </Button>
      </CardContent>
    </Card>
  );
}
