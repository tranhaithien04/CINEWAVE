import { AlertCircle, Clapperboard, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-dashed shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <Clapperboard className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="rounded-2xl border-destructive/40 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
