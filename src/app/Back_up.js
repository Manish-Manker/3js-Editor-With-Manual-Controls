// this  code hase camera rotation prop 
'use client'

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';

import { FlyControls } from 'three/addons/controls/FlyControls.js';

import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper";

const ThreejsOLD = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const DlightRef = useRef(null);
  const planeRef = useRef(null);
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

  // const [modelColor, setModelColor] = useState("#ffffff");

  const [OrbitControls0, setOrbitControls0] = useState(true);
  // const OrbitControlRef = useRef(null);

  const [FlyControls0, setFlyControls0] = useState(false);
  // const FlyControlRef = useRef(null);
  const BackimgRef = useRef(null);

  // save position and color
  const [saveCam, setsaveCam] = useState([]);
  const [saveColour, setsaveColour] = useState([]);
  //---------------------------------------
  const [zoom, setZoom] = useState(50);
  const [radius, setRadius] = useState(5.5);
  const [azimuth, setAzimuth] = useState(1.57);
  const [polar, setPolar] = useState(Math.PI / 2);

  const [rendersize, setrendersize] = useState();
  const [OrthographicView, setOrthographicView] = useState(false);

  const [bgImg, setbgImg] = useState(null);

  const modelRef = useRef(null);
  const [modelMatenees, setmodelMatenees] = useState(0);
  const [modelRoughness, setmodelRoughness] = useState(0);
  const [modelTransmission, setModelTransmission] = useState(1);
  const [modelOpacity, setModelOpacity] = useState(1.0);

  const [isGlossy, setIsGlossy] = useState(true);

  // new chnages 
  const RlightRef = useRef(null);
  const [lightOn, setLightOn] = useState(false);
  const [lightColor, setLightColor] = useState("#ffffff");
  const [lightIntensity, setLightIntensity] = useState(1);
  const [lightSize, setlightSize] = useState({ h: 1, w: 1 });

  let [camrotation, setcamrotation] = useState(0);


  useEffect(() => {
    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    handleBackgroundImageChange(bgImg) // set the bg-img on load
    scene.background = new THREE.Color("#c0c0c0");
    sceneRef.current = scene;

    let camera;

    if (OrthographicView == true) {
      camera = new THREE.OrthographicCamera(
        -currentMount.clientWidth / 2,
        currentMount.clientWidth / 2,
        currentMount.clientHeight / 2,
        -currentMount.clientHeight / 2,
        0.2,
        1000
      );
      camera.position.set(0, 0, 5.5);
      camera.zoom = 600
      cameraRef.current = camera;
      // setOrbitControls0(false);
    } else if (OrthographicView == false) {
      camera = new THREE.PerspectiveCamera(20, currentMount.clientWidth / currentMount.clientHeight, 0.01, 10000);
      camera.position.set(0, 0, 5.5);
      camera.rotation.set(0, 0, 0);
      // setOrbitControls0(true);
    }

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

    // new chnages 
    let Intensity = lightOn ? lightIntensity : 0;
    const reactLight = new THREE.RectAreaLight(lightColor, Intensity, lightSize.w, lightSize.h);
    reactLight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    reactLight.lookAt(0, 0, 0)

    RlightRef.current = reactLight;

    const rectLightHelper = new RectAreaLightHelper(reactLight);
    reactLight.add(rectLightHelper);

    scene.add(reactLight);

    const Dlight = new THREE.DirectionalLight('#ffffff', 0);
    // const Dlight = new THREE.DirectionalLight(lightColor, Intensity);
    Dlight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    Dlight.castShadow = true;
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

    const planeGeometry = new THREE.PlaneGeometry(500, 500);
    const planeMaterial = new THREE.ShadowMaterial({
      opacity: shadowOpacity
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;

    planeRef.current = plane;

    // Initial position - will be updated when model loads
    if (modelBounds) {
      updatePlanePosition(modelBounds);
    }
    scene.add(plane);

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.1;
    // controls.enabled = OrbitControls0;
    // controls.screenSpacePanning = true;
    // controls.enablePan = true;
    // controls.maxDistance = 30;
    // controls.minDistance = 2;

    // OrbitControlRef.current = controls;

    // let controlsf = new FlyControls(camera, renderer.domElement);
    // controlsf.movementSpeed = 10;
    // controlsf.rollSpeed = 0.001;
    // controlsf.autoForward = false;
    // controlsf.dragToLook = true;
    // controlsf.enabled = FlyControls0;

    // FlyControlRef.current = controlsf;

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
              // child.material.roughness = 1;
              // child.material.metalness = 0.3;
              // child.material.specular = new THREE.Color(0x000000);
              // child.material.shininess = 100;
              // child.material.reflectivity = 0;
              if (child.material.map) {
                child.material.map.anisotropy =
                  renderer.capabilities.getMaxAnisotropy();
                child.material.map.minFilter = THREE.LinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.generateMipmaps = true;
                // child.material.map.colorSpace = THREE.SRGBColorSpace;
              }
            }
          }
        });
      }


      scene.add(gltf.scene);
      modelRef.current = gltf.scene;

      // Calculate model bounds
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      gltf.scene.position.sub(center);

      setModelBounds(box);

      // Update plane position based on new bounds
      if (planeRef.current) {
        updatePlanePosition(box);
      }
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
        console.log(event.target.result);

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
      // controlsf.update(0.01);
      // controls.update();
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      // composer.render();
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
    handleResize(); // Call once to set initial size

    return () => {
      if (currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      window.removeEventListener("resize", handleResize);
      setDefaultModel(null);
      scene.remove(modelRef.current);
      modelRef.current = null;
      // camera.dispose();
      // controls.dispose();
      // controlsf.dispose();
      composer.dispose();
      bloomEffect.dispose();
      // renderer.forceContextLoss();
      renderer.dispose();
    };
  }, [modelFile, OrthographicView, isGlossy]); //isGlossy  

  useEffect(() => {
    if (DlightRef.current) {
      DlightRef.current.position.set(
        lightPosition.x,
        lightPosition.y,
        lightPosition.z
      );
      DlightRef.current.lookAt(0, 0, 0)
    }
    // new chnages --
    if (RlightRef.current) {
      RlightRef.current.position.set(
        lightPosition.x,
        lightPosition.y,
        lightPosition.z
      );
      RlightRef.current.lookAt(0, 0, 0);
    }

  }, [lightPosition]);

  useEffect(() => {
    if (planeRef.current) {
      planeRef.current.material.opacity = shadowOpacity;
    }
  }, [shadowOpacity]);

  useEffect(() => {
    if (planeRef.current) {
      planeRef.current.material.needsUpdate = true;
    }
  }, [shadowBlur]);

  useEffect(() => {
    if (model) {
      setSelectedMesh(null); // Reset selected mesh when model changes
      // setModelColor("#ffffff");
    }
  }, [model]);

  useEffect(() => {
    if (modelBounds) {
      updatePlanePosition(modelBounds);
    }
  }, [modelBounds]);

  useEffect(() => {
    // OrbitControlRef.current.enabled = OrbitControls0;
    console.log(sceneRef.current);

  }, [OrbitControls0]);

  // useEffect(() => {
  //   FlyControlRef.current.enabled = FlyControls0;
  // }, [FlyControls0]);

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

  const handleShadowOpacityChange = (value) => {
    const newOpacity = parseFloat(value);
    setShadowOpacity(newOpacity);
    if (planeRef.current) {
      planeRef.current.material.opacity = newOpacity;
      planeRef.current.material.needsUpdate = true;
    }
  };

  const handleShadowBlurChange = (value) => {
    const newBlur = parseFloat(value);
    setShadowBlur(newBlur);
    if (DlightRef.current) {
      DlightRef.current.shadow.radius = newBlur;
    }
  };

  const updatePlanePosition = (bounds) => {
    if (!planeRef.current || !bounds) return;

    const modelHeight = bounds.max.y - bounds.min.y;
    const offset = modelHeight * 0.5;
    planeRef.current.position.y = bounds.min.y - offset;
  };

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

  const handleSavePosition = () => {
    setsaveCam([
      ...saveCam,
      {
        position: cameraRef.current.position.clone(),
        rotation: cameraRef.current.rotation.clone(),
        lightPosition: DlightRef.current.position.clone(),
      },
    ]);

  };

  //------------------------------------------new changes-------------------------------------------------

  // camera controllers
  const handleChangePosition = (event) => {
    const selectedIndex = event.target.value;
    if (selectedIndex !== "") {
      const selectedPosition = saveCam[selectedIndex];
      cameraRef.current.position.copy(selectedPosition.position);
      cameraRef.current.rotation.copy(selectedPosition.rotation);
      DlightRef.current.position.copy(selectedPosition.lightPosition);

    }
  };

  const handleZoomChange = (event) => {
    const newZoom = parseInt(event.target.value);

    setZoom(newZoom);
    const newRadius = 10 - (newZoom / 11);
    setRadius(newRadius);

    // Recalculate position using current angles and new radius
    const x = newRadius * Math.sin(polar) * Math.cos(azimuth);
    const z = newRadius * Math.sin(polar) * Math.sin(azimuth);
    const y = newRadius * Math.cos(polar);

    // Update camera position
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.rotation.z = camrotation;
    // console.log(cameraRef.current.rotation.z);

  };

  const handleAzimuthChange = (event) => {

    const angle = parseFloat(event.target.value) * Math.PI / 180;
    setAzimuth(angle);
    // Calculate new position on sphere
    const x = radius * Math.sin(polar) * Math.cos(angle);
    const z = radius * Math.sin(polar) * Math.sin(angle);
    const y = radius * Math.cos(polar);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.rotation.z = camrotation;

  };

  const handlePolarChange = (event) => {
    const angle = parseFloat(event.target.value) * Math.PI / 180;
    setPolar(angle);
    // Calculate new position on sphere
    const x = radius * Math.sin(angle) * Math.cos(azimuth);
    const z = radius * Math.sin(angle) * Math.sin(azimuth);
    const y = radius * Math.cos(angle);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.rotation.z = camrotation;
  };

  const handelCameraRotation = (event) => {
    let val = parseFloat(event.target.value);
    cameraRef.current.rotation.z = val;
    setcamrotation(val);
  } 

  const handelResetPosition = () => {

    handleZoomChange({ target: { value: 50 } });
    handleAzimuthChange({ target: { value: 90 } });
    handlePolarChange({ target: { value: 90 } });
    handelCameraRotation({ target: { value: 0 } });
  }


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


  const handleBackgroundImageChange = (event) => {
    const file = event?.target?.files[0];

    setbgImg(event);

    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const texture = new THREE.TextureLoader().load(e.target.result);

        texture.colorSpace = THREE.SRGBColorSpace;

        sceneRef.current.background = texture;
      };
      reader.readAsDataURL(file);
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

  const handleTransmissionChange = (event) => {
    let model = modelRef.current;
    let value = parseFloat(event.target.value);
    let mesh = selectedColorMesh;
    setModelTransmission(value);  // Track transmission value

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat.isMeshPhysicalMaterial) {
                mat.transmission = value;  // Set transmission to the value (for physical materials)
              }
            });
          } else {
            if (child.material.isMeshPhysicalMaterial) {
              child.material.transmission = value;
            }
          }
        }
      });
    }
  };

  const checkMaterialType = () => {
    let model = modelRef.current; // Your model reference
    let mesh = selectedColorMesh; // The selected mesh

    if (model && mesh) {
      mesh.traverse((child) => {
        if (child.isMesh) {
          // Check the material type
          if (Array.isArray(child.material)) {
            child.material.forEach((mat, index) => {
              console.log(`Material ${index}:`, mat);
              console.log(`Material ${index} Type:`, mat.constructor.name);
            });
          } else {
            console.log('Material:', child.material);
            console.log('Material Type:', child.material.constructor.name);
          }
        }
      });
    }
  };

  const handelLightOn = (val) => {
    if (val) {
      RlightRef.current.intensity = lightIntensity;
    } else {
      RlightRef.current.intensity = 0;
    }
    setLightOn(val);
  };

  const handelLightIntensity = (val) => {
    RlightRef.current.intensity = val;
    setLightIntensity(val);
  }

  const handelLightColour = (val) => {
    const color = new THREE.Color(val);
    RlightRef.current.color = color;
    setLightColor(val);
  };

  const habdelLishtSize = (val, ratio) => {
    const size = parseFloat(val);
    let newSize = {
      h: lightSize.h,
      w: lightSize.w
    }

    RlightRef.current.height = size;
    RlightRef.current.width = size;
    newSize.h = size
    newSize.w = size
    setlightSize(newSize)

    // if (ratio == 'height') {
    //   RlightRef.current.height = size;
    //   newSize.h = size
    //   setlightSize(newSize)
    // } else if (ratio == 'width') {
    //   RlightRef.current.width = size;
    //   newSize.w = size
    //   setlightSize(newSize)
    // }
  }


  // const handelLightOn = (val) => {
  //   if (val) {
  //     DlightRef.current.intensity = lightIntensity ;
  //    } else {
  //     DlightRef.current.intensity = 0;
  //    }
  //    setLightOn(val);
  //  };

  //  const handelLightIntensity = (val) => {
  //   DlightRef.current.intensity = val;
  //    setLightIntensity(val);
  //  }

  //  const handelLightColour = (val) => {
  //    const color = new THREE.Color(val);
  //    DlightRef.current.color = color;
  //    setLightColor(val);
  //  };

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
              disabled={OrthographicView}
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

          <button style={{ marginBottom: "10px" }} onClick={() => handelLightOn(!lightOn)} >Light {lightOn ? "On" : "Off"}</button>

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
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightIntensity}
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light height:
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                disabled={!lightOn}
                value={lightSize.h}
                onChange={(e) => habdelLishtSize(e.target.value, 'height')}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightSize.h}
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light width:
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                disabled={!lightOn}
                value={lightSize.w}
                onChange={(e) => habdelLishtSize(e.target.value, 'width')}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightSize.w}
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light Color:
              <input
                type="color"
                disabled={!lightOn}
                value={lightColor}
                onChange={(e) => handelLightColour(e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightColor}
            </label>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light X:
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={lightPosition.x}
                onChange={(e) => handleLightPositionChange("x", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightPosition.x}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light Y:
              <input
                type="range"
                min="-10"
                max="20"
                step="0.5"
                value={lightPosition.y}
                onChange={(e) => handleLightPositionChange("y", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightPosition.y}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Light Z:
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={lightPosition.z}
                onChange={(e) => handleLightPositionChange("z", e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + lightPosition.z}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Shadow Opacity:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={shadowOpacity}
                onChange={(e) => handleShadowOpacityChange(e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + shadowOpacity}
            </label>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Shadow Blur:
              <input
                type="range"
                min="0"
                max="10"
                step="0.2"
                value={shadowBlur}
                onChange={(e) => handleShadowBlurChange(e.target.value)}
                style={{ marginLeft: "10px", verticalAlign: "middle" }}
              />
              {" " + shadowBlur}
            </label>
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

                {/* <option>select mesh</option>
                {model &&
                  model.children
                    .filter((child) => child.isMesh)
                    .map((child) => (
                      <option key={child.name} value={child.name}>
                        {child.name}
                      </option>
                    ))} */}

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
              // disabled={OrthographicView}
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
              // disabled={OrthographicView}
              onChange={handelRoughnessChange}
            />
            {" " + parseInt(modelRoughness * 100) + '%'}
          </div>

          <div style={{ margin: '10px' }}>
            <label> Transparency </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step={0.1}
              value={modelTransmission}
              onChange={handleTransmissionChange}
            />
            {" " + parseInt(modelTransmission * 100) + '%'}
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
              Select Background Image:
              <input
                type="file"
                accept=".jpg, .png"
                onChange={handleBackgroundImageChange}
                style={{ marginBottom: "10px" }}
              />
            </label>
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

          <div style={{ marginBottom: "10px" }}>
            <button onClick={() => setOrbitControls0(!OrbitControls0)}>
              OrbitControls {OrbitControls0 ? "on" : "off"}{" "}
            </button>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <button onClick={() => setFlyControls0(!FlyControls0)}>
              FlyControls {FlyControls0 ? "on" : "off"}{" "}
            </button>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <button onClick={() => { setOrthographicView(!OrthographicView) }}>
              Orthographic view {OrthographicView ? "on" : "off"}
            </button>
          </div>


          <button style={{ marginBottom: "10px" }} onClick={handleSavePosition}>
            Save Model Position
          </button>

          <label style={{ margin: "10px", display: "flex" }}>
            Set Model Position
            <select onChange={handleChangePosition} disabled={OrthographicView}>
              <option value="">Select Position</option>
              {saveCam.map((p, indx) => (
                <option key={indx} value={indx}>{`Position ${indx + 1
                  }`}</option>
              ))}
            </select>
          </label>

          <div style={{ margin: '10px' }}>
            <label>Zoom</label>
            <input
              type="range"
              min="1"
              max="100"
              // step={1}
              value={zoom}
              disabled={OrthographicView}
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
              value={azimuth * 180 / Math.PI}
              disabled={OrthographicView}
              onChange={handleAzimuthChange}
            />
            
          </div>
          <div style={{ margin: '10px' }}>
            <label>Vertical Rotation</label>
            <input
              type="range"
              min="0"
              max="180"
              value={polar * 180 / Math.PI}
              disabled={OrthographicView}
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
              value={camrotation}
              // disabled={OrthographicView}
              onChange={(e) => handelCameraRotation(e)}
            />
            {" " + camrotation}
          </div>

          <button style={{ marginBottom: "10px" }} onClick={handelResetPosition}>
            Reset Position
          </button>


          <button
            onClick={() => console.log(modelRef.current)}
            style={{ marginBottom: "10px" }}
          >
            Get camera positoin
          </button>

          <button
            onClick={() => handleDownloadImage("png")}
            style={{ marginBottom: "10px" }}
          >
            Download PNG
          </button>
          <button
            onClick={() => checkMaterialType()}
            style={{ marginBottom: "10px" }}
          >
            Save Position
          </button>
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
