// components/UI/GameUI.tsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { FaceName } from '../../utils/FaceUtils.ts';
import FaceIndicator from './FaceIndicator.tsx';
import VisitCounter from './VisitCounter.tsx';

interface GameUIProps {
  currentFace: FaceName;
  visitCount: number;
}

export default function GameUI({ currentFace, visitCount }: GameUIProps) {
  return (
    <div style={{ 
      position: "absolute", 
      top: "20px", 
      left: "20px", 
      color: "white", 
      fontFamily: "sans-serif", 
      backgroundColor: "rgba(0,0,0,0.7)", 
      padding: "15px", 
      borderRadius: "5px", 
      maxWidth: "300px" 
    }}>
      <h1>Maze Cube Challenge</h1>
      <p>Navigate through the seamless maze across all 6 faces of the cube!</p>
      <p>Controls:</p>
      <ul>
        <li>WASD: Move the player</li>
        <li>Space: Jump (to avoid obstacles)</li>
        <li>Click and drag: Rotate the cube for a better view</li>
        <li>R: Toggle cube rotation</li>
      </ul>
      <FaceIndicator face={currentFace} />
      <VisitCounter count={visitCount} total={6} />
      <p><small>The maze continues across face boundaries - find paths to explore all faces!</small></p>
    </div>
  );
}