interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);
  return items.map((i) => (
    <div
      key={i}
      className={`animate-skeleton rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] ${className}`}
    />
  ));
}
