// Add this import at the top
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Add these new state/ref variables
const [useOrbitControls, setUseOrbitControls] = useState(false);
const controlsRef = useRef(null);

// Modify your main useEffect to include OrbitControls setup
useEffect(() => {
  // ...existing camera and renderer setup...

  // Add OrbitControls setup
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = useOrbitControls;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controlsRef.current = controls;

  // Modify your animate function
  const animate = () => {
    requestAnimationFrame(animate);
    if (controlsRef.current && useOrbitControls) {
      controlsRef.current.update();
    }
    renderer.render(scene, camera);
  };
  animate();

  // Add controls cleanup to the return function
  return () => {
    // ...existing cleanup code...
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }
  };
}, [modelFile, isGlossy]);

// Add this effect to handle control mode switching
useEffect(() => {
  if (controlsRef.current) {
    controlsRef.current.enabled = useOrbitControls;
    
    // Disable other controls when OrbitControls is active
    if (useOrbitControls) {
      setMouseControls(false);
      // Reset camera parameters to avoid conflicts
      handelResetPosition();
    }
  }
}, [useOrbitControls]);

// Modify your mouse controls effect
useEffect(() => {
  if (useOrbitControls) return; // Prevent mouse controls when orbit is active
  
  // ...rest of your existing mouse controls code...
}, [isMouseDown, lastMousePos, mouseControls, useOrbitControls]);

// Add a button to toggle OrbitControls in your JSX
<button 
  style={{ margin: "10px" }} 
  onClick={() => setUseOrbitControls(!useOrbitControls)}
  disabled={mouseControls}
>
  Orbit Controls {useOrbitControls ? 'on' : 'off'}
</button>

// Modify your camera position update function
const updateCameraPosition = (r, p, a, rotation) => {
  if (!cameraRef.current || useOrbitControls) return; // Skip if orbit controls active
  
  // ...rest of your existing camera position code...
};