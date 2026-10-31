import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}
const cardVariants = {
  default: "border border-slate-200 bg-white shadow-sm",
  outlined: "border border-slate-200 bg-white",
  elevated: "border border-slate-100 bg-white shadow-md shadow-slate-200/50",
  interactive: "border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
};
const paddingStyles = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };

export function Card({ variant = "default", padding = "none", className = "", ...props }: CardProps) {
  return <div className={`rounded-xl ${cardVariants[variant]} ${paddingStyles[padding]} ${className}`} {...props} />;
}
export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-1.5 px-5 pb-4 pt-5 ${className}`} {...props} />;
}
export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-base font-semibold tracking-tight text-slate-900 ${className}`} {...props} />;
}
export function CardDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm leading-5 text-slate-500 ${className}`} {...props} />;
}
export function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 pb-5 ${className}`} {...props} />;
}
export function CardFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center border-t border-slate-100 px-5 py-4 ${className}`} {...props} />;
}
