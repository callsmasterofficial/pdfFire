import { ToolSeoData } from "./types";
import { ORGANIZE_SEO_DATA } from "./data-organize";
import { CONVERT_SEO_DATA } from "./data-convert";
import { AUTHORING_SEO_DATA } from "./data-authoring";
import { EDIT_SEO_DATA } from "./data-edit";
import { SECURITY_SEO_DATA } from "./data-security";
import { ADVANCED_SEO_DATA } from "./data-advanced";

export const ALL_TOOLS_SEO_DATA: ToolSeoData[] = [
  ...ORGANIZE_SEO_DATA,
  ...CONVERT_SEO_DATA,
  ...AUTHORING_SEO_DATA,
  ...EDIT_SEO_DATA,
  ...SECURITY_SEO_DATA,
  ...ADVANCED_SEO_DATA,
];

const SEO_DATA_MAP = new Map<string, ToolSeoData>(
  ALL_TOOLS_SEO_DATA.map((item) => [item.id, item])
);

export function getToolSeoData(id: string): ToolSeoData | undefined {
  return SEO_DATA_MAP.get(id);
}

export function getAllToolSeoData(): ToolSeoData[] {
  return ALL_TOOLS_SEO_DATA;
}

export function getRelatedTools(toolId: string): ToolSeoData[] {
  const current = getToolSeoData(toolId);
  if (!current || !current.relatedToolIds) return [];
  return current.relatedToolIds
    .map((id) => getToolSeoData(id))
    .filter((tool): tool is ToolSeoData => !!tool);
}
