import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface ToolBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function ToolBreadcrumbs({ items }: ToolBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="w-full mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <li className="inline-flex items-center">
          <Link
            href="/"
            className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
