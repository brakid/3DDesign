import { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface ModelViewerProps {
  modelUrl: string;
  filename: string;
  onLoad?: () => void;
}

export interface ModelViewerHandle {
  captureSnapshot: () => Blob | null;
}

export const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(
  function ModelViewer({ modelUrl, filename, onLoad }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);
    const animationRef = useRef<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRotate, setAutoRotate] = useState(false);

    const defaultCameraPosition = new THREE.Vector3(3, 2, 3);

    useImperativeHandle(ref, () => ({
      captureSnapshot: (): Blob | null => {
        if (!containerRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return null;
        }

        const canvas = containerRef.current.querySelector('canvas');
        if (!canvas) return null;

        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        return new Blob([bytes], { type: 'image/png' });
      }
    }));

    const resetView = useCallback(() => {
      if (!cameraRef.current || !controlsRef.current) return;
      cameraRef.current.position.copy(defaultCameraPosition);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }, []);

    const zoomIn = useCallback(() => {
      if (!cameraRef.current || !controlsRef.current) return;
      const direction = new THREE.Vector3();
      direction.subVectors(new THREE.Vector3(0, 0, 0), cameraRef.current.position).normalize();
      cameraRef.current.position.addScaledVector(direction, -0.5);
      controlsRef.current.update();
    }, []);

    const zoomOut = useCallback(() => {
      if (!cameraRef.current || !controlsRef.current) return;
      const direction = new THREE.Vector3();
      direction.subVectors(new THREE.Vector3(0, 0, 0), cameraRef.current.position).normalize();
      cameraRef.current.position.addScaledVector(direction, 0.5);
      controlsRef.current.update();
    }, []);

    const fitToView = useCallback(() => {
      if (!cameraRef.current || !controlsRef.current || !modelRef.current) return;
      
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;
      
      const direction = new THREE.Vector3(1, 0.5, 1).normalize();
      cameraRef.current.position.copy(center).addScaledVector(direction, distance);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }, []);

    const rotateModel = useCallback((axis: 'x' | 'y' | 'z') => {
      if (!modelRef.current) return;

      const rotationAxis = axis === 'x' 
        ? new THREE.Vector3(1, 0, 0) 
        : axis === 'y' 
          ? new THREE.Vector3(0, 1, 0) 
          : new THREE.Vector3(0, 0, 1);
      
      modelRef.current.rotateOnWorldAxis(rotationAxis, Math.PI / 2);
    }, []);

    useEffect(() => {
      if (!controlsRef.current) return;
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2;
    }, [autoRotate]);

    useEffect(() => {
      if (!containerRef.current || !modelUrl) return;

      setLoading(true);
      setError(null);

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0xf0f0f0, 1);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(-5, -3, -5);
      scene.add(directionalLight2);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.copy(defaultCameraPosition);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 20;
      controls.enablePan = true;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 2;
      controlsRef.current = controls;

      const gridHelper = new THREE.GridHelper(10, 10, 0xcccccc, 0xe0e0e0);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      const ext = filename.split('.').pop()?.toLowerCase();

      const processModel = (loaded: THREE.Object3D) => {
        if (modelRef.current) {
          scene.remove(modelRef.current);
        }

        modelRef.current = loaded;

        const box = new THREE.Box3().setFromObject(loaded);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        loaded.scale.setScalar(scale);

        box.setFromObject(loaded);
        const newCenter = box.getCenter(new THREE.Vector3());

        loaded.position.x = -newCenter.x;
        loaded.position.y = -newCenter.y;
        loaded.position.z = -newCenter.z;

        scene.add(loaded);
        setLoading(false);
        onLoad?.();
      };

      const loadModel = async () => {
        try {
          const response = await fetch(modelUrl);
          const buffer = await response.arrayBuffer();

          if (ext === 'obj') {
            const loader = new OBJLoader();
            const text = new TextDecoder().decode(buffer);
            const object = loader.parse(text);
            processModel(object);
          } else if (ext === 'gltf' || ext === 'glb') {
            const loader = new GLTFLoader();
            const result = await new Promise<any>((resolve, reject) => {
              loader.parse(buffer, '', resolve, reject);
            });
            processModel(result.scene);
          } else {
            setError('Unsupported file format');
            setLoading(false);
          }
        } catch (err) {
          console.error('Failed to load model:', err);
          setError('Failed to load model');
          setLoading(false);
        }
      };

      loadModel();

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        controls.dispose();
        if (modelRef.current) {
          scene.remove(modelRef.current);
          modelRef.current = null;
        }
        renderer.dispose();
        container.removeChild(renderer.domElement);
        rendererRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        controlsRef.current = null;
      };
    }, [modelUrl, filename]);

    return (
      <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={zoomIn}
            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={fitToView}
            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
            title="Fit to View"
          >
            <Maximize2 size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors"
            title="Reset View"
          >
            <RefreshCw size={18} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg shadow-md transition-colors ${
              autoRotate ? 'bg-primary-600 hover:bg-primary-700' : 'bg-white/90 hover:bg-white'
            }`}
            title="Toggle Auto-Rotate"
          >
            <RotateCw size={18} className={autoRotate ? 'text-white' : 'text-gray-700'} />
          </button>
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1">
          <button
            type="button"
            onClick={() => rotateModel('x')}
            className="px-2 py-1 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors text-sm font-bold text-gray-700"
            title="Rotate 90° on X axis"
          >
            X
          </button>
          <button
            type="button"
            onClick={() => rotateModel('y')}
            className="px-2 py-1 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors text-sm font-bold text-gray-700"
            title="Rotate 90° on Y axis"
          >
            Y
          </button>
          <button
            type="button"
            onClick={() => rotateModel('z')}
            className="px-2 py-1 bg-white/90 hover:bg-white rounded-lg shadow-md transition-colors text-sm font-bold text-gray-700"
            title="Rotate 90° on Z axis"
          >
            Z
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading model...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </div>
    );
  }
);
