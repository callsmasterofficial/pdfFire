import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  badge?: string;
  isAvailable?: boolean;
}

import Link from "next/link";

export function ToolCard({
  id,
  title,
  description,
  category,
  icon: Icon,
  badge,
  isAvailable = true,
}: ToolCardProps) {
  const cardContent = (
    <Card
      suppressHydrationWarning
      className="group relative flex flex-col justify-between overflow-hidden border border-border bg-surface hover:border-primary/40 hover:shadow-xs transition-all duration-200 h-full"
    >
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="size-9 sm:size-10 rounded-lg bg-surface-secondary text-primary border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
            <Icon className="size-4 sm:size-5" />
          </div>
          {badge && (
            <Badge variant={isAvailable ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm sm:text-base font-semibold group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/50">
          <span className="font-mono uppercase">{category}</span>
          <span className="text-primary font-medium group-hover:underline">
            {isAvailable ? "Open Tool" : "Planned"} →
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (isAvailable) {
    return (
      <Link
        href={`/tool/${id}`}
        prefetch={false}
        suppressHydrationWarning
        className="block focus:outline-hidden focus:ring-2 focus:ring-primary/40 rounded-xl"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
