import * as THREE from 'three';

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 90;
const aspect = w / h;
const near = 0.1;
const far = 10;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

const scene = new THREE.Scene();

// Create the grid of dots
const dotGeo = new THREE.SphereGeometry(0.01, 16, 16);
const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const gridDots = [];
for (let x = -9; x <= 9; x += 0.25) {
    for (let y = -9; y <= 9; y += 0.25) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(x, y, 0);
        scene.add(dot);
        gridDots.push(dot);
    }
}

function createTextTexture(text, fontSize = 100, fontFamily = 'Cambria') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const scale = window.devicePixelRatio || 1;
    canvas.width = 1024 * scale;
    canvas.height = 256 * scale;

    context.scale(scale, scale);
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / (2 * scale), canvas.height / (2 * scale));

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function createTextPlane(text, position, size = 1) {
    const texture = createTextTexture(text);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(size, size / 2);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(position.x, position.y, position.z || 0.1);
    return plane;
}

// Create individual text planes for "2", "0", and "4"
const text2_1 = createTextPlane('2', { x: -0.75, y: 0 }, 6); // Increased size
const text0 = createTextPlane('0', { x: -0.25, y: 0 }, 6); // Increased size
const text2_2 = createTextPlane('2', { x: 0.25, y: 0 }, 6); // Increased size
const text4 = createTextPlane('4', { x: 0.75, y: 0 }, 6); // Increased size

// Create "5" and "Happy New Year" planes
const text5 = createTextPlane('5', { x: 0.75, y: 5, z: 0.1 }, 1.5); // Increased size
const happyNewYear = createTextPlane('Happy New Year!', { x: 0, y: 0, z: 0.1 }, 6);
happyNewYear.rotation.x = Math.PI; // Store it upside down
happyNewYear.visible = false;

scene.add(text2_1);
scene.add(text0);
scene.add(text2_2);
scene.add(text4);
scene.add(text5);
scene.add(happyNewYear);

// Animation state
let isAnimating = false;
let currentStep = 0;
const animationDuration = 1000; // milliseconds
let startTime = null;

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle click events
renderer.domElement.addEventListener('click', (event) => {
    if (!isAnimating && text4.visible === true) {
        text5.visible = true;
        mouse.x = (event.clientX / w) * 2 - 1;
        mouse.y = -(event.clientY / h) * 2 + 1;

        // Raycast to detect clicks on the "4"
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(text4);

        if (intersects.length > 0) {
            isAnimating = true;
            startTime = Date.now();
            currentStep = 0;
        }
    }
});

const ringGeometry = new THREE.RingGeometry(0.4, 0.45, 32);
const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.position.z = 0.05;
ring.position.x = 0.75; // Match text4's x position
scene.add(ring);

const confetti = [];
const confettiGeometry = new THREE.PlaneGeometry(0.05, 0.05); // Increased size (0.05 instead of 0.02)
const confettiColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]; // Added more colors

for (let i = 0; i < 500; i++) { // Increased from 250 to 500 particles
    const confettiMaterial = new THREE.MeshBasicMaterial({
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(confettiGeometry, confettiMaterial);

    particle.position.set(
        (Math.random() - 0.5) * 5, // Increased spread (4 instead of 2)
        2, // Start above the visible area
        (Math.random() - 0.5) // Small z-spread
    );

    particle.userData.velocity = {
        x: (Math.random() - 0.5) * 0.03, // Increased horizontal speed
        y: -0.02 - Math.random() * 0.02, // Increased vertical speed
        rot: (Math.random() - 0.5) * 0.1 // Increased rotation speed
    };

    particle.visible = false;
    scene.add(particle);
    confetti.push(particle);
}

// Add fragment geometry and material
const fragmentGeometry = new THREE.PlaneGeometry(0.05, 0.05); // Size of each fragment
const fragmentMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
const fragments = [];

// Create fragments
for (let x = -1; x <= 1; x += 0.1) {
    for (let y = -1; y <= 1; y += 0.1) {
        const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
        fragment.position.set(x, y, 0);
        fragment.visible = false;
        scene.add(fragment);
        fragments.push(fragment);
    }
}

// Function to animate the crumble effect
function animateCrumble(duration) {
    const crumbleStartTime = Date.now();

    function crumble() {
        const elapsed = Date.now() - crumbleStartTime;
        const progress = Math.min(elapsed / duration, 1);

        fragments.forEach(fragment => {
            if (progress > 0) {
                fragment.visible = true;
                fragment.position.z -= 0.1 * progress;
                fragment.position.x += (Math.random() - 0.5) * 0.1 * progress;
                fragment.position.y += (Math.random() - 0.5) * 0.1 * progress;
                fragment.rotation.z += (Math.random() - 0.5) * 0.1 * progress;
            }
        });

        if (progress < 1) {
            requestAnimationFrame(crumble);
        } else {
            // Reset the scene after crumble effect
            resetAnimation();
        }
    }

    crumble();
}

// Modify the fadeOutScene function to exclude fragments from fade-out
function fadeOutScene(duration) {
    const fadeStartTime = Date.now();

    function fade() {
        const elapsed = Date.now() - fadeStartTime;
        const progress = Math.min(elapsed / duration, 1);

        // Fade out the entire scene except fragments
        scene.traverse((object) => {
            if (object.material && !fragments.includes(object)) {
                object.material.opacity = 1 - progress;
            }
        });

        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            // Start the crumble effect after fade-out
            animateCrumble(2000); // 2-second crumble effect
        }
    }

    fade();
}

// Update reset function to include fragment reset
function resetAnimation() {
    text2_1.visible = true;
    text0.visible = true;
    text2_2.visible = true;
    text5.visible = true;
    happyNewYear.visible = false;
    scene.rotation.x = 0;
    text4.position.y = 0;
    text4.material.opacity = 1;
    text5.material.opacity = 1;
    happyNewYear.material.opacity = 1;

    // Reset effects
    ring.material.opacity = 0;
    ring.scale.setScalar(1);
    ring.rotation.z = 0;

    // Reset confetti
    confetti.forEach(particle => {
        particle.visible = false;
        particle.position.set(
            (Math.random() - 0.5) * 2,
            2,
            (Math.random() - 0.5)
        );
        particle.material.opacity = 1;
    });

    // Reset fragments
    fragments.forEach(fragment => {
        fragment.visible = false;
        fragment.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            0
        );
        fragment.rotation.z = 0;
        fragment.material.opacity = 1;
    });

    // Reset opacity for all objects
    scene.traverse((object) => {
        if (object.material) {
            object.material.opacity = 1;
        }
    });

    setTimeout(() => {
        let resetStartTime = Date.now();
        const resetDuration = 1000; // 1 second reset animation

        function resetPositions() {
            const elapsed = Date.now() - resetStartTime;
            const progress = Math.min(elapsed / resetDuration, 1);

            // Animate "4" back to its original position
            text4.visible = true;
            text4.position.y = -1 * (1 - progress); // Move "4" back to y = 0

            // Animate "5" back to its original position
            text5.position.y = 5 * progress; // Move "5" back to y = 5
            console.log(text5.position.y)

            if (progress < 1) {
                requestAnimationFrame(resetPositions);
            }

            if (text4.position.y === 0) {
                text5.visible = false;
            }


        }

        resetPositions();
    }, 1500); // 1.5 seconds delay
}

// Modified animate5Coming to include ring effect
function animate5Coming(progress) {
    // Keep original animation
    text5.position.y = 5 * (1 - progress);
    text5.scale.setScalar(1 + 3 * progress);
    text4.position.y = -progress;

    // Add ring animation
    ring.visible = true;
    ring.scale.setScalar(1 + progress * 0.5);
    ring.material.opacity = Math.sin(progress * Math.PI) * 0.5;
    ring.rotation.z += 0.02;

    if (progress === 1) {
        text4.visible = false;
        ring.material.opacity = 0;
    }
}

// Modified animateFlip to include confetti
function animateFlip(progress) {
    const rotation = progress * Math.PI;
    scene.rotation.x = rotation;

    if (progress > 0.4) {
        text2_1.visible = false;
        text0.visible = false;
        text2_2.visible = false;
        text5.visible = false;
        ring.visible = false; // Hide the ring before flip
    }

    if (progress > 0.5 && !happyNewYear.visible) {
        happyNewYear.visible = true;
        happyNewYear.material.opacity = 0;

        // Start confetti
        confetti.forEach(particle => {
            particle.visible = true;
        });
    }

    if (happyNewYear.visible) {
        happyNewYear.material.opacity = progress > 0.5 ? (progress - 0.5) * 2 : 0;
    }
}

// Add confetti animation
function updateConfetti() {
    confetti.forEach(particle => {
        if (particle.visible) {
            particle.position.x += particle.userData.velocity.x;
            particle.position.y += particle.userData.velocity.y;
            particle.rotation.z += particle.userData.velocity.rot;

            // Reset particle if it falls below screen
            if (particle.position.y < -2) {
                particle.position.set(
                    (Math.random() - 0.5) * 4, // Increased spread
                    2,
                    (Math.random() - 0.5)
                );
            }
        }
    });
}

// Modify the main animation loop to include confetti
function animate(currentTime = 0) {
    requestAnimationFrame(animate);

    if (isAnimating && startTime) {
        const elapsed = Date.now() - startTime;

        if (currentStep === 0) {
            const progress = Math.min(elapsed / animationDuration, 1);
            animate5Coming(progress);

            if (progress === 1) {
                currentStep = 1;
                startTime = Date.now();
            }
        } else if (currentStep === 1) {
            const progress = Math.min(elapsed / (animationDuration * 1.5), 1);
            animateFlip(progress);

            if (progress === 1) {
                isAnimating = false;

                // Start fade-out effect before resetting
                fadeOutScene(3000); // 3-second fade-out
            }

        }
    }

    // Update confetti if visible
    if (confetti[0].visible) {
        updateConfetti();
    }

    renderer.render(scene, camera);
}

animate();