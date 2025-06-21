import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ColorPicker from '../../components/ColorPicker';

// --- Types ---
type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
type CubeState = Record<Face, string[]>;
type Sticker = { color: string; orientation: number };
type Cubie = {
  position: [number, number, number];
  stickers: Partial<Record<Face, Sticker>>;
  mesh: THREE.Group | null;
};

const colors: { [key: string]: number } = { W: 0xffffff, Y: 0xffff00, O: 0xffa500, R: 0xff0000, G: 0x00ff00, B: 0x0000ff };

const Cube3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cubies, setCubies] = useState<Cubie[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('W');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [resetCounter, setResetCounter] = useState(0);
  const [solution, setSolution] = useState<string[]>([]);
  const [isSolving, setIsSolving] = useState(false);
  const [cubeRotation, setCubeRotation] = useState({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);

  // --- Initialize cubies ---
  useEffect(() => {
    const newCubies: Cubie[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          const stickers: Partial<Record<Face, Sticker>> = {};
          if (y === 1) stickers.U = { color: 'W', orientation: 0 };
          if (y === -1) stickers.D = { color: 'Y', orientation: 0 };
          if (x === -1) stickers.L = { color: 'O', orientation: 0 };
          if (x === 1) stickers.R = { color: 'R', orientation: 0 };
          if (z === 1) stickers.F = { color: 'G', orientation: 0 };
          if (z === -1) stickers.B = { color: 'B', orientation: 0 };
          newCubies.push({ position: [x, y, z], stickers, mesh: null });
        }
      }
    }
    setCubies(newCubies);
  }, [resetCounter]);

  // --- Three.js setup ---
  useEffect(() => {
    if (!mountRef.current) return;
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    const width = 500, height = 500;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);
    
    // --- Create cubies ---
    cubies.forEach((cubie) => {
      const [x, y, z] = cubie.position;
      const piece = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
      );
      piece.add(body);
      (Object.entries(cubie.stickers) as [Face, Sticker][]).forEach(([face, stickerObj]) => {
        let stickerGeometry, stickerMaterial, pos, rotAxis;
        stickerMaterial = new THREE.MeshPhongMaterial({ color: colors[stickerObj.color] ?? 0x000000 });
        if (face === 'U') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [0, 0.505, 0];
          rotAxis = new THREE.Vector3(1, 0, 0);
        } else if (face === 'D') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [0, -0.505, 0];
          rotAxis = new THREE.Vector3(1, 0, 0);
        } else if (face === 'L') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [-0.505, 0, 0];
          rotAxis = new THREE.Vector3(0, 1, 0);
        } else if (face === 'R') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [0.505, 0, 0];
          rotAxis = new THREE.Vector3(0, 1, 0);
        } else if (face === 'F') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [0, 0, 0.505];
          rotAxis = new THREE.Vector3(0, 0, 1);
        } else if (face === 'B') {
          stickerGeometry = new THREE.BoxGeometry(0.9, 0.9, 0.01);
          pos = [0, 0, -0.505];
          rotAxis = new THREE.Vector3(0, 0, 1);
        }
        if (stickerGeometry && pos) {
          const sticker = new THREE.Mesh(stickerGeometry, stickerMaterial);
          sticker.position.set(pos[0], pos[1], pos[2]);
          // Orient sticker to face outwards
          if (face === 'U') sticker.rotation.x = -Math.PI / 2;
          if (face === 'D') sticker.rotation.x = Math.PI / 2;
          if (face === 'L') sticker.rotation.y = Math.PI / 2;
          if (face === 'R') sticker.rotation.y = -Math.PI / 2;
          if (face === 'B') sticker.rotation.y = Math.PI;
          piece.add(sticker);
        }
      });
      piece.position.set(x * 1.05, y * 1.05, z * 1.05);
      cubie.mesh = piece;
      cubeGroup.add(piece);
    });
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
    // --- Animation loop ---
    const animate = () => {
      requestAnimationFrame(animate);
      if (cubeGroup) {
        cubeGroup.rotation.x += (targetRotation.current.x - cubeGroup.rotation.x) * 0.2;
        cubeGroup.rotation.y += (targetRotation.current.y - cubeGroup.rotation.y) * 0.2;
      }
      renderer.render(scene, camera);
    };
    animate();
    // --- Cleanup ---
    return () => {
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [cubies]);

  // --- UI Controls ---
  const rotateLeft = () => { targetRotation.current.y -= Math.PI / 2; setCubeRotation((rot) => ({ ...rot, y: rot.y - Math.PI / 2 })); };
  const rotateRight = () => { targetRotation.current.y += Math.PI / 2; setCubeRotation((rot) => ({ ...rot, y: rot.y + Math.PI / 2 })); };
  const rotateUp = () => { targetRotation.current.x -= Math.PI / 2; setCubeRotation((rot) => ({ ...rot, x: rot.x - Math.PI / 2 })); };
  const rotateDown = () => { targetRotation.current.x += Math.PI / 2; setCubeRotation((rot) => ({ ...rot, x: rot.x + Math.PI / 2 })); };

  // --- Color Picker ---
  const handleStickerColor = (face: Face, idx: number) => {
    setCubies((prev) => prev.map((cubie) => {
      if (cubie.stickers[face]) {
        return {
          ...cubie,
          stickers: {
            ...cubie.stickers,
            [face]: { color: selectedColor, orientation: cubie.stickers[face]?.orientation ?? 0 },
          },
        };
      }
      return cubie;
    }));
  };

  // --- Reset ---
  const handleReset = () => { setResetCounter((c) => c + 1); setMoveHistory([]); setSolution([]); };

  // --- Randomize ---
  const allMoves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
  const handleRandomize = () => {
    for (let i = 0; i < 20; i++) {
      const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      handleMove(randomMove);
    }
    setSolution([]);
  };

  // --- Undo ---
  const handleUndo = () => { 
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      const inverseMove = getInverseMove(lastMove);
      setMoveHistory(prev => prev.slice(0, -1));
      handleMove(inverseMove);
    }
  };

  // --- Helper function to get inverse move ---
  const getInverseMove = (move: string): string => {
    if (move.includes("'")) return move.replace("'", "");
    if (move.includes('2')) return move;
    return move + "'";
  };

  // --- Move logic for each face ---
  function rotateFace(face: Face, prime = false, double = false) {
    const angle = double ? Math.PI : (prime ? -Math.PI / 2 : Math.PI / 2);
    
    setCubies(prevCubies => {
      const newCubies = [...prevCubies];
      
      // Find cubies that belong to the face being rotated
      const faceCubies = newCubies.filter(cubie => {
        const [x, y, z] = cubie.position;
        switch (face) {
          case 'U': return y === 1;
          case 'D': return y === -1;
          case 'L': return x === -1;
          case 'R': return x === 1;
          case 'F': return z === 1;
          case 'B': return z === -1;
          default: return false;
        }
      });

      // Rotate the cubies
      faceCubies.forEach(cubie => {
        const [x, y, z] = cubie.position;
        let newX = x, newY = y, newZ = z;
        
        // Calculate new position after rotation
        switch (face) {
          case 'U':
            if (prime) {
              newX = -z;
              newZ = x;
            } else {
              newX = z;
              newZ = -x;
            }
            break;
          case 'D':
            if (prime) {
              newX = z;
              newZ = -x;
            } else {
              newX = -z;
              newZ = x;
            }
            break;
          case 'L':
            if (prime) {
              newY = z;
              newZ = -y;
            } else {
              newY = -z;
              newZ = y;
            }
            break;
          case 'R':
            if (prime) {
              newY = -z;
              newZ = y;
            } else {
              newY = z;
              newZ = -y;
            }
            break;
          case 'F':
            if (prime) {
              newX = -y;
              newY = x;
            } else {
              newX = y;
              newY = -x;
            }
            break;
          case 'B':
            if (prime) {
              newX = y;
              newY = -x;
            } else {
              newX = -y;
              newY = x;
            }
            break;
        }

        // Update position
        cubie.position = [newX, newY, newZ];
        
        // Update stickers
        const newStickers: Partial<Record<Face, Sticker>> = {};
        Object.entries(cubie.stickers).forEach(([stickerFace, sticker]) => {
          let newFace = stickerFace as Face;
          
          // Only rotate stickers that are not on the face being rotated
          if (stickerFace !== face) {
            // Rotate sticker faces based on the face being rotated
            if (face === 'U') {
              if (stickerFace === 'F') newFace = prime ? 'L' : 'R';
              else if (stickerFace === 'R') newFace = prime ? 'B' : 'F';
              else if (stickerFace === 'B') newFace = prime ? 'R' : 'L';
              else if (stickerFace === 'L') newFace = prime ? 'F' : 'B';
            } else if (face === 'D') {
              if (stickerFace === 'F') newFace = prime ? 'R' : 'L';
              else if (stickerFace === 'R') newFace = prime ? 'F' : 'B';
              else if (stickerFace === 'B') newFace = prime ? 'L' : 'R';
              else if (stickerFace === 'L') newFace = prime ? 'B' : 'F';
            } else if (face === 'L') {
              if (stickerFace === 'U') newFace = prime ? 'B' : 'F';
              else if (stickerFace === 'F') newFace = prime ? 'U' : 'D';
              else if (stickerFace === 'D') newFace = prime ? 'F' : 'B';
              else if (stickerFace === 'B') newFace = prime ? 'D' : 'U';
            } else if (face === 'R') {
              if (stickerFace === 'U') newFace = prime ? 'F' : 'B';
              else if (stickerFace === 'F') newFace = prime ? 'D' : 'U';
              else if (stickerFace === 'D') newFace = prime ? 'B' : 'F';
              else if (stickerFace === 'B') newFace = prime ? 'U' : 'D';
            } else if (face === 'F') {
              if (stickerFace === 'U') newFace = prime ? 'R' : 'L';
              else if (stickerFace === 'R') newFace = prime ? 'U' : 'D';
              else if (stickerFace === 'D') newFace = prime ? 'L' : 'R';
              else if (stickerFace === 'L') newFace = prime ? 'D' : 'U';
            } else if (face === 'B') {
              if (stickerFace === 'U') newFace = prime ? 'L' : 'R';
              else if (stickerFace === 'R') newFace = prime ? 'D' : 'U';
              else if (stickerFace === 'D') newFace = prime ? 'R' : 'L';
              else if (stickerFace === 'L') newFace = prime ? 'U' : 'D';
            }
          }
          
          newStickers[newFace] = sticker;
        });
        
        cubie.stickers = newStickers;
        
        // Update mesh position and rotation
        if (cubie.mesh) {
          cubie.mesh.position.set(newX * 1.05, newY * 1.05, newZ * 1.05);
          
          // Rotate the mesh
          const rotationMatrix = new THREE.Matrix4();
          const rotationAxis = new THREE.Vector3();
          
          switch (face) {
            case 'U':
            case 'D':
              rotationAxis.set(0, 1, 0);
              break;
            case 'L':
            case 'R':
              rotationAxis.set(1, 0, 0);
              break;
            case 'F':
            case 'B':
              rotationAxis.set(0, 0, 1);
              break;
          }
          
          rotationMatrix.makeRotationAxis(rotationAxis, angle);
          cubie.mesh.applyMatrix4(rotationMatrix);
          cubie.mesh.matrix.identity();
        }
      });
      
      return newCubies;
    });
  }

  const handleMove = (move: string) => {
    // Parse move string
    let face = move[0] as Face;
    let prime = move.includes("'");
    let double = move.includes('2');
    
    // Add to move history
    setMoveHistory(prev => [...prev, move]);
    
    // Execute the move
    rotateFace(face, prime, double);
  };

  // --- Solve button logic (dummy solution) ---
  const handleSolve = async () => {
    setIsSolving(true);
    setSolution([]);
    // Dummy solution (replace with real backend call if needed)
    const dummySolution = ['U', "R'", 'F2', 'D', 'L', 'B2'];
    setSolution(dummySolution);
    // Animate/apply the solution moves
    for (const move of dummySolution) {
      await new Promise((res) => setTimeout(res, 300));
      handleMove(move);
    }
    setIsSolving(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] w-full bg-black">
      <div className="flex flex-row items-center justify-center p-8 w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center mr-8">
          <ColorPicker onSelectColor={setSelectedColor} />
          <div className="flex flex-col items-center justify-center mt-8">
            <button onClick={rotateUp} className="p-2 mb-2 rounded-full bg-gray-800 hover:bg-gray-600 shadow transition-colors">↑</button>
            <div className="flex flex-row items-center space-x-2">
              <button onClick={rotateLeft} className="p-2 rounded-full bg-gray-800 hover:bg-gray-600 shadow transition-colors">←</button>
              <button onClick={rotateRight} className="p-2 rounded-full bg-gray-800 hover:bg-gray-600 shadow transition-colors">→</button>
            </div>
            <button onClick={rotateDown} className="p-2 mt-2 rounded-full bg-gray-800 hover:bg-gray-600 shadow transition-colors">↓</button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div ref={mountRef} style={{ width: 500, height: 500, background: 'transparent', boxShadow: 'none' }} />
        </div>
        <div className="flex flex-col items-center justify-center ml-8">
          {/* Move controls grid */}
          <div className="grid grid-cols-3 gap-1 mb-6 w-full max-w-xs">
            {allMoves.map((move) => (
              <button
                key={move}
                onClick={() => handleMove(move)}
                className="py-1 px-2 rounded bg-gray-800 hover:bg-gray-700 text-white font-bold shadow transition-colors text-base"
                style={{ minWidth: 36 }}
              >
                {move}
              </button>
            ))}
          </div>
          <div className="flex flex-row items-center justify-center space-x-4 w-full">
            <button onClick={handleSolve} disabled={isSolving} className="py-2 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow transition-colors disabled:opacity-60">{isSolving ? 'Solving...' : 'Solve'}</button>
            <button onClick={handleReset} className="py-2 px-6 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-bold shadow transition-colors">Reset</button>
            <button onClick={handleRandomize} className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow transition-colors">Randomize</button>
            <button onClick={handleUndo} className="py-2 px-6 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow transition-colors">Undo</button>
          </div>
          {/* Solution display */}
          <div className="mt-6 w-full text-center text-white text-lg font-mono min-h-[2rem]">
            {solution.length > 0 && (
              <span>Solution: {solution.join(' ')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cube3D;