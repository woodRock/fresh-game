// components/UI/Minimap.tsx
import { h } from 'preact';
import { FaceName } from "../../utils/FaceUtils.ts";
import { Colors } from "../../config/Colors.ts";

interface CubeFaceVisits {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
  front: boolean;
  back: boolean;
}

interface MinimapProps {
  currentFace: FaceName;
  visitedFaces: CubeFaceVisits;
  playerDirection?: string; // 'up', 'down', 'left', 'right'
}

export default function Minimap({ currentFace, visitedFaces, playerDirection = 'up' }: MinimapProps) {
  // Convert hex colors to CSS format
  const getFaceColorCSS = (face: FaceName, isCurrentFace: boolean): string => {
    if (!Colors.faces) return '#555555';
    
    // Get hex color for the face
    const hexColor = Colors.faces[face];
    if (!hexColor) return '#555555';
    
    // Convert to CSS color
    const hexString = hexColor.toString(16).padStart(6, '0');
    const baseColor = `#${hexString}`;
    
    // Darken or keep as is based on whether it's visited
    if (!visitedFaces[face]) {
      return "rgba(50, 50, 50, 0.8)"; // Dim gray for unvisited
    }
    
    // Highlight current face
    if (isCurrentFace) {
      return baseColor; // Full brightness for current face
    }
    
    // Slightly darker for visited but not current
    return baseColor;
  };

  // Size settings for the minimap
  const mapSize = 140;
  const faceSize = 36;
  const borderWidth = 2;

  // Layout based on the current face
  // We'll place the current face in the center and arrange others around it
  const getMinimapLayout = () => {
    // Default arrangement for front face
    let layout = {
      top: { top: 0, left: faceSize + borderWidth },
      bottom: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
      left: { top: faceSize + borderWidth, left: 0 },
      right: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
      front: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
      back: { top: faceSize + borderWidth, left: 3 * (faceSize + borderWidth) },
    };

    // Rearrange based on current face
    if (currentFace !== "front") {
      switch (currentFace) {
        case "back":
          layout = {
            top: { top: 0, left: faceSize + borderWidth },
            bottom: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
            left: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
            right: { top: faceSize + borderWidth, left: 0 },
            front: { top: faceSize + borderWidth, left: 3 * (faceSize + borderWidth) },
            back: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
          };
          break;
        case "left":
          layout = {
            top: { top: 0, left: faceSize + borderWidth },
            bottom: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
            left: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
            right: { top: faceSize + borderWidth, left: 3 * (faceSize + borderWidth) },
            front: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
            back: { top: faceSize + borderWidth, left: 0 },
          };
          break;
        case "right":
          layout = {
            top: { top: 0, left: faceSize + borderWidth },
            bottom: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
            left: { top: faceSize + borderWidth, left: 3 * (faceSize + borderWidth) },
            right: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
            front: { top: faceSize + borderWidth, left: 0 },
            back: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
          };
          break;
        case "top":
          layout = {
            top: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
            bottom: { top: 3 * (faceSize + borderWidth), left: faceSize + borderWidth },
            left: { top: faceSize + borderWidth, left: 0 },
            right: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
            front: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
            back: { top: 0, left: faceSize + borderWidth },
          };
          break;
        case "bottom":
          layout = {
            top: { top: 0, left: faceSize + borderWidth },
            bottom: { top: faceSize + borderWidth, left: faceSize + borderWidth }, // center
            left: { top: faceSize + borderWidth, left: 0 },
            right: { top: faceSize + borderWidth, left: 2 * (faceSize + borderWidth) },
            front: { top: 0, left: faceSize + borderWidth },
            back: { top: 2 * (faceSize + borderWidth), left: faceSize + borderWidth },
          };
          break;
      }
    }

    return layout;
  };

  const layout = getMinimapLayout();
  
  // Get current face position
  const currentFacePos = layout[currentFace];
  
  // Direction arrow positioning
  const arrowSize = 20;
  
  // Get arrow direction transformations
  const getArrowTransform = (direction: string) => {
    switch(direction) {
      case 'up': return 'rotate(0deg)';
      case 'right': return 'rotate(90deg)';
      case 'down': return 'rotate(180deg)';
      case 'left': return 'rotate(-90deg)';
      default: return 'rotate(0deg)';
    }
  };

  // Generate the faces of the minimap
  const renderFaces = () => {
    return Object.keys(layout).map((face) => {
      const isCurrent = face === currentFace;
      const facePos = layout[face as FaceName];
      
      return (
        <div
          key={face}
          style={{
            position: "absolute",
            top: `${facePos.top}px`,
            left: `${facePos.left}px`,
            width: `${faceSize}px`,
            height: `${faceSize}px`,
            backgroundColor: getFaceColorCSS(face as FaceName, isCurrent),
            border: isCurrent ? `${borderWidth}px solid white` : `${borderWidth}px solid black`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "10px",
            color: isCurrent ? "white" : "#ddd",
            fontWeight: "bold",
            textShadow: "1px 1px 1px rgba(0, 0, 0, 0.5)",
            boxSizing: "border-box",
          }}
        >
          {face.toUpperCase()}
          
          {/* Show arrow only on current face */}
          {isCurrent && (
            <div style={{
              position: "absolute",
              width: "0", 
              height: "0",
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "16px solid red",
              top: "4px",
              transform: getArrowTransform(playerDirection),
              transformOrigin: "center center"
            }} />
          )}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        width: `${mapSize}px`,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        borderRadius: "5px",
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ 
        color: "white", 
        fontSize: "12px", 
        fontWeight: "bold", 
        textAlign: "center",
        marginBottom: "5px"
      }}>
        Faces Visited: {Object.values(visitedFaces).filter(Boolean).length}/6
      </div>
      
      <div style={{ 
        position: "relative", 
        width: "100%", 
        height: `${3 * faceSize + 2 * borderWidth}px`
      }}>
        {renderFaces()}
      </div>
    </div>
  );
}