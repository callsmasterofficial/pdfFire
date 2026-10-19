export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolSeoData {
  id: string;
  title: string;
  metaDescription: string;
  h1: string;
  category: string;
  primaryIntent: string;
  secondaryKeywords: string[];
  instructions: {
    step: number;
    title: string;
    description: string;
  }[];
  features: string[];
  limitations: string[];
  faqs: ToolFaq[];
  relatedToolIds: string[];
}
