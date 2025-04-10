// components/UI/FaceIndicator.tsx
import { h } from 'preact';
import { FaceName } from '../../utils/FaceUtils.ts';

interface FaceIndicatorProps {
  face: FaceName;
}

export default function FaceIndicator({ face }: FaceIndicatorProps) {
  return (
    <p>Current face: <span>{face}</span></p>
  );
}
