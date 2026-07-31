interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);
  return items.map((i) => (
    <div
      key={i}
      className={`animate-skeleton rounded-[12px] bg-gradient-to-r from-brand-50 via-brand-100/50 to-brand-50 bg-[length:200%_100%] ${className}`}
    />
  ));
}
