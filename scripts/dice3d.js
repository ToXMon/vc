// 3D Dice Rendering with Three.js
class Dice3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dice = [];
        this.isRolling = false;
        this.animationFrameId = null;
        this.resizeHandler = null;
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0e17);
        
        // Create camera
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Create dice
        this.createDice();
        
        // Add ground plane
        this.createGround();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize with stored reference for cleanup
        this.resizeHandler = () => this.onWindowResize();
        window.addEventListener('resize', this.resizeHandler);
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Point light for dramatic effect
        const pointLight = new THREE.PointLight(0x0ba6a6, 1, 50);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }
    
    createDice() {
        // Dice colors: green, red, yellow
        const colors = [0x2ecc71, 0xe74c3c, 0xf39c12];
        const positions = [-2.5, 0, 2.5];
        
        colors.forEach((color, index) => {
            const die = this.createDie(color);
            die.position.x = positions[index];
            die.position.y = 2;
            die.userData.index = index;
            die.userData.color = color;
            this.dice.push(die);
            this.scene.add(die);
        });
    }
    
    createDie(color) {
        // Create dice geometry
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        
        // Create materials for each face with numbers
        const materials = this.createDiceMaterials(color);
        
        const die = new THREE.Mesh(geometry, materials);
        die.castShadow = true;
        die.receiveShadow = true;
        
        // Add rounded edges effect with edge geometry
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges, 
            new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true })
        );
        die.add(line);
        
        return die;
    }
    
    createDiceMaterials(baseColor) {
        const materials = [];
        
        // Create a canvas for each face with dots
        for (let i = 1; i <= 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            // Background
            ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
            ctx.fillRect(0, 0, 128, 128);
            
            // Draw dots
            ctx.fillStyle = '#ffffff';
            this.drawDots(ctx, i);
            
            const texture = new THREE.CanvasTexture(canvas);
            materials.push(new THREE.MeshStandardMaterial({ 
                map: texture,
                metalness: 0.3,
                roughness: 0.7
            }));
        }
        
        return materials;
    }
    
    drawDots(ctx, number) {
        const dotRadius = 10;
        const positions = {
            1: [[64, 64]],
            2: [[32, 32], [96, 96]],
            3: [[32, 32], [64, 64], [96, 96]],
            4: [[32, 32], [96, 32], [32, 96], [96, 96]],
            5: [[32, 32], [96, 32], [64, 64], [32, 96], [96, 96]],
            6: [[32, 32], [96, 32], [32, 64], [96, 64], [32, 96], [96, 96]]
        };
        
        positions[number].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    createGround() {
        const geometry = new THREE.PlaneGeometry(20, 10);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2e,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    rollDice() {
        if (this.isRolling) return null;
        
        this.isRolling = true;
        const results = [];
        
        this.dice.forEach((die, index) => {
            // Generate random result (1-6)
            const result = Math.floor(Math.random() * 6) + 1;
            results.push(result);
            
            // Calculate rotation to show the correct face
            const targetRotations = this.getRotationForFace(result);
            
            // Add some random spinning for visual effect
            targetRotations.x += Math.PI * 4;
            targetRotations.y += Math.PI * 4;
            
            // Animate dice
            this.animateDie(die, targetRotations, index);
        });
        
        // After animation, resolve with results
        setTimeout(() => {
            this.isRolling = false;
        }, 2000);
        
        return results;
    }
    
    getRotationForFace(face) {
        // Return rotation that will show the specified face on top
        // Face mapping for Three.js BoxGeometry with 6 materials [right, left, top, bottom, front, back]
        const rotations = {
            1: { x: 0, y: 0, z: 0 },                    // Front face
            2: { x: 0, y: Math.PI / 2, z: 0 },          // Right face
            3: { x: -Math.PI / 2, y: 0, z: 0 },         // Top face
            4: { x: Math.PI / 2, y: 0, z: 0 },          // Bottom face
            5: { x: 0, y: -Math.PI / 2, z: 0 },         // Left face
            6: { x: 0, y: Math.PI, z: 0 }               // Back face
        };
        return { ...rotations[face] };
    }
    
    animateDie(die, targetRotations, index) {
        const startRotation = {
            x: die.rotation.x,
            y: die.rotation.y,
            z: die.rotation.z
        };
        const startPosition = die.position.y;
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (bounce)
            const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Rotate
            die.rotation.x = startRotation.x + (targetRotations.x - startRotation.x) * easeProgress;
            die.rotation.y = startRotation.y + (targetRotations.y - startRotation.y) * easeProgress;
            die.rotation.z = startRotation.z + (targetRotations.z - startRotation.z) * easeProgress;
            
            // Bounce
            if (progress < 0.5) {
                die.position.y = startPosition + Math.sin(progress * Math.PI * 2) * 2;
            } else {
                die.position.y = startPosition + (1 - progress) * 0.5;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                die.position.y = startPosition;
            }
        };
        
        animate();
    }
    
    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        // Gentle rotation when not rolling
        if (!this.isRolling) {
            this.dice.forEach((die, index) => {
                die.rotation.y += 0.002 * (index + 1);
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    destroy() {
        // Cleanup method to prevent memory leaks
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Cleanup Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.dice = [];
    }
    
    reset() {
        this.dice.forEach((die, index) => {
            die.rotation.set(0, 0, 0);
            die.position.y = 2;
        });
    }
}

// Export for use in main game script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dice3D;
}
