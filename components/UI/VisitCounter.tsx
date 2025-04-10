// components/UI/VisitCounter.tsx (continued)
import { h } from 'preact';

interface VisitCounterProps {
  count: number;
  total: number;
}

export default function VisitCounter({ count, total }: VisitCounterProps) {
  return (
    <p>Faces visited: <span>{count}</span>/{total}</p>
  );
}
