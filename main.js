document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro');
    const introVideo = document.getElementById('introVideo');
    const HAS_SEEN_VIDEO_KEY = 'introVideoPlayed'; 
    
    // Verifica o tipo de navegação: 'back_forward' é Voltar/Avançar
    const navigationType = performance.getEntriesByType("navigation")[0]?.type;
    const isBackNavigation = navigationType === 'back_forward';

    // Função que inicializa as funcionalidades restantes do site (páginas e outros)
    function startSite() {
        if (typeof setupPageControl === 'function') setupPageControl();
        // Coloque aqui outras inicializações pós-vídeo, se houver.
    }

    // --- LÓGICA DE INICIALIZAÇÃO ---

    if (isBackNavigation && sessionStorage.getItem(HAS_SEEN_VIDEO_KEY)) {
        // CASO 'VOLTAR': Pula tudo e inicia as nuvens e as páginas de uma vez.
        if (intro) {
            intro.style.display = 'none';
        }
        if (typeof init === 'function') init(); // Inicia nuvens e loop de animação
        startSite(); // Inicia controlo de páginas
        return; 
    }
    
    // CASO 'NOVO ACESSO' ou 'F5': 
    
    // 1. Inicia as NUVENS IMEDIATAMENTE (correm por trás do vídeo/overlay para fluidez)
    if (typeof init === 'function') init();
    
    if (introVideo && intro) {
        
        // 2. QUANDO O VÍDEO ACABA
        introVideo.addEventListener('ended', () => {
            sessionStorage.setItem(HAS_SEEN_VIDEO_KEY, 'true'); 
            
            // Aplica fade out
            intro.style.transition = 'opacity 1s ease';
            intro.style.opacity = 0;
            
            // Inicia o controlo de páginas APÓS o fade out (1000ms)
            setTimeout(() => {
                intro.style.display = 'none';
                startSite(); // Inicia o controlo de páginas
            }, 1000); 
        });

        // 3. QUANDO O VÍDEO É PULADO (CLIQUE)
        intro.addEventListener('click', () => {
            sessionStorage.setItem(HAS_SEEN_VIDEO_KEY, 'true'); 
            introVideo.pause();
            
            // Aplica fade out
            intro.style.transition = 'opacity 1s ease';
            intro.style.opacity = 0;
            
            // Inicia o controlo de páginas APÓS o fade out (1000ms)
            setTimeout(() => {
                intro.style.display = 'none';
                startSite(); // Inicia o controlo de páginas
            }, 1000);
        });
    } else {
        // Fallback: se não houver vídeo/overlay (deve iniciar tudo de imediato)
        startSite();
    }
});

if (!Detector.webgl) Detector.addGetWebGLMessage();

let mouseX = 0;
const windowHalfX = window.innerWidth / 2;

const clouds = {
    background: null,
    foreground: null
};

// FUNÇÃO INIT MODIFICADA: APENAS inicializa as nuvens e o loop de animação
function init() {
    // cria camadas de nuvens
    clouds.background = initCloudLayer('three-background', 0, 0.015);
    clouds.foreground = initCloudLayer('three-foreground', -500, 0.03);

    // resize
    window.addEventListener('resize', () => {
        ['background', 'foreground'].forEach(layer => {
            const cam = clouds[layer].camera;
            const ren = clouds[layer].renderer;
            cam.aspect = window.innerWidth / window.innerHeight;
            cam.updateProjectionMatrix();
            ren.setSize(window.innerWidth, window.innerHeight);
        });
    });

    // setupPageControl() FOI REMOVIDO DAQUI para ser chamado apenas em startSite()
    animateLoop();
}

function initCloudLayer(containerId, zOffset, speed) {
    const container = document.getElementById(containerId);
    const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1;
    camera.position.y = 190;

    const scene = new THREE.Scene();
    const fog = new THREE.Fog(0xf4f3f2, -100, 3000);
    const texture = THREE.ImageUtils.loadTexture('./mainpage/cloud10.png');

    const material = new THREE.ShaderMaterial({
        uniforms: {
            "map": { type: "t", value: texture },
            "fogColor": { type: "c", value: fog.color },
            "fogNear": { type: "f", value: fog.near },
            "fogFar": { type: "f", value: fog.far }
        },
        vertexShader: document.getElementById('vs').textContent,
        fragmentShader: document.getElementById('fs').textContent,
        depthWrite: false,
        depthTest: false,
        transparent: true
    });

    const geometry = new THREE.Geometry();
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(64, 64));

    for (let i = 0; i < 4000; i++) {
        plane.position.x = Math.random() * 2000 - 1000;
        plane.position.y = -Math.random() * Math.random() * 200 - 15;
        plane.position.z = i;
        plane.rotation.z = Math.random() * Math.PI;
        plane.scale.x = plane.scale.y = Math.random() * Math.random() * 1.5 + 0.5;
        THREE.GeometryUtils.merge(geometry, plane);
    }

    const cloudMeshes = [];
    const numBlocks = 50;
    const blockDepth = 1000;

    for (let i = 0; i < numBlocks; i++) {
        const mesh = new THREE.Mesh(geometry.clone(), material);
        mesh.position.z = zOffset - Math.random() * (blockDepth * numBlocks);
        scene.add(mesh);
        cloudMeshes.push(mesh);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    return { scene, camera, renderer, meshes: cloudMeshes, speed, blockDepth };
}

function animateLoop() {
    requestAnimationFrame(animateLoop);

    ['background', 'foreground'].forEach(layer => {
        const cloud = clouds[layer];
        cloud.camera.position.x = 0;

        cloud.meshes.forEach(mesh => {
            mesh.position.z += cloud.speed * 5;

            // correção dos saltos
            if (mesh.position.z > cloud.camera.position.z + cloud.blockDepth / 2) {
                mesh.position.z -= cloud.blockDepth * cloud.meshes.length;
            }
        });

        cloud.renderer.render(cloud.scene, cloud.camera);
    });
}



// PÁGINAS ----------------------------------------------------------------------------------------------------------------------
function setupPageControl() {
    const pages = {
        home: document.getElementById("home-page"),
        services: document.getElementById("services-page"),
        projects: document.getElementById("projects-page"),
        contacts: document.getElementById("contacts-page")
    };

    const buttons = {
        home: document.getElementById("btn-logo"),
        services: document.getElementById("btn-services"),
        projects: document.getElementById("btn-projects"),
        contacts: document.getElementById("btn-contacts")
    };

    function showPage(pageName) {
        // Mostra a página correta
        Object.values(pages).forEach(page => page.classList.remove("show-page"));
        pages[pageName].classList.add("show-page");

        // Atualiza botão ativo
        Object.values(buttons).forEach(btn => btn.classList.remove("active"));
        if (buttons[pageName]) buttons[pageName].classList.add("active");
    }

    // Adiciona event listeners
    Object.entries(buttons).forEach(([pageName, btn]) => {
        if (!btn) return;
        btn.addEventListener("click", e => {
            e.preventDefault();
            // Se já está ativo, não faz nada
            if (btn.classList.contains("active")) return;
            showPage(pageName);
        });
    });
}





// PÁGINA PROJECTOS --------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const projectsPage = document.querySelector('.projects-page');
  const btnProjects = document.getElementById('btn-projects');
  const galleryItemsContainer = document.querySelector('.gallery-items');

  if (!projectsPage || !btnProjects || !galleryItemsContainer) return;

  // Lista de projetos (imagem + nome + modelo)
  const projectImages = [
    { src: '/projects/model9/thumbnail.png', title: 'KRYSSET CHAIR', model: 'model9' },
    { src: '/projects/model5/thumbnail.png', title: 'GF CHAIR', model: 'model5' },
    { src: '/projects/model4/thumbnail.png', title: 'CANTAREIRA', model: 'model4' },
    { src: '/projects/model11/thumbnail.png', title: 'CAETANO PALHA', model: 'model11' },
    { src: '/projects/model3/thumbnail.png', title: 'IN PROGRESS', model: 'model3' },
    { src: '/projects/model12/thumbnail.png', title: 'IN PROGRESS', model: 'model12' },
    { src: '/projects/model8/thumbnail.png', title: 'IN PROGRESS', model: 'model8' },
  ];

  // Limpar e criar a galeria dinamicamente
  galleryItemsContainer.innerHTML = '';
  projectImages.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.title;

    const span = document.createElement('span');
    span.textContent = item.title;

    div.appendChild(img);
    div.appendChild(span);
    galleryItemsContainer.appendChild(div);

    // Clique abre o modelo correspondente
    div.addEventListener('click', () => {
      window.location.href = `projects/general_html.html?model=${item.model}`;
    });
  });

  // Mostrar Projects (só se não estiver ativo)
  btnProjects.addEventListener('click', () => {
    if (projectsPage.classList.contains('active')) return;

    projectsPage.classList.add('active');

    // Reinicia animação dos cards
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, i) => {
      item.style.animation = 'none'; 
      item.offsetHeight; 
      item.style.animation = `slideUp 1s ease forwards ${0.3 + i * 0.3}s`;
    });
  });

  // Fecha se clicar fora
  document.addEventListener('click', (e) => {
    if (projectsPage.classList.contains('active') &&
        !projectsPage.contains(e.target) &&
        e.target !== btnProjects) {
      projectsPage.classList.remove('active');
    }
  });

  // --------------------- Scroll com Click & Drag ---------------------
  let isDown = false;
  let startX;
  let scrollLeft;

  const startDrag = (xPos) => {
    isDown = true;
    startX = xPos - galleryItemsContainer.offsetLeft;
    scrollLeft = galleryItemsContainer.scrollLeft;
  };

  const stopDrag = () => { isDown = false; };

  const moveDrag = (xPos) => {
    if (!isDown) return;
    const walk = (xPos - startX) * 2;
    galleryItemsContainer.scrollLeft = scrollLeft - walk;
  };

  // Desktop
  galleryItemsContainer.addEventListener("mousedown", (e) => startDrag(e.pageX));
  galleryItemsContainer.addEventListener("mouseup", stopDrag);
  galleryItemsContainer.addEventListener("mouseleave", stopDrag);
  galleryItemsContainer.addEventListener("mousemove", (e) => moveDrag(e.pageX));

  // Mobile
  galleryItemsContainer.addEventListener("touchstart", (e) => startDrag(e.touches[0].pageX));
  galleryItemsContainer.addEventListener("touchend", stopDrag);
  galleryItemsContainer.addEventListener("touchmove", (e) => moveDrag(e.touches[0].pageX));
});



// PÁGINA SERVIÇOS --------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const servicesPage = document.querySelector('.services-page');
  const btnServices = document.getElementById('btn-services');

  if (!servicesPage || !btnServices) return;

  btnServices.addEventListener('click', () => {
    // Se já está ativa, não faz nada
    if (servicesPage.classList.contains('active')) return;

    servicesPage.classList.add('active');
  });

  // Se clicar fora da services-page, fecha
  document.addEventListener('click', (e) => {
    if (servicesPage.classList.contains('active') &&
        !servicesPage.contains(e.target) &&
        e.target !== btnServices) {
      servicesPage.classList.remove('active');
    }
  });
});



// PÁGINA CONTACTOS --------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const contactsPage = document.querySelector('.contact-page');
  const btnContacts = document.getElementById('btn-contacts');
  const contactForm = document.querySelector('.contact-form');
  const inputs = document.querySelectorAll('.contact-form .input-container, .contact-form .send-button');
  const contactTitle = document.querySelector('.contact-intro h2');
  const socialMedia = document.querySelector('.social-media-container');

  if (!contactsPage || !btnContacts || !contactForm || !contactTitle || !socialMedia) return;

  // Função para reiniciar animação
  function restartAnimation(el, animation) {
    el.style.animation = 'none';
    el.offsetHeight; // força reflow
    el.style.animation = animation;
  }

  // Clique no botão de contacts
  btnContacts.addEventListener('click', () => {
    // Se já está ativo, não faz nada
    if (contactsPage.classList.contains('active')) return;

    contactsPage.classList.add('active');

    // Animação do título
    restartAnimation(contactTitle, `slideUpFade 1s ease-out forwards 0.5s`);

    // Animação do formulário
    restartAnimation(contactForm, `slideUp 1s ease forwards 0s`);

    // Animação dos inputs e botão
    inputs.forEach((item, i) => {
      restartAnimation(item, `fadeInLeft 0.8s ease forwards ${i * 0.3}s`);
    });

    // Mostrar redes sociais
    socialMedia.classList.add('show');
    restartAnimation(socialMedia, `fadeInUp 0.8s ease forwards 1s`);
  });

  // Fecha se clicar fora do contactsPage
  document.addEventListener('click', (e) => {
    if (contactsPage.classList.contains('active') &&
        !contactsPage.contains(e.target) &&
        e.target !== btnContacts) {

      contactsPage.classList.remove('active');

      // Esconder redes sociais
      restartAnimation(socialMedia, `fadeOutDown 0.5s ease forwards`);
      socialMedia.classList.remove('show');
    }
  });
});


