// this  code hase camera rotation prop , with all manual controlls with object movement and camera movement
'use client'

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ViewportGizmo } from "three-viewport-gizmo";

// import { PathTracingRenderer, PhysicalPathTracingMaterial, WebGLPathTracer } from 'three-gpu-pathtracer';
import { PathTracer, PhysicalPathTracingMaterial } from 'three-gpu-pathtracer';
// import { GPUPathTracer, PhysicalPathTracingMaterial } from 'three-gpu-pathtracer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { PMREMGenerator } from 'three';

const ThreejsOLD = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const [modelFile, setModelFile] = useState(null);
  const [model, setModel] = useState(null);
  const [defaultModel, setDefaultModel] = useState(null);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [modelBounds, setModelBounds] = useState(null);

  const [selectedColorMesh, setSelectedColorMesh] = useState(null);
  const [currentColor, setCurrentColor] = useState("#000000");

  const [colorableMeshes, setColorableMeshes] = useState([]);
  const [saveColour, setsaveColour] = useState([]);

  const [zoom, setZoom] = useState(50);
  const [radius, setRadius] = useState(5.5);
  const [azimuth, setAzimuth] = useState(1.57);
  const [polar, setPolar] = useState(Math.PI / 2);
  const [rendersize, setrendersize] = useState();

  const modelRef = useRef(null);
  const animatmodelRef = useRef(null);
  const [modelMatenees, setmodelMatenees] = useState(0);
  const [modelRoughness, setmodelRoughness] = useState(0);
  const [modelOpacity, setModelOpacity] = useState(1.0);
  const [modelTransmission, setModelTransmission] = useState(1);


  const [isGlossy, setIsGlossy] = useState('plastic');
  const [camrotation, setcamrotation] = useState(0);

  const pivotRef = useRef(null);
  const [useOrbitControls, setUseOrbitControls] = useState(false);
  const controlsRef = useRef(null);

  const [saveposition, setsaveposition] = useState({});

  const DlightRef = useRef(null);
  const [lightOn, setLightOn] = useState(false);
  const [lightColor, setLightColor] = useState("#ffffff");
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [lightPosition, setLightPosition] = useState({ x: -4, y: 4, z: 5 });

  const gizmoRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);


  useEffect(() => {
    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ebebeb");
    sceneRef.current = scene;

    let camera = new THREE.PerspectiveCamera(20, currentMount.clientWidth / currentMount.clientHeight, 0.1, 10000);
    camera.position.set(0, 0, 5.5);
    camera.rotation.set(0, 0, 0);

    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.gammaOutput = false; //--
    renderer.gammaFactor = 1.0;  //--
    renderer.outputEncoding = THREE.sRGBEncoding; //--

    renderer.shadowMap.type = THREE.VSMShadowMap;

    currentMount.appendChild(renderer.domElement);
    setrendersize({ width: currentMount.clientWidth, height: currentMount.clientHeight })
    renderer.preserveDrawingBuffer = true;
    rendererRef.current = renderer;
    renderer.toneMapping = THREE.NoToneMapping; // Adjust exposure //--

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2); // Adjust intensity and colors as needed
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load('env.hdr', (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      // envMap.encoding = THREE.RGBM16Encoding;
      envMap.encoding = THREE.sRGBEncoding
      // scene.background = envMap;
      scene.environment = envMap;
      texture.dispose();
      pmremGenerator.dispose();
    })

    let Intensity = lightOn ? lightIntensity : 0;
    const Dlight = new THREE.DirectionalLight(lightColor, Intensity);
    Dlight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    Dlight.target.position.set(0, 0, 0);
    scene.add(Dlight.target);
    scene.add(Dlight);
    DlightRef.current = Dlight;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/");
    loader.setDRACOLoader(dracoLoader);
    const loadModel = (gltf) => {

      if (isGlossy === 'glossy') {

        gltf.scene.traverse((child) => {
          const Pmaterial = new THREE.MeshPhysicalMaterial({
            // Ensure transparency and glass effect
            transmission: 0,
            roughness: 0,
            metalness: 0,
            ior: 1.5,
            clearcoat: 0.4,
            clearcoatRoughness: 0.1,
            thickness: 1,
            opacity: 1,
            transparent: true,
            specularColor: '#FEFEFE',
            emissiveIntensity: 0,
            aoMapIntensity: 1,
            side: 0,
            emissive: "#000000",
            depthTest: true
          });

          if (child.material && child.material.color) {
            Pmaterial.color = child.material.color;
          }

          child.material = Pmaterial;
          child.frustumCulled = false;

          if (child.material) {
            // Set other attributes for a glassy effect
            child.material.normalMapType = 0;
            child.material.sheen = 0;
            child.material.depthFunc = 3;
            child.material.depthWrite = true;
            child.material.needsUpdate = true;
            child.material.shadowSide = null;
            child.material.specularIntensity = 1;
            child.material.clearcoatNormalScale = {
              x: 1,
              y: 1
            }
          }
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.flatShading = false;  // Smooth shading for plastic
            child.geometry.computeVertexNormals();
            child.encoding = THREE.sRGBEncoding
          }

        });
      }
      else if (isGlossy === 'glass') {
        const material = new THREE.MeshPhysicalMaterial({
          // Core glass properties
          transmission: 1.0,           // Maximum transmission for clear glass
          thickness: 0.6,             // Moderate thickness for better refraction
          roughness: 0.03,           // Very slight roughness for subtle imperfections
          metalness: 0.5,              // Non-metallic material
          ior: 0.9,                 // Accurate index of refraction for glass

          // Surface properties
          reflectivity: 0.2,         // High reflectivity for glass shine
          clearcoat: 1.0,            // Maximum clearcoat for surface shine
          clearcoatRoughness: 0.1,   // Smooth clearcoat surface

          // Transparency settings
          transparent: true,
          opacity: 0.5,              // Lower opacity for more transparency

          // Environment and rendering
          envMapIntensity: 0.9,      // Stronger environment reflections
          side: THREE.DoubleSide,    // Render both sides

          // Additional properties for realism
          attenuationColor: new THREE.Color(0.9, 0.9, 0.9), // Slight blue-green tint
          attenuationDistance: 1.0,   // How far light travels through glass
          sheen: 1.0,                // No fabric-like sheen
          specularIntensity: 1.0,    // High specular highlights
          specularColor: new THREE.Color(1, 1, 1), // White specular color

          aoMapIntensity: 3,        // Increases ambient occlusion
          envMapIntensity: 1.2,       // Enhances environment lighting
          clearcoat: 1.0,             // Adds clear coat layer
          clearcoatRoughness: 0.1,    // Makes clear coat slightly rough
          normalScale: new THREE.Vector2(1.5, 1.5), // Enhances normal map effect
          shadowSide: THREE.FrontSide //
        });

        const materials = new THREE.MeshPhysicalMaterial();

        gltf.scene.traverse((child) => {

          if (child.isMesh) {

            if ((child.name === "Bottle" || child.name === "Tub")) {
              // Apply glass material
              child.material = material.clone();
              child.material.frustumCulled = false;
            }
            // else{
            //   child.material = materials.clone();
            //   child.material.frustumCulled = false;
            // }

            // Additional mesh settings
            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.needsUpdate = true;
            child.geometry.computeVertexNormals();
          }
        });
      }
      else if (isGlossy === 'matt') {
        gltf.scene.traverse((child) => {
          child.frustumCulled = false;
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            child.material.flatShading = false;
            child.material.needsUpdate = true;
            child.geometry.computeVertexNormals();

            child.material.map = null;
            // Improve material quality
            if (child.material) {
              child.material.precision = "highp";
              child.encoding = THREE.sRGBEncoding
              console.log(child.material.map);
              if (child.material.map) {
                console.log("inside the map");

                child.material.map.anisotropy =
                  renderer.capabilities.getMaxAnisotropy();
                child.material.map.minFilter = THREE.LinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.generateMipmaps = true;
              }
            }
          }
        });
      }
      else if (isGlossy === 'plastic') {
        const material = new THREE.MeshPhysicalMaterial({
          transmission: 0.95,          // High transparency for glass
          thickness: 1.0,              // Thickness for refraction
          roughness: 0.1,              // Slight roughness for imperfections
          metalness: 0.0,              // Non-metallic material
          ior: 1.5,                    // Index of refraction for glass
          reflectivity: 0.5,           // Moderate reflectivity
          clearcoat: 1.0,              // Clearcoat for surface shine
          clearcoatRoughness: 0.05,    // Smooth clearcoat
          transparent: true,
          opacity: 0.95,               // Semi-transparent
          envMapIntensity: 1.5,        // Enhance environment reflections
          side: THREE.DoubleSide,      // Render both sides
          attenuationColor: new THREE.Color(0.9, 0.5, 0.3), // Slight tint for the glass
          attenuationDistance: 2.0,    // Light travels through the material
          specularIntensity: 1.0,      // Strong specular highlights
          specularColor: new THREE.Color(1, 1, 1),
        });

        // gltf.scene.traverse((child) => {

        //   if (child.isMesh) {

        //     if ((child.name === "Bottle" || child.name === "Tub")) {
        //       // Apply glass material
        //       child.material = material.clone();
        //       child.material.frustumCulled = false;

        //       child.castShadow = true; // Enable casting shadows
        //       child.receiveShadow = true; // Enable receiving shadows
        //     }

        //     // Additional mesh settings
        //     child.frustumCulled = false;
        //     child.castShadow = true;
        //     child.receiveShadow = true;
        //     child.material.needsUpdate = true;
        //     child.geometry.computeVertexNormals();
        //   }
        // });
      }

      const pivot = new THREE.Group();
      pivot.add(gltf.scene);
      console.log("gltf", gltf);

      scene.add(pivot);

      modelRef.current = gltf.scene;
      animatmodelRef.current = gltf;
      pivotRef.current = pivot;

      // Calculate model bounds
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);

      // setModelBounds(box);

      return gltf.scene;
    };

    if (!modelFile) {
      loader.load("Supplement Jar Single.glb", (gltf) => {
        const modelScene = loadModel(gltf);
        setDefaultModel(modelScene);
        setModel(modelScene);
      });
    }

    if (modelFile) {
      if (defaultModel) {
        scene.remove(defaultModel);
        setDefaultModel(null);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        loader.parse(event.target.result, "", (gltf) => {
          const modelScene = loadModel(gltf);
          setModel(modelScene);
        });
      };
      reader.readAsArrayBuffer(modelFile);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = useOrbitControls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;
    controls.minDistance = 2;
    controls.maxDistance = 30;

    const can = document.getElementById("canvas");
    const gizmo = new ViewportGizmo(camera, renderer, {
      container: can,
      "type": "sphere",
      "size": 100,
      "placement": "bottom-left",
      "resolution": 64,
      "lineWidth": 5,
      "radius": 1,
      "smoothness": 18,
      "animated": true,
      "interactive": true,
      "enabled": true,
      "speed": 1.3,
      "background": {
        "enabled": true,
        "color": 16777215,
        "opacity": 0,
        "hover": {
          "color": 11579568,
          "opacity": 0.5
        }
      },
      "font": {
        "family": "sans-serif",
        "weight": 800
      },
      "offset": {
        bottom: 0,
        left: 0,
        top: 0,
        right: 0
      },
      "corners": {
        "enabled": false,
        "color": 15915362,
        "opacity": 1,
        "scale": 0.15,
        "radius": 1,
        "smoothness": 18,
        "hover": {
          "color": 16777215,
          "opacity": 1,
          "scale": 0.2
        }
      },
      "edges": {
        "enabled": false,
        "color": 15915362,
        "opacity": 1,
        "radius": 1,
        "smoothness": 18,
        "scale": 0.15,
        "hover": {
          "color": 16777215,
          "opacity": 0.13,
          "scale": 0.2
        }
      },
      "x": {
        "enabled": true,
        "color": 16725587,
        "opacity": 1,
        "scale": 0.7,
        "labelColor": 2236962,
        "line": true,
        "border": {
          "size": 0,
          "color": 14540253
        },
        "hover": {
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "scale": 0.7,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "X"
      },
      "y": {
        "enabled": true,
        "color": 9100032,
        "opacity": 1,
        "scale": 0.7,
        "labelColor": 2236962,
        "line": true,
        "border": {
          "size": 0,
          "color": 14540253
        },
        "hover": {
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "scale": 0.7,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "Y"
      },
      "z": {
        "enabled": true,
        "color": 2920447,
        "opacity": 1,
        "scale": 0.7,
        "labelColor": 2236962,
        "line": true,
        "border": {
          "size": 0,
          "color": 14540253
        },
        "hover": {
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "scale": 0.7,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "Z"
      },
      "nx": {
        "line": false,
        "scale": 0.45,
        "hover": {
          "scale": 0.5,
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "",
        "enabled": true,
        "color": 16725587,
        "opacity": 1,
        "labelColor": 2236962,
        "border": {
          "size": 0,
          "color": 14540253
        }
      },
      "ny": {
        "line": false,
        "scale": 0.45,
        "hover": {
          "scale": 0.5,
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "",
        "enabled": true,
        "color": 9100032,
        "opacity": 1,
        "labelColor": 2236962,
        "border": {
          "size": 0,
          "color": 14540253
        }
      },
      "nz": {
        "line": false,
        "scale": 0.45,
        "hover": {
          "scale": 0.5,
          "color": 16777215,
          "labelColor": 2236962,
          "opacity": 1,
          "border": {
            "size": 0,
            "color": 14540253
          }
        },
        "label": "",
        "enabled": true,
        "color": 2920447,
        "opacity": 1,
        "labelColor": 2236962,
        "border": {
          "size": 0,
          "color": 14540253
        }
      },
      "isSphere": true
    });
    gizmo.attachControls(controls);
    gizmoRef.current = gizmo;


    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current && useOrbitControls) {
        controls.update();
      }
      renderer.render(scene, camera);

      gizmo.update();
      gizmo.render();

    };
    animate();

    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      gizmo.update();
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    setUseOrbitControls(true);
    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      if (controlsRef.current && useOrbitControls) {
        controlsRef.current.dispose();
      }
      window.removeEventListener("resize", handleResize);
      setDefaultModel(null);
      scene.remove(modelRef.current);
      modelRef.current = null;
      renderer.dispose();

    };
  }, [modelFile, isGlossy]);

  useEffect(() => {
    if (model) {
      setSelectedMesh(null);
    }
  }, [model]);

  useEffect(() => {
    if (model) {
      const meshesWithoutTexture = [];
      model.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            if (child.material.some((mat) => !mat.map)) {
              meshesWithoutTexture.push(child);
            }
          } else if (child.material && !child.material.map) {
            meshesWithoutTexture.push(child);
          }
        }
      });
      setColorableMeshes(meshesWithoutTexture);
    }
  }, [model]);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mouseControls, setMouseControls] = useState(false);

  useEffect(() => {
    if (useOrbitControls) return; // Prevent mouse controls when orbit is active
    const onMouseMove = (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;

      // Apply rotation to the model based on mouse movement
      if (modelRef.current && pivotRef.current) {
        // Rotate only on one axis at a time
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          pivotRef.current.rotation.y += deltaX * 0.01;      // Rotate around Y-axis (horizontal)
        } else {
          pivotRef.current.rotation.x += deltaY * 0.01;      // Rotate around X-axis (vertical)
        }
      }
      // Update last mouse position
      setLastMousePos({ x: event.clientX, y: event.clientY });
    };

    const onMouseDown = (event) => {
      setIsMouseDown(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    };

    const onMouseUp = () => {
      setIsMouseDown(false);
    };

    const onMouseScroll = (event) => {
      if (modelRef.current && pivotRef.current) {
        if (event.deltaY > 0) {
          pivotRef.current.position.z -= 0.3; // Zoom out
        } else {
          pivotRef.current.position.z += 0.3; // Zoom in
        }
      }

    }


    // Attach mouse events to the canvas, not the window
    const canvas = mountRef.current;
    if (canvas && mouseControls) {
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('wheel', onMouseScroll);
    }

    if (!mouseControls && pivotRef.current) {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('wheel', onMouseScroll);

      pivotRef.current.rotation.x = 0;
      pivotRef.current.rotation.y = 0;
      pivotRef.current.position.z = 0;
    }

    return () => {
      // Clean up event listeners when component unmounts
      const canvas = mountRef.current;
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('wheel', onMouseScroll);
      }
    };
  }, [isMouseDown, lastMousePos, mouseControls, useOrbitControls]);

  useEffect(() => {
    if (mouseControls) {
      handelResetPosition();
    }
  }, [mouseControls]);

  useEffect(() => {
    if (controlsRef.current) {
      cameraRef.current.position.set(0, 0, 5.5);
      cameraRef.current.rotation.set(0, 0, 0);
    }
    if (useOrbitControls) {
      gizmoRef.current.attachControls(controlsRef.current);
      gizmoRef.current.enabled = true;
    } else {
      gizmoRef.current.detachControls(controlsRef.current);
      gizmoRef.current.enabled = false;
    }
    gizmoRef.current.update();

  }, [useOrbitControls]);

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

  const removeCurrentModel = () => {
    console.log("in remove function");

    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          // Dispose of material(s)
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              if (material.map) material.map.dispose(); // Dispose of texture map
              if (material.normalMap) material.normalMap.dispose(); // Dispose of normal map
              if (material.roughnessMap) material.roughnessMap.dispose(); // Dispose of roughness map
              if (material.metalnessMap) material.metalnessMap.dispose(); // Dispose of metalness map
              material.dispose(); // Dispose of material
            });
          } else if (child.material) {
            if (child.material.map) child.material.map.dispose();
            if (child.material.normalMap) child.material.normalMap.dispose();
            if (child.material.roughnessMap) child.material.roughnessMap.dispose();
            if (child.material.metalnessMap) child.material.metalnessMap.dispose();
            child.material.dispose();
          }

          // Dispose of geometry
          if (child.geometry) {
            child.geometry.dispose();
          }
        }
      });

      // Remove the model from the scene
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    if (pivotRef.current) {
      sceneRef.current.remove(pivotRef.current);
      pivotRef.current = null;
    }
  };

  const handleFileChange = (event) => {
    removeCurrentModel();
    setModelFile(event.target.files[0]);
    setSelectedMesh(null);
    handelResetPosition();
    // setColorChanged(false);
  };

  const handleMeshSelection = (event) => {
    const selectedMeshName = event.target.value;
    if (model) {
      const mesh = model.getObjectByName(selectedMeshName);
      setSelectedMesh(mesh);
    }
  };

  const handleTextureChange = (event) => {
    if (selectedMesh) {
      const file = event?.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        // Dispose previous texture to free GPU memory
        if (selectedMesh.material.map) {
          selectedMesh.material.map.dispose();
          selectedMesh.material.map = null;
          selectedMesh.material.dispose();
        }
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(e.target.result, () => {
          texture.flipY = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.encoding = THREE.sRGBEncoding;
          texture.minFilter = THREE.NearestMipmapLinearFilter;
          texture.generateMipmaps = true;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();
          texture.mapping = THREE.UVMapping;
          selectedMesh.material.map = texture;
          selectedMesh.material.needsUpdate = true;
        });
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDownloadImage = (format) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    const { width, height } = rendersize;

    const originalBackground = scene.background;
    scene.background = null;

    renderer.setSize(2048, 2048);

    if (format === "png") {
      renderer.render(scene, camera);
      const link = document.createElement("a");
      link.href = renderer.domElement.toDataURL("image/png", 1.0);
      link.download = "model.png";
      link.click();
    }
    scene.background = originalBackground;
    renderer.setSize(width, height);
  };

  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setCurrentColor(newColor);

    if (selectedColorMesh && selectedColorMesh.isMesh) {
      if (Array.isArray(selectedColorMesh.material)) {
        selectedColorMesh.material.forEach((mat) => {
          if (!mat.map) {
            mat.color.setStyle(newColor);
            mat.needsUpdate = true;
          }
        });
      } else if (
        selectedColorMesh.material &&
        !selectedColorMesh.material.map
      ) {
        selectedColorMesh.material.color.setStyle(newColor);
        selectedColorMesh.material.needsUpdate = true;
        setsaveColour([...saveColour, { selectedColorMesh, newColor }]);  // save the colour with mesh
      }
    }
  };

  // save position of camera and light
  const handleColorMeshSelect = (event) => {
    const meshName = event.target.value;
    const mesh = model.getObjectByName(meshName);
    setSelectedColorMesh(mesh);
    if (mesh && mesh.material && mesh.material.color) {
      setCurrentColor('#' + mesh.material.color.getHexString());
    }
  };

  const handleZoomChange = (event) => {
    const newZoom = parseInt(event.target.value);
    setZoom(newZoom);
    const newRadius = 10 - (newZoom / 11);
    setRadius(newRadius);
    updateCameraPosition(newRadius, polar, azimuth, camrotation);
  };

  const handleAzimuthChange = (event) => {
    const angle = parseFloat(event.target.value) * Math.PI / 180;
    setAzimuth(angle);
    updateCameraPosition(radius, polar, angle, camrotation);
  };

  const handlePolarChange = (event) => {
    const angle = parseFloat(event.target.value) * Math.PI / 180;
    setPolar(angle);
    updateCameraPosition(radius, angle, azimuth, camrotation);
  };

  const handelCameraRotation = (event) => {
    const val = parseFloat(event.target.value);
    setcamrotation(val);
    updateCameraPosition(radius, polar, azimuth, val);
  };

  const updateCameraPosition = (r, p, a, rotation) => {

    if (!cameraRef.current || useOrbitControls) return; // Skip if orbit controls active

    // Calculate camera position on sphere
    const x = r * Math.sin(p) * Math.cos(a);
    const z = r * Math.sin(p) * Math.sin(a);
    const y = r * Math.cos(p);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);

    cameraRef.current.rotateZ(rotation);

    // Update camera matrix
    cameraRef.current.updateMatrix();
    cameraRef.current.updateMatrixWorld();
    gizmoRef.current.update();

  };

  const handelResetPosition = () => {
    setZoom(50);
    setRadius(5.5);
    setAzimuth(1.57);
    setPolar(Math.PI / 2);
    setcamrotation(0);
    updateCameraPosition(5.5, Math.PI / 2, 1.57, 0);
  };



  const handelMetalnessChange = (event) => {

    let model = modelRef.current;
    let value = parseFloat(event.target.value);
    let mesh = selectedColorMesh;
    setmodelMatenees(value);

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.metalness = value;
            });
          } else {
            child.material.metalness = value;
          }
        }
      });
    }
  }

  const handelRoughnessChange = (event) => {

    let model = modelRef.current;
    let value = parseFloat(event.target.value);
    let mesh = selectedColorMesh;
    setmodelRoughness(value);

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.roughness = value;
            });
          } else {
            child.material.roughness = value;
          }
        }
      })
    }
  }

  const handleOpacityChange = (event) => {
    let model = modelRef.current;
    let value = parseFloat(event.target.value);
    let mesh = selectedColorMesh;
    setModelOpacity(value);

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.isMeshPhysicalMaterial || mat.isMeshStandardMaterial) {
                mat.opacity = value;
                mat.transparent = value < 1;
                mat.needsUpdate = true;
              }
            });
          } else {
            if (child.material.isMeshPhysicalMaterial || child.material.isMeshStandardMaterial) {
              child.material.opacity = value;
              child.material.transparent = value < 1;
              child.material.needsUpdate = true;
            }
          }
        }
      });
    }
  };

  const handleTransmissionChange = (event) => {
    let model = modelRef.current;
    let value = parseFloat(event.target.value);
    let mesh = selectedColorMesh;
    setModelTransmission(value);

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.isMeshPhysicalMaterial) {
                mat.transmission = value;
                mat.transparent = true;
                mat.needsUpdate = true;
                mat.side = THREE.DoubleSide;
                child.renderOrder = 1;
              }
            });
          } else {
            if (child.material.isMeshPhysicalMaterial) {
              child.material.transmission = value;
              child.material.transparent = true;
              child.material.needsUpdate = true;
              child.material.side = THREE.DoubleSide;
              child.renderOrder = 1;
            }
          }
        }
      });
    }
  };

  const handelLightOn = (val) => {
    if (val) {
      DlightRef.current.intensity = lightIntensity;
    } else {
      DlightRef.current.intensity = 0;
    }
    setLightOn(val);
  };

  const handelLightColour = (val) => {
    const color = new THREE.Color(val);
    DlightRef.current.color = color;
    setLightColor(val);
  };

  const handleLightPositionChange = (axis, value) => {
    setLightPosition((prev) => {
      const newPosition = { ...prev, [axis]: value };
      if (DlightRef.current) {
        DlightRef.current.position.set(
          newPosition.x,
          newPosition.y,
          newPosition.z
        );
        DlightRef.current.target.position.set(0, 0, 0);
      }
      return newPosition;
    });
  };

  const handelLightIntensity = (val) => {
    DlightRef.current.intensity = val;
    setLightIntensity(val);
  }


  const mixerRef = useRef(null);

  const playGLTFAnimation = () => {

    if (!modelRef.current) return;

    setIsAnimating(true);
    const mixer = new THREE.AnimationMixer(animatmodelRef.current.scene);
    mixerRef.current = mixer;

    const animations = animatmodelRef.current.animations || [];

    if (animations.length === 0) {
      console.warn("No animations found in the GLTF file.");
      return;
    }

    const action = mixer.clipAction(animations[0]);
    // action.setLoop(THREE.LoopOnce); 
    action.clampWhenFinished = true;
    action.play();

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      mixer.update(delta);

      if (action.isRunning()) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const stopGLTFAnimation = () => {
    if (mixerRef.current) {
      mixerRef.current.stopAllAction();
      mixerRef.current = null;
      setIsAnimating(false);
    }
  };

  const rotateModel = (rotatey, zoom, moveLR, rotatex) => {
    if (!modelRef.current) return;
    setIsAnimating(true);
    const camerapos = cameraRef.current.position.clone();
    cameraRef.current.position.set(0, 0, 5.5)
    const duration = 1500; // Duration of the rotation in milliseconds
    const startTime = performance.now();
    const initialRotationY = modelRef.current.rotation.y;

    const initposX = pivotRef.current.rotation.x;

    const initialRotationX = modelRef.current.position.x - 1;
    const initialCameraZ = cameraRef.current.position.z + 5;
    const targetCameraZ = initialCameraZ - 5;

    // Easing function (easeInOutQuad)
    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const animate = (time) => {
      const elapsedTime = time - startTime;
      const rawProgress = Math.min(elapsedTime / duration, 1);
      const progress = easeInOutQuad(rawProgress);

      // Rotate the model 360 degrees
      if (rotatey) modelRef.current.rotation.y = initialRotationY + progress * Math.PI * 2;

      // Interpolate the camera's Z position
      if (zoom) cameraRef.current.position.z = THREE.MathUtils.lerp(initialCameraZ, targetCameraZ, progress);

      // Interpolate the model's X position
      if (moveLR) modelRef.current.position.x = THREE.MathUtils.lerp(initialRotationX, 0.4, progress);

      // Rotate the model 360 degrees
      if (rotatex) pivotRef.current.rotation.x = initposX + progress * Math.PI * 2;

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          cameraRef.current.position.z = initialCameraZ - 5;
          modelRef.current.position.x = initialRotationX + 1;
          cameraRef.current.position.copy(camerapos);
          setIsAnimating(false);
        }, 300);
      }
    };
    requestAnimationFrame(animate);
  };

  const keyframes0 = [
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: 0, rotationX: 0, rotationZ: 0, cameraZ: 12.5 },
    { positionX: -0.8, positionY: -0.4, positionZ: 0, rotationY: Math.PI / 2, rotationX: 0, rotationZ: 0, cameraZ: 8 },
    { positionX: 0.2, positionY: -0.4, positionZ: 0, rotationY: Math.PI, rotationX: 0, rotationZ: 0, cameraZ: 4 },
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: Math.PI * 2, rotationX: 0, rotationZ: 0, cameraZ: 8.5 },
  ];

  const keyframes1 = [
    { positionX: 0, positionY: 1, positionZ: 0, rotationY: 0, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
    { positionX: 0, positionY: -0.5, positionZ: 0, rotationY: 0, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
    { positionX: 0, positionY: -0.2, positionZ: 0, rotationY: Math.PI / 4, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: 0, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
  ];

  const keyframes2 = [
    { positionX: 0, positionY: 1, positionZ: 0, rotationY: 0, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: Math.PI * 2, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: Math.PI * 2, rotationX: -0.6, rotationZ: 0, cameraZ: 3.5 },
    { positionX: 0, positionY: -0.4, positionZ: 0, rotationY: Math.PI * 2, rotationX: 0, rotationZ: 0, cameraZ: 5.5 },
  ];


  // Trigger the animation

  const rotateModel0 = (keyframes, d) => {
    if (!modelRef.current || !cameraRef.current) return;

    const duration = d; // Total duration of the animation in milliseconds
    const startTime = performance.now();

    // Easing function (easeInOutQuad)
    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const animate = (time) => {
      const elapsedTime = time - startTime;
      const rawProgress = Math.min(elapsedTime / duration, 1); // Calculate raw progress (0 to 1)
      const progress = easeInOutQuad(rawProgress); // Apply easing to the progress

      // Determine the current segment of the animation
      const segmentCount = keyframes.length - 1;
      const segmentDuration = 1 / segmentCount; // Duration of each segment as a fraction of total progress
      const currentSegment = Math.floor(progress / segmentDuration);
      const segmentProgress = (progress % segmentDuration) / segmentDuration; // Progress within the current segment

      if (currentSegment < segmentCount) {
        const startKeyframe = keyframes[currentSegment];
        const endKeyframe = keyframes[currentSegment + 1];

        // Interpolate model's rotation
        if (startKeyframe.rotationY !== undefined && endKeyframe.rotationY !== undefined) {
          modelRef.current.rotation.y = THREE.MathUtils.lerp(
            startKeyframe.rotationY,
            endKeyframe.rotationY,
            segmentProgress
          );
        }
        if (startKeyframe.rotationX !== undefined && endKeyframe.rotationX !== undefined) {
          modelRef.current.rotation.x = THREE.MathUtils.lerp(
            startKeyframe.rotationX,
            endKeyframe.rotationX,
            segmentProgress
          );
        }
        if (startKeyframe.rotationZ !== undefined && endKeyframe.rotationZ !== undefined) {
          modelRef.current.rotation.z = THREE.MathUtils.lerp(
            startKeyframe.rotationZ,
            endKeyframe.rotationZ,
            segmentProgress
          );
        }

        // Interpolate model's position
        if (startKeyframe.positionX !== undefined && endKeyframe.positionX !== undefined) {
          modelRef.current.position.x = THREE.MathUtils.lerp(
            startKeyframe.positionX,
            endKeyframe.positionX,
            segmentProgress
          );
        }
        if (startKeyframe.positionY !== undefined && endKeyframe.positionY !== undefined) {
          modelRef.current.position.y = THREE.MathUtils.lerp(
            startKeyframe.positionY,
            endKeyframe.positionY,
            segmentProgress
          );
        }
        if (startKeyframe.positionZ !== undefined && endKeyframe.positionZ !== undefined) {
          modelRef.current.position.z = THREE.MathUtils.lerp(
            startKeyframe.positionZ,
            endKeyframe.positionZ,
            segmentProgress
          );
        }

        // Interpolate camera's Z position
        if (startKeyframe.cameraZ !== undefined && endKeyframe.cameraZ !== undefined) {
          cameraRef.current.position.z = THREE.MathUtils.lerp(
            startKeyframe.cameraZ,
            endKeyframe.cameraZ,
            segmentProgress
          );
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  // Correct import for latest version (tested with three-gpu-pathtracer@1.0.5)

  // const handleHighQualityRender = async () => {

  //   const scene = sceneRef.current;
  //   const camera = cameraRef.current;
  //   const renderer = rendererRef.current;

  //   if (!renderer.capabilities.isWebGL2) {
  //     alert('WebGL 2.0 required for path tracing');
  //     return;
  //   }
  //   try {
  //     // 1. Initialize path tracer
  //     const pathTracer = new GPUPathTracer({
  //       renderer,
  //       camera,
  //       scene,
  //       resolutionScale: 1.0, // 1.0 = full resolution
  //       samplesPerFrame: 4,   // Samples per animation frame
  //       tiles: [2, 2]         // Subdivision for progressive rendering [x,y]
  //     });

  //     // 2. Configure quality settings
  //     pathTracer.material = new PhysicalPathTracingMaterial();
  //     pathTracer.material.samples = 256; // Total target samples
  //     pathTracer.material.bounces = 8;   // Ray bounces

  //     // 3. Set environment lighting
  //     if (scene.environment) {
  //       pathTracer.material.envMap = scene.environment;
  //       pathTracer.material.envMapIntensity = 1.0;
  //     }

  //     // 4. Progressive rendering
  //     const canvas = document.createElement('canvas');
  //     canvas.width = 2048;
  //     canvas.height = 2048;
  //     const ctx = canvas.getContext('2d');

  //     // Render loop
  //     const totalSamples = 256;
  //     let currentSamples = 0;

  //     while (currentSamples < totalSamples) {
  //       await pathTracer.update();
  //       currentSamples += pathTracer.samplesPerFrame;

  //       // Optional: Update progress display
  //       console.log(`Rendered ${currentSamples}/${totalSamples} samples`);

  //       // Copy current state to canvas
  //       ctx.drawImage(pathTracer.getCanvas(), 0, 0);
  //     }

  //     // 5. Final download
  //     canvas.toBlob(blob => {
  //       const link = document.createElement('a');
  //       link.href = URL.createObjectURL(blob);
  //       link.download = 'path_traced_render.png';
  //       link.click();
  //     }, 'image/png', 1.0);

  //     // Cleanup
  //     pathTracer.dispose();

  //   } catch (error) {
  //     console.error('Path tracing error:', error);
  //     // Fallback to standard rendering if path tracing fails
  //     handleStandardRender();
  //   }
  // };

  const handleHighQualityRender = () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    console.log(scene);
    return;

    // Create a composer with higher resolution
    const renderWidth = 2048;
    const renderHeight = 2048;

    const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(
      renderWidth,
      renderHeight,
      { type: THREE.HalfFloatType }
    ));

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new SMAAPass(renderWidth, renderHeight)); // For antialiasing

    // Render
    composer.render();

    // Convert to image
    const canvas = document.createElement('canvas');
    canvas.width = renderWidth;
    canvas.height = renderHeight;
    const ctx = canvas.getContext('2d');

    const imageData = new ImageData(
      new Uint8ClampedArray(composer.readBuffer.texture.image.data),
      renderWidth,
      renderHeight
    );
    ctx.putImageData(imageData, 0, 0);

    // Download
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'high_quality_render.png';
    link.click();

    // Clean up
    composer.dispose();
  };

  // const sendToBlenderServer = async () => {
  //   console.log("sendToBlenderServer");
  //   try {
  //     const scene = sceneRef.current;
  //     const camera = cameraRef.current;
  //     if (!scene || !camera) throw new Error('Scene or camera missing');

  //     // ✅ Clone scene and include camera
  //     const exportScene = scene.clone();
  //     exportScene.add(camera.clone());

  //     // ✅ Export scene as GLB
  //     const exporter = new GLTFExporter();
  //     const glb = await new Promise((resolve, reject) => {
  //       exporter.parse(
  //         exportScene,
  //         (result) => {
  //           if (result instanceof ArrayBuffer) {
  //             resolve(result);
  //           } else {
  //             reject(new Error('Exported data is not binary'));
  //           }
  //         },
  //         reject,
  //         { binary: true, trs: true }
  //       );
  //     });

  //     if (glb.byteLength < 100) {
  //       throw new Error('Exported GLB is too small - likely empty');
  //     }

  //     // ✅ Prepare upload
  //     const formData = new FormData();
  //     formData.append('model', new Blob([glb], { type: 'model/gltf-binary' }), 'scene.glb');

  //     // ✅ Send to Blender render server
  //     const response = await fetch('http://192.168.29.132:3020/render', {
  //       method: 'POST',
  //       body: formData
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       throw new Error(error.error || 'Render failed');
  //     }

  //     // ✅ Receive image
  //     const blob = await response.blob();
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'render.png';
  //     a.click();

  //     // ✅ Cleanup
  //     setTimeout(() => URL.revokeObjectURL(url), 100);

  //   } catch (error) {
  //     console.error('Rendering failed:', error);
  //     alert(`Render failed: ${error.message}`);
  //   }
  // };


  const sendToBlenderServer = async () => {

    var currentdate = new Date();
    var datetime = "Last Sync: " + currentdate.getDay() + "/" + currentdate.getMonth()
      + "/" + currentdate.getFullYear() + " @ "
      + currentdate.getHours() + ":"
      + currentdate.getMinutes() + ":" + currentdate.getSeconds();
      
      console.log(datetime);
      

    console.log("sendToBlenderServer->>>>");
    handleZoomChange({ target: { value: 68 } });
    try {
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!scene || !camera) throw new Error("Scene or camera missing");

      // ✅ Clone the camera with full metadata and attach to the scene before export
      const exportCamera = camera.clone();
      exportCamera.name = "ExportCamera"; // helps identify it in Blender
      scene.add(exportCamera);

      // ✅ Export scene as GLB
      const exporter = new GLTFExporter();
      const glb = await new Promise((resolve, reject) => {
        exporter.parse(
          scene,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(result);
            } else {
              reject(new Error("Exported data is not binary"));
            }
          },
          reject,
          {
            binary: true,
            trs: true,
            onlyVisible: false,
            embedImages: true,
            includeCustomExtensions: true,
          }
        );
      });

      if (glb.byteLength < 100) {
        throw new Error("Exported GLB is too small — likely empty");
      }

      // ✅ Prepare form data
      const formData = new FormData();
      formData.append("model", new Blob([glb], { type: "model/gltf-binary" }), "scene.glb");
      handleZoomChange({ target: { value: 50 } });
      // ✅ Send to Blender server
      const response = await fetch("http://192.168.29.132:3020/render", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Render failed");
      }

      // ✅ Receive image
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "render.png";
      a.click();

      // ✅ Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // ✅ Optional: Remove temporary camera from scene
      scene.remove(exportCamera);

      var currentdate = new Date();
    var datetime = "Last Sync 2: " + currentdate.getDay() + "/" + currentdate.getMonth()
      + "/" + currentdate.getFullYear() + " @ "
      + currentdate.getHours() + ":"
      + currentdate.getMinutes() + ":" + currentdate.getSeconds();
      
      console.log(datetime);

    } catch (error) {
      console.error("Rendering failed:", error);
      alert(`Render failed: ${error.message}`);
    }
  };


  return (
    <>
      <div style={{ display: "flex", height: "100vh", width: "140vh", padding: "10px", overflow: "hidden" }}>

        <div style={{
          width: "30%",
          height: "100%",
          overflowY: "auto",
          padding: "10px",
          boxSizing: "border-box",
          fontFamily: "Arial, sans-serif",
        }}>
          <label>
            Select Model :
            <input
              type="file"
              accept=".glb"
              onChange={handleFileChange}
              style={{ marginBottom: "10px" }}
            />
          </label>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Material Type:
              <select
                value={isGlossy}
                onChange={(e) => setIsGlossy(e.target.value)}
                style={{ marginLeft: "10px" }}
              >
                <option value="matt">Matt</option>
                <option value="glossy">Glossy</option>
                <option value="glass">Glass</option>
                {/* <option value="metal">Metal</option> */}
                <option value="plastic">Plastic</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Select Mesh:
              <select
                onChange={handleMeshSelection}
                style={{ marginLeft: "10px" }}>
                <option>select mesh</option>
                {model &&
                  model.children
                    .filter((child) => child.isMesh)
                    .map((child) => (
                      <option key={child.name} value={child.name}>
                        {child.name}
                      </option>
                    ))}
              </select>
            </label>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Texture:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleTextureChange}
              disabled={!selectedMesh}
              style={{ marginLeft: "10px" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Select Mesh to colour:
              <select
                onChange={handleColorMeshSelect}
                style={{ marginLeft: "10px", marginRight: "10px" }}
                value={selectedColorMesh?.name || ""}>
                <option value="">Select mesh</option>
                {colorableMeshes.map((mesh) => (
                  <option key={mesh.name} value={mesh.name}>
                    {mesh.name}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={currentColor}
                onChange={handleColorChange}
                disabled={!selectedColorMesh}
                style={{ verticalAlign: "middle" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Select Mesh to edit:
              <select
                onChange={handleColorMeshSelect}
                style={{ marginLeft: "10px", marginRight: "10px" }}
                value={selectedColorMesh?.name || ""}>
                <option>select mesh</option>
                {model &&
                  model.children
                    .filter((child) => child.isMesh)
                    .map((child) => (
                      <option key={child.name} value={child.name}>
                        {child.name}
                      </option>
                    ))}
              </select>
            </label>
          </div>

          <div style={{ margin: '10px' }}>
            <label>Metalness</label>
            <input
              type="range"
              min="0"
              max="2"
              step={0.01}
              disabled={!selectedColorMesh}
              value={modelMatenees}
              onChange={handelMetalnessChange} />
            {" " + parseInt(modelMatenees * 100) + '%'}
          </div>

          <div style={{ margin: '10px' }}>
            <label>Roughness</label>
            <input
              type="range"
              min="0"
              max="1"
              step={0.01}
              disabled={!selectedColorMesh}
              value={modelRoughness}
              onChange={handelRoughnessChange} />
            {" " + parseInt(modelRoughness * 100) + '%'}
          </div>

          <div style={{ margin: '10px' }}>
            <label> Opacity </label>
            <input
              type="range"
              min="0"
              max="1.0"
              step={0.01}
              disabled={!selectedColorMesh}
              value={modelOpacity}
              onChange={handleOpacityChange} />
            {" " + parseInt(modelOpacity * 100) + '%'}
          </div>

          <div style={{ margin: '10px' }}>
            <label> Transparency </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step={0.01}
              disabled={!selectedColorMesh}
              value={modelTransmission}
              onChange={handleTransmissionChange}
            />
            {" " + parseInt(modelTransmission * 100) + '%'}
          </div>



          <div style={{ margin: '10px' }}>
            <label>Zoom</label>
            <input
              type="range"
              min="1"
              max="100"
              step='1'
              disabled={mouseControls || useOrbitControls}
              value={zoom}
              onChange={handleZoomChange} />
            {" " + parseInt(zoom)}
          </div>

          <div style={{ margin: '10px' }}>
            <label>Horizontal Rotation </label>
            <input
              type="range"
              min="0"
              max="360"
              disabled={mouseControls || useOrbitControls}
              value={azimuth * 180 / Math.PI}
              onChange={handleAzimuthChange} />

          </div>
          <div style={{ margin: '10px' }}>
            <label>Vertical Rotation</label>
            <input
              type="range"
              min="0"
              max="180"
              disabled={mouseControls || useOrbitControls}
              value={polar * 180 / Math.PI}
              onChange={handlePolarChange} />
          </div>

          <div style={{ margin: '10px' }}>
            <label>camera Rotation</label>
            <input
              type="range"
              min="0"
              max="6.28"
              step='0.01'
              disabled={mouseControls || useOrbitControls}
              value={camrotation}
              onChange={(e) => handelCameraRotation(e)} />
            {" " + camrotation}
          </div>

          <button onClick={() => handleDownloadImage("png")}
            style={{ margin: "10px" }}>
            Download PNG
          </button>

          <br></br>

          <div style={{ margin: "10px" }}>
            <button
              // onClick={handleHighQualityRender}
              onClick={sendToBlenderServer}
              style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", cursor: "pointer" }}
            >
              Render High-Quality Image
            </button>
          </div>

          <button style={{ margin: "10px" }} disabled={useOrbitControls}
            onClick={() => setMouseControls(!mouseControls)} >Mouse control {mouseControls ? 'on' : 'off'} </button>

          <button
            style={{ margin: "10px" }}
            onClick={() => setUseOrbitControls(!useOrbitControls)}
            disabled={mouseControls}
          >Orbit Controls {useOrbitControls ? 'on' : 'off'}
          </button>

          <br></br>
          <button style={{ marginBottom: "10px" }} onClick={() => handelLightOn(!lightOn)} >Light {lightOn ? "On" : "Off"}</button>

          <br></br>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light Color:
              <input
                type="color"
                disabled={!lightOn}
                value={lightColor}
                onChange={(e) => handelLightColour(e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }} />
              {" " + lightColor}
            </label>
          </div>

          <br></br>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light Intensity:
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                disabled={!lightOn}
                value={lightIntensity}
                onChange={(e) => handelLightIntensity(e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }} />
              {" " + lightIntensity}
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              colour Light X:
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={lightPosition.x}
                disabled={!lightOn}
                onChange={(e) => handleLightPositionChange("x", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }} />
              {" " + lightPosition.x}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              colour Light Y:
              <input
                type="range"
                min="-10"
                max="20"
                step="0.5"
                disabled={!lightOn}
                value={lightPosition.y}
                onChange={(e) => handleLightPositionChange("y", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }} />
              {" " + lightPosition.y}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              colour Light Z:
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                disabled={!lightOn}
                value={lightPosition.z}
                onChange={(e) => handleLightPositionChange("z", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }} />
              {" " + lightPosition.z}
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
            {/* <button
              onClick={playGLTFAnimation}
              disabled={isAnimating} // Optional: Disable the button while animating
              style={{ padding: "10px" }}
            >
              Play GLTF Animation
            </button>

            <button
              onClick={stopGLTFAnimation}
              style={{ padding: "10px" }}
            >
              Stop Animation
            </button> */}

            <button
              onClick={() => rotateModel(true, false, false, false)}
              style={{ padding: "10px" }}
              disabled={isAnimating}
            >
              Rotate Model 360°
            </button>

            <button
              onClick={() => rotateModel(true, true)}
              style={{ padding: "10px" }}
              disabled={isAnimating}
            >
              Rotate Model and Zoom
            </button>

            <button
              onClick={() => rotateModel(true, true, true)}
              style={{ padding: "10px" }}
              disabled={isAnimating}
            >
              Rotate Model, Zoom & moveLR
            </button>

            <button
              onClick={() => rotateModel(false, true, false, true)}
              style={{ padding: "10px" }}
              disabled={isAnimating}>
              Rotate Model Vertical , Zoom
            </button>

            <button
              onClick={() => rotateModel0(keyframes0, 3000)}
              style={{ padding: "10px" }}
              disabled={isAnimating}>
              Rotate Model0
            </button>

            <button
              onClick={() => rotateModel0(keyframes1, 2000)}
              style={{ padding: "10px" }}
              disabled={isAnimating}>
              Rotate Model1
            </button>

            <button
              onClick={() => rotateModel0(keyframes2, 3000)}
              style={{ padding: "10px" }}
              disabled={isAnimating}>
              Rotate Model1
            </button>

          </div>

        </div>

        {/* Left Canvas */}
        <div
          id="canvas"
          ref={mountRef}
          style={{
            width: "70%", // Adjust the width as needed
            height: "100%",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            position: "sticky", // Keeps it in place while scrolling
            top: 0, // Ensures it stays at the top
            overflow: "hidden",
          }}
        />

      </div>
    </>
  );

};

export default ThreejsOLD;