import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelSceneProps {
  modelUrl: string;
  filename: string;
  onLoad?: () => void;
}

function Model({ url, filename }: { url: string; filename: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [loaded, setLoaded] = useState(false);
  const ext = filename.split('.').pop()?.toLowerCase();
  
  useEffect(() => {
    let cancelled = false;
    
    const loadModel = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch model');
        const buffer = await response.arrayBuffer();
        
        if (cancelled) return;
        
        let object: THREE.Object3D | null = null;
        
        if (ext === 'obj') {
          const loader = new OBJLoader();
          const text = new TextDecoder().decode(buffer);
          object = loader.parse(text);
        } else if (ext === 'gltf' || ext === 'glb') {
          const loader = new GLTFLoader();
          const result = await new Promise<any>((resolve, reject) => {
            loader.parse(buffer, '', resolve, reject);
          });
          object = result.scene;
        }
        
        if (object && groupRef.current && !cancelled) {
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          object.scale.setScalar(scale);
          
          box.setFromObject(object);
          const newCenter = box.getCenter(new THREE.Vector3());
          
          object.position.x = -newCenter.x;
          object.position.y = -newCenter.y;
          object.position.z = -newCenter.z;
          
          groupRef.current.add(object);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load model:', err);
      }
    };
    
    loadModel();
    
    return () => {
      cancelled = true;
    };
  }, [url, ext]);

  return <group ref={groupRef} />;
}

function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

export function ModelScene({ modelUrl, filename, onLoad }: ModelSceneProps) {
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    if (modelLoaded && onLoad) {
      onLoad();
    }
  }, [modelLoaded, onLoad]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45 }}
        onCreated={() => {
          onLoad?.();
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={10}
        />
        
        <gridHelper args={[10, 10, '#cccccc', '#e0e0e0']} />
        
        <Suspense fallback={<LoadingSpinner />}>
          <Model 
            url={modelUrl} 
            filename={filename}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
