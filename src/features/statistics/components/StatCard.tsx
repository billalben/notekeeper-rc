import type { ReactNode } from "react";

interface StatCardProps {
  span: 4 | 5 | 7 | 8 | 12;
  emphasized?: boolean;
  className?: string;
  title: string;
  children: ReactNode;
}

export const StatCard = ({
  span,
  emphasized,
  className,
  title,
  children,
}: StatCardProps) => (
  <section
    className={`stats-card stats-span-${span}${emphasized ? " emphasized" : ""}${
      className ? ` ${className}` : ""
    }`}
  >
    <h3 className="stats-card-title text-title-small">{title}</h3>
    {children}
  </section>
);
