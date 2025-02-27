// this  code hase camera rotation prop , with all manual controlls with object movement and camera movement
'use client'

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';

// coment 

const ThreejsOLD = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const DlightRef = useRef(null);
  // const planeRef = useRef(null); 
  const [modelFile, setModelFile] = useState(null);
  const [model, setModel] = useState(null); 
  const [defaultModel, setDefaultModel] = useState(null);
  const [lightPosition, setLightPosition] = useState({ x: -4, y: 4, z: 5 });
  const [shadowOpacity, setShadowOpacity] = useState(0.3);
  const [shadowBlur, setShadowBlur] = useState(2);
  const [selectedMesh, setSelectedMesh] = useState(null);
  const [modelBounds, setModelBounds] = useState(null);
  const [selectedColorMesh, setSelectedColorMesh] = useState(null);
  const [colorChanged, setColorChanged] = useState(false);

  const [colorableMeshes, setColorableMeshes] = useState([]);




  // save position and color
  const [saveCam, setsaveCam] = useState([]);
  const [saveColour, setsaveColour] = useState([]);
  //---------------------------------------
  const [zoom, setZoom] = useState(50);
  const [radius, setRadius] = useState(5.5);
  const [azimuth, setAzimuth] = useState(1.57);
  const [polar, setPolar] = useState(Math.PI / 2);

  const [rendersize, setrendersize] = useState();

  const modelRef = useRef(null);
  const [modelMatenees, setmodelMatenees] = useState(0);
  const [modelRoughness, setmodelRoughness] = useState(0);
  const [modelTransmission, setModelTransmission] = useState(1);
  const [modelOpacity, setModelOpacity] = useState(1.0);

  const [isGlossy, setIsGlossy] = useState(true);

  let [camrotation, setcamrotation] = useState(0);

  const pivotRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#c0c0c0");
    sceneRef.current = scene;

    let camera = new THREE.PerspectiveCamera(20, currentMount.clientWidth / currentMount.clientHeight, 0.01, 10000);
    camera.position.set(0, 0, 5.5);
    camera.rotation.set(0, 0, 0);

    cameraRef.current = camera;

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

    const Dlight = new THREE.DirectionalLight('#ffffff', 0);
    Dlight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    Dlight.castShadow = false;
    Dlight.target.position.set(0, 0, 0);
    scene.add(Dlight.target);

    Dlight.shadow.mapSize.width = 2048;
    Dlight.shadow.mapSize.height = 2048;
    Dlight.shadow.camera.near = 0.01;
    Dlight.shadow.camera.far = 50; // Set a fixed shadow depth
    Dlight.shadow.bias = -0.0001; // Reduce shadow artifacts
    Dlight.shadow.radius = shadowBlur;


    scene.add(Dlight);
    DlightRef.current = Dlight;


    // const planeGeometry = new THREE.PlaneGeometry(2048, 2048);
    // const planeMaterial = new THREE.ShadowMaterial({
    //   opacity: shadowOpacity
    // });
    // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    // plane.rotation.x = -Math.PI / 2;
    // plane.receiveShadow = true;

    // planeRef.current = plane;

    // Initial position - will be updated when model loads
    // if (modelBounds) {
    //   updatePlanePosition(modelBounds);
    // }
    // scene.add(plane);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("draco/");
    loader.setDRACOLoader(dracoLoader);
    const loadModel = (gltf) => {

      if (gltf.cameras.length > 0) {
        let cam = gltf.cameras[0];
        camera = cam;
      }

      if (isGlossy == true) {

        gltf.scene.traverse((child) => {
          const Pmaterial = new THREE.MeshPhysicalMaterial({
            // Ensure transparency and glass effect
            transmission: 0,  // Fully transparent
            roughness: 0,     // Smooth surface for reflections
            metalness: 0,     // No metallic effect for plastic
            ior: 1.5,         // Glass-like refraction
            clearcoat: 0.4,     // Adds a shiny, glassy finish
            clearcoatRoughness: 0.1, // Smooth clearcoat finish
            thickness: 1,   // Adjust thickness if needed
            opacity: 1,       // Keep it fully opaque (even if transparent)
            transparent: true,
            specularColor: '#FEFEFE', // Reflective highlight
            emissiveIntensity: 0,  // No emissive effect for a realistic glass
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
            child.material.normalMapType = 0;  // Use no normal map if you want a smooth surface
            child.material.sheen = 0;  // No sheen effect for plastic
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
      } else {
        gltf.scene.traverse((child) => {
          child.frustumCulled = false;
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            child.material.flatShading = false;
            child.material.needsUpdate = true;
            child.geometry.computeVertexNormals();

            // Improve material quality
            if (child.material) {
              child.material.precision = "highp";
              child.encoding = THREE.sRGBEncoding

              if (child.material.map) {
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


      // scene.add(gltf.scene);

      const pivot = new THREE.Group();
      pivot.add(gltf.scene);

      scene.add(pivot);

      modelRef.current = gltf.scene;
      pivotRef.current = pivot;

      // Calculate model bounds
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);


      setModelBounds(box);

      // Update plane position based on new bounds
      // if (planeRef.current) {
      //   updatePlanePosition(box);
      // }
      return gltf.scene;
    };

    if (!modelFile) {
      loader.load("/Pill Bottle 3.glb", (gltf) => {
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

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomEffect = new BloomEffect({
      intensity: 1.5, // Adjust the intensity of the blur
      kernelSize: 5, // Adjust the blur kernel size
      luminanceThreshold: 0.1
    });
    composer.addPass(bloomEffect);


    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const width = currentMount.clientWidth;
      const height = currentMount.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      setDefaultModel(null);
      scene.remove(modelRef.current);
      modelRef.current = null;
      composer.dispose();
      bloomEffect.dispose();
      renderer.dispose();
    };
  }, [modelFile, isGlossy]); //isGlossy  

  useEffect(() => {
    if (DlightRef.current) {
      DlightRef.current.position.set(
        lightPosition.x,
        lightPosition.y,
        lightPosition.z
      );
      DlightRef.current.lookAt(0, 0, 0)
    }

  }, [lightPosition]);

  // useEffect(() => {
  //   if (planeRef.current) {
  //     planeRef.current.material.opacity = shadowOpacity;
  //   }
  // }, [shadowOpacity]);

  // useEffect(() => {
  //   if (planeRef.current) {
  //     planeRef.current.material.needsUpdate = true;
  //   }
  // }, [shadowBlur]);

  useEffect(() => {
    if (model) {
      setSelectedMesh(null);
    }
  }, [model]);

  // useEffect(() => {
  //   if (modelBounds) {
  //     updatePlanePosition(modelBounds);
  //   }
  // }, [modelBounds]);


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

  // mouse constrols 

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mouseControls, setMouseControls] = useState(false);

  useEffect(() => {
    const onMouseMove = (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;

      // Apply rotation to the model based on mouse movement
      if (modelRef.current && pivotRef.current) {
        // Rotate only on one axis at a time
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Lock vertical movement and rotate around Y-axis (horizontal)
          pivotRef.current.rotation.y += deltaX * 0.01; // Rotate around Y-axis (horizontal)
        } else {
          // Lock horizontal movement and rotate around X-axis (vertical)
          pivotRef.current.rotation.x += deltaY * 0.01; // Rotate around X-axis (vertical)
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

    // Attach mouse events to the canvas, not the window
    const canvas = mountRef.current;
    if (canvas && mouseControls) {
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mousemove', onMouseMove);
    }

    if(!mouseControls && pivotRef.current){
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);

      pivotRef.current.rotation.x = 0;
      pivotRef.current.rotation.y =0;
    }

    

    return () => {
      // Clean up event listeners when component unmounts
      const canvas = mountRef.current;
      if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mousemove', onMouseMove);
      }
    };
  }, [isMouseDown, lastMousePos, mouseControls]);

  useEffect(() => {
    if(mouseControls){
      handelResetPosition();
    }
  },[mouseControls])


  const handleFileChange = (event) => {
    setModelFile(event.target.files[0]);
    setSelectedMesh(null);
    setColorChanged(false); // Reset color changed flag for new model
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
        const texture = new THREE.TextureLoader().load(e.target.result);
        texture.flipY = false;

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.encoding = THREE.sRGBEncoding;  // Ensure correct color encoding
        texture.minFilter = THREE.NearestMipmapLinearFilter;
        texture.generateMipmaps = true;  // Enable mipmap generation
        texture.magFilter = THREE.LinearFilter;  // Use linear filter for magnification
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = rendererRef.current.capabilities.getMaxAnisotropy();

        texture.mapping = THREE.UVMapping;
        selectedMesh.material.map = texture;
        selectedMesh.material.needsUpdate = true;
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


  // const updatePlanePosition = (bounds) => {
  //   if (!planeRef.current || !bounds) return;

  //   const modelHeight = bounds.max.y - bounds.min.y;
  //   const offset = modelHeight * 0.5;
  //   planeRef.current.position.y = bounds.min.y - offset;
  // };

  //------------------------------------------new changes-------------------------------------------------
  const handleColorChange = (event) => {
    const newColor = event.target.value;
    console.log(newColor);

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
    // const selected = colorableMeshes.find((mesh) => mesh.name === meshName);
    const mesh = model.getObjectByName(meshName);

    setSelectedColorMesh(mesh);
  };



  // const handleZoomChange = (event) => {
  //   const newZoom = parseInt(event.target.value);

  //   setZoom(newZoom);
  //   const newRadius = 10 - (newZoom / 11);
  //   setRadius(newRadius);

  //   // Recalculate position using current angles and new radius
  //   const x = newRadius * Math.sin(polar) * Math.cos(azimuth);
  //   const z = newRadius * Math.sin(polar) * Math.sin(azimuth);
  //   const y = newRadius * Math.cos(polar);

  //   // Update camera position
  //   cameraRef.current.position.set(x, y, z);
  //   cameraRef.current.lookAt(0, 0, 0);
  //   cameraRef.current.rotation.z = camrotation;
  // };

  // const handleAzimuthChange = (event) => {

  //   const angle = parseFloat(event.target.value) * Math.PI / 180;
  //   setAzimuth(angle);
  //   // Calculate new position on sphere
  //   const x = radius * Math.sin(polar) * Math.cos(angle);
  //   const z = radius * Math.sin(polar) * Math.sin(angle);
  //   const y = radius * Math.cos(polar);

  //   cameraRef.current.position.set(x, y, z);
  //   cameraRef.current.lookAt(0, 0, 0);
  //   cameraRef.current.rotation.z = camrotation;
  // };

  // const handlePolarChange = (event) => {
  //   const angle = parseFloat(event.target.value) * Math.PI / 180;
  //   setPolar(angle);
  //   // Calculate new position on sphere
  //   const x = radius * Math.sin(angle) * Math.cos(azimuth);
  //   const z = radius * Math.sin(angle) * Math.sin(azimuth);
  //   const y = radius * Math.cos(angle);

  //   cameraRef.current.position.set(x, y, z);
  //   cameraRef.current.lookAt(0, 0, 0);
  //   cameraRef.current.rotation.z = camrotation;
  // };

  // const handelCameraRotation = (event) => {
  //   let val = parseFloat(event.target.value);
  //   cameraRef.current.rotation.z = val;
  //   setcamrotation(val);
  // }

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
  
  // Helper function to update camera position and rotation
  const updateCameraPosition = (r, p, a, rotation) => {
    if (!cameraRef.current) return;
  
    // Calculate camera position on sphere
    const x = r * Math.sin(p) * Math.cos(a);
    const z = r * Math.sin(p) * Math.sin(a);
    const y = r * Math.cos(p);
  
    // Update camera position
    cameraRef.current.position.set(x, y, z);
    
    // Make camera look at center
    cameraRef.current.lookAt(0, 0, 0);
    
    // Apply rotation after lookAt
    cameraRef.current.rotateZ(rotation);
    
    // Update camera matrix
    cameraRef.current.updateMatrix();
    cameraRef.current.updateMatrixWorld();
  };

  const handelResetPosition = () => {
    setZoom(50);
    setRadius(5.5);
    setAzimuth(1.57);
    setPolar(Math.PI / 2);
    setcamrotation(0);
    updateCameraPosition(5.5, Math.PI / 2, 1.57, 0);
  };



  const handelHDR = (event) => {
    const file = event?.target?.files[0];

    if (file) {
      const url = URL.createObjectURL(file);
      const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current);
      pmremGenerator.compileEquirectangularShader();

      const loader = new RGBELoader();
      loader.load(url, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        sceneRef.current.environment = null;
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        sceneRef.current.environment = envMap;
        pmremGenerator.dispose();
      });
    }

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
    setModelOpacity(value);  // Track opacity value

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.isMeshPhysicalMaterial || mat.isMeshStandardMaterial) {
                mat.opacity = value;
                mat.transparent = value < 1;  // Enable transparency when opacity < 1
              }
            });
          } else {
            if (child.material.isMeshPhysicalMaterial || child.material.isMeshStandardMaterial) {
              child.material.opacity = value;
              child.material.transparent = value < 1;  // Enable transparency when opacity < 1
            }
          }
        }
      });
    }
  };







  return (
    <>
      <div style={{ display: "flex", alignContent: "space-between", height: "100vh", width: "140vh", padding: "10px" }}>

        <div style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
          <label>
            Select Model :
            <input
              type="file"
              accept=".glb"
              onChange={handleFileChange}
              style={{ marginBottom: "10px" }}
            />
          </label>

          <button style={{ marginBottom: "10px" }} onClick={() => setIsGlossy(!isGlossy)} >Matterial Change to {isGlossy ? "Matt" : "Glossy"}</button>

          <div style={{ marginBottom: "10px" }}>
            <label>
              Select Mesh:
              <select
                onChange={handleMeshSelection}
                style={{ marginLeft: "10px" }}
              >
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
                value={selectedColorMesh?.name || ""}
              >
                <option value="">Select mesh</option>
                {colorableMeshes.map((mesh) => (
                  <option key={mesh.name} value={mesh.name}>
                    {mesh.name}
                  </option>
                ))}

              </select>
              <input
                type="color"
                value={colorChanged}
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
                value={selectedColorMesh?.name || ""}
              >
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
              value={modelMatenees}
              onChange={handelMetalnessChange}
            />
            {" " + parseInt(modelMatenees * 100) + '%'}
          </div>

          <div style={{ margin: '10px' }}>
            <label>Roughness</label>
            <input
              type="range"
              min="0"
              max="1"
              step={0.01}
              value={modelRoughness}
              onChange={handelRoughnessChange}
            />
            {" " + parseInt(modelRoughness * 100) + '%'}
          </div>



          <div style={{ margin: '10px' }}>
            <label> Opacity </label>
            <input
              type="range"
              min="0"
              max="1.0"
              step={0.1}
              value={modelOpacity}
              onChange={handleOpacityChange}
            />
            {" " + parseInt(modelOpacity * 100) + '%'}
          </div>

          <div style={{ marginBottom: "10px" }} >
            <label>
              Select hdr Image:
              <input
                type="file"
                accept=".hdr"
                onChange={handelHDR}
                style={{ marginBottom: "10px" }}
              />
            </label>
          </div>


          <div style={{ margin: '10px' }}>
            <label>Zoom</label>
            <input
              type="range"
              min="1"
              max="100"
              step='1'
              // disabled={mouseControls}
              value={zoom}
              onChange={handleZoomChange}
            />
            {" " + parseInt(zoom)}
          </div>

          <div style={{ margin: '10px' }}>
            <label>Horizontal Rotation </label>
            <input
              type="range"
              min="0"
              max="360"
              disabled={mouseControls}
              value={azimuth * 180 / Math.PI}
              onChange={handleAzimuthChange}
            />

          </div>
          <div style={{ margin: '10px' }}>
            <label>Vertical Rotation</label>
            <input
              type="range"
              min="0"
              max="180"
              disabled={mouseControls}
              value={polar * 180 / Math.PI}
              onChange={handlePolarChange}
            />
          </div>

          <div style={{ margin: '10px' }}>
            <label>camera Rotation</label>
            <input
              type="range"
              min="0"
              max="6.28"
              step='0.01'
              disabled={mouseControls}
              value={camrotation}
              onChange={(e) => handelCameraRotation(e)}
            />
            {" " + camrotation}
          </div>


          <button
            onClick={() => handleDownloadImage("png")}
            style={{ margin: "10px" }}>
            Download PNG
          </button>

          <br></br>
          <button style={{ margin: "10px" }} onClick={()=>setMouseControls(!mouseControls)} >Mouse control {mouseControls ? 'on' : 'off'} </button>
          <br></br>
          <button style={{ margin: "10px" }} onClick={()=>handelResetPosition()} >Reset Position </button>

        </div>
        <div
          ref={mountRef}
          style={{
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            border: "1px solid #ccc"
          }}
        />
      </div>
    </>
  );
};

export default ThreejsOLD;
