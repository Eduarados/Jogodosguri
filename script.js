const personagem = document.getElementById("personagem");
const chao = document.getElementById("chao");
const plataformas = document.querySelectorAll(".plataforma");
const fundo = document.getElementById("fundo");
const botaoAtirar = document.getElementById("atirar");
const inimigos = document.querySelectorAll(".inimigo");
const moedas = document.querySelectorAll(".moeda");
const pontuacaoEl = document.getElementById("pontuacao");
const recordeEl = document.getElementById("recorde");
const botaoReiniciar = document.getElementById("reiniciar");
const controlesMobile = document.getElementById("controles-mobile");
const boss = document.getElementById("boss");

const poolTiros = [];
for (let i = 0; i < 3; i++) {
    const somTiro = new Audio('audios/Somtiroplayer.mp3');
    somTiro.volume = 0.3;
    poolTiros.push(somTiro);
}
let tiroAtual = 0;

const somGameOver = new Audio('audios/Gameover.mp3');
const musicaFundo = new Audio('audios/Musicafundo.mp3');
musicaFundo.volume = 0.2;
const somPuloPlayer = new Audio('audios/Sompuloplayer.mp3');
somPuloPlayer.volume = 0.4;
const somMoeda = new Audio('audios/pegarmoeda.mp3');
somMoeda.volume = 0.3;

musicaFundo.loop = true;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const baseUnit = Math.min(window.innerWidth, window.innerHeight) / 100;
let grav = isMobile ? 0.15 * baseUnit : 0.12 * baseUnit;
let forcaPulo = isMobile ? 4.0 * baseUnit : 3.5 * baseUnit;
let velocidadeMovimento = isMobile ? 1.2 * baseUnit : 0.8 * baseUnit;
const velocidadeCorrida = isMobile ? 2.5 * baseUnit : 1.5 * baseUnit;

const escalaElementos = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
document.documentElement.style.setProperty('--escala-elementos', escalaElementos);

let pulando = false;
let velocidadeVertical = 0;
let teclasPressionadas = {};
let jogoIniciado = false;
let podeAtirar = true;
let ladoVirado = "direita";
let pontuacao = 0;
let noChao = false;
let podePular = true;
let atirando = false;
let ultimaAnimacao = "parado";
let vidaBoss = 50;
let bossPodeAtirar = true;
let jogoTerminado = false;
let ultimoTiroBoss = 0;
let intervaloBossTiro = null;

let recorde = parseInt(localStorage.getItem("recorde")) || 0;

let velocidadesInimigos = [];

inimigos.forEach(() => {
    const velocidadeBase = isMobile ? 0.5 * baseUnit : 0.8 * baseUnit;
    const variacao = Math.random() * 0.3;
    const direcaoInicial = Math.random() < 0.5 ? 1 : -1;
    velocidadesInimigos.push(velocidadeBase * (1 + variacao) * direcaoInicial);
});

recordeEl.textContent = `Recorde: ${recorde}`;

if (isMobile) {
    controlesMobile.style.display = "flex";
    
    const botaoEsquerda = document.getElementById("botao-esquerda");
    const botaoDireita = document.getElementById("botao-direita");
    const botaoPular = document.getElementById("botao-pular");
    const botaoAtirarMobile = document.getElementById("botao-atirar");

    const tamanhoBotao = Math.min(window.innerWidth, window.innerHeight) / 8;
    [botaoEsquerda, botaoDireita, botaoPular, botaoAtirarMobile].forEach(botao => {
        botao.style.width = `${tamanhoBotao}px`;
        botao.style.height = `${tamanhoBotao}px`;
    });

    botaoEsquerda.addEventListener("touchstart", () => {
        teclasPressionadas["a"] = true;
        ladoVirado = "esquerda";
    });
    botaoEsquerda.addEventListener("touchend", () => {
        teclasPressionadas["a"] = false;
    });

    botaoDireita.addEventListener("touchstart", () => {
        teclasPressionadas["d"] = true;
        ladoVirado = "direita"; 
    });
    botaoDireita.addEventListener("touchend", () => {
        teclasPressionadas["d"] = false;
    });

    botaoPular.addEventListener("touchstart", () => {
        if (podePular) {
            if (!somPuloPlayer.paused) {
                somPuloPlayer.pause();
                somPuloPlayer.currentTime = 0;
            }
            somPuloPlayer.play();
            velocidadeVertical = -forcaPulo;
            pulando = true;
            noChao = false;
            podePular = false;
        }
    });

    botaoAtirarMobile.addEventListener("touchstart", atirar);
}

window.addEventListener('resize', () => {
    const baseUnit = Math.min(window.innerWidth, window.innerHeight) / 100;
    grav = isMobile ? 0.15 * baseUnit : 0.12 * baseUnit;
    forcaPulo = isMobile ? 4.0 * baseUnit : 3.5 * baseUnit;
    velocidadeMovimento = isMobile ? 1.2 * baseUnit : 0.8 * baseUnit;
    
    const escalaElementos = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--escala-elementos', escalaElementos);
    
    if (isMobile) {
        const tamanhoBotao = Math.min(window.innerWidth, window.innerHeight) / 8;
        const botoes = document.querySelectorAll('#controles-mobile button');
        botoes.forEach(botao => {
            botao.style.width = `${tamanhoBotao}px`;
            botao.style.height = `${tamanhoBotao}px`;
        });
    }
});

function iniciarJogo() {
    if (jogoIniciado || jogoTerminado) return;
    jogoIniciado = true;
    
    musicaFundo.play();

    teclasPressionadas = {};
    
    personagem.style.left = "50px";
    personagem.style.bottom = `calc(4 * var(--base-unit))`;
    velocidadeVertical = 0;
    pulando = false;
    noChao = true;
    podePular = true;
    atirando = false;
    vidaBoss = 100;
    
    personagem.style.transform = "scaleX(1)";
    ladoVirado = "direita";

    pontuacao = 0;
    atualizarPontuacao();

    if (intervaloBossTiro) {
        clearInterval(intervaloBossTiro);
    }

    intervaloBossTiro = setInterval(() => {
        if (jogoIniciado && !jogoTerminado && boss.style.display !== "none") {
            atirarBoss();
        }
    }, 2000);

    inimigos.forEach((inimigo, index) => {
        inimigo.style.display = "block";
        inimigo.style.transform = "scaleX(1)";
        
        const posX = Math.random() * (fundo.offsetWidth - 50);
        inimigo.style.left = `${posX}px`;
        inimigo.style.bottom = `${4 * 16}px`;

        const velocidadeBase = isMobile ? 0.5 * baseUnit : 0.8 * baseUnit;
        const variacao = Math.random() * 0.3;
        const direcaoInicial = Math.random() < 0.5 ? 1 : -1;
        velocidadesInimigos[index] = velocidadeBase * (1 + variacao) * direcaoInicial;
    });
    
    moverInimigos();

    moedas.forEach(moeda => {
        moeda.style.display = "block";
        moeda.style.visibility = "visible";
    });

    if (!isMobile) {
        document.addEventListener("keydown", pressionarTecla);
        document.addEventListener("keyup", soltarTecla);
    }

    requestAnimationFrame(loopJogo);
}

function pressionarTecla(event) {
    teclasPressionadas[event.key.toLowerCase()] = true;

    if (event.key === "Shift") {
        velocidadeMovimento = velocidadeCorrida;
    }

    if (event.key === " " && podePular) {
        if (!somPuloPlayer.paused) {
            somPuloPlayer.pause();
            somPuloPlayer.currentTime = 0;
        }
        somPuloPlayer.play();
        velocidadeVertical = -forcaPulo;
        pulando = true;
        noChao = false;
        podePular = false;
    }

    if (event.key === "a") ladoVirado = "esquerda";
    if (event.key === "d") ladoVirado = "direita";
}

function soltarTecla(event) {
    teclasPressionadas[event.key.toLowerCase()] = false;
    if (event.key === "Shift") velocidadeMovimento = isMobile ? 1.2 * baseUnit : 0.8 * baseUnit;
}

function moverInimigos() {
    if (!jogoIniciado) return;
    
    inimigos.forEach((inimigo, index) => {
        if (inimigo.style.display === "none") return;
        
        const inimigoRect = inimigo.getBoundingClientRect();
        const chaoRect = chao.getBoundingClientRect();
        
        let velocidadeY = 0;
        velocidadeY += grav;
        let novaPos = inimigoRect.top + velocidadeY;
        let plataformaAtual = null;
        
        if (inimigoRect.bottom + velocidadeY >= chaoRect.top) {
            novaPos = chaoRect.top - inimigoRect.height;
            velocidadeY = 0;
        }
        
        plataformas.forEach(plataforma => {
            const plataformaRect = plataforma.getBoundingClientRect();
            
            if (inimigoRect.right > plataformaRect.left && 
                inimigoRect.left < plataformaRect.right) {
                
                if (inimigoRect.bottom <= plataformaRect.top && 
                    inimigoRect.bottom + velocidadeY >= plataformaRect.top) {
                    novaPos = plataformaRect.top - inimigoRect.height;
                    velocidadeY = 0;
                    plataformaAtual = plataforma;
                }
            }
        });
        
        inimigo.style.top = `${novaPos}px`;
        
        const novaEsquerda = inimigo.offsetLeft + velocidadesInimigos[index];
        
        if (plataformaAtual) {
            const plataformaRect = plataformaAtual.getBoundingClientRect();
            const margemSeguranca = 20 * escalaElementos;
            
            if ((inimigoRect.right + velocidadesInimigos[index] >= plataformaRect.right - margemSeguranca && velocidadesInimigos[index] > 0) ||
                (inimigoRect.left + velocidadesInimigos[index] <= plataformaRect.left + margemSeguranca && velocidadesInimigos[index] < 0)) {
                velocidadesInimigos[index] *= -1;
                inimigo.style.transform = `scaleX(${velocidadesInimigos[index] > 0 ? 1 : -1})`;
            }
        } else {
            if (novaEsquerda <= 0 || novaEsquerda + inimigoRect.width >= fundo.offsetWidth) {
                velocidadesInimigos[index] *= -1;
                inimigo.style.transform = `scaleX(${velocidadesInimigos[index] > 0 ? 1 : -1})`;
            }
        }
            
        inimigo.style.left = `${novaEsquerda}px`;
    });
    
    requestAnimationFrame(moverInimigos);
}

function aplicarGravidade() {
    const personagemRect = personagem.getBoundingClientRect();
    const chaoRect = chao.getBoundingClientRect();

    if (personagemRect.bottom < chaoRect.top - 2 || velocidadeVertical < 0) {
        const novaPos = personagemRect.top + velocidadeVertical;
        personagem.style.top = novaPos + "px";
        velocidadeVertical += grav;
    } else {
        personagem.style.top = (chaoRect.top - personagemRect.height) + "px";
        velocidadeVertical = 0;
        pulando = false;
        noChao = true;
        podePular = true;
    }
}

function moverPersonagem() {
    let deslocamentoX = 0;

    if (teclasPressionadas["a"]) deslocamentoX = -velocidadeMovimento;
    if (teclasPressionadas["d"]) deslocamentoX = velocidadeMovimento;

    const novaEsquerda = personagem.offsetLeft + deslocamentoX;
    const personagemRect = personagem.getBoundingClientRect();

    let podeMover = true;
    plataformas.forEach(plataforma => {
        const plataformaRect = plataforma.getBoundingClientRect();
        
        if (personagemRect.bottom > plataformaRect.top + 10 && 
            personagemRect.top < plataformaRect.bottom - 10) {
            
            if (deslocamentoX > 0 && 
                personagemRect.right <= plataformaRect.left + 5 && 
                personagemRect.right + deslocamentoX > plataformaRect.left) {
                podeMover = false;
            }
            
            if (deslocamentoX < 0 && 
                personagemRect.left >= plataformaRect.right - 5 && 
                personagemRect.left + deslocamentoX < plataformaRect.right) {
                podeMover = false;
            }
        }
    });

    if (podeMover && novaEsquerda >= 0 && novaEsquerda <= fundo.offsetWidth - personagemRect.width) {
        personagem.style.left = `${novaEsquerda}px`;
    }

    if (deslocamentoX !== 0) {
        personagem.style.transform = deslocamentoX > 0 ? "scaleX(1)" : "scaleX(-1)";
        ladoVirado = deslocamentoX > 0 ? "direita" : "esquerda";
    }

    let novaAnimacao = "parado";
    if (atirando) {
        novaAnimacao = "atirando";
    } else if (deslocamentoX !== 0) {
        novaAnimacao = "correndo";
    }

    if (novaAnimacao !== ultimaAnimacao) {
        personagem.className = `personagem ${novaAnimacao}`;
        ultimaAnimacao = novaAnimacao;
    }

    focarPersonagem();
}

function exibirMensagem(mensagem) {
    const mensagemEl = document.getElementById("mensagem");
    mensagemEl.textContent = mensagem;
    mensagemEl.style.display = "block";
    
    jogoIniciado = false;
    jogoTerminado = true;
    document.removeEventListener("keydown", pressionarTecla);
    document.removeEventListener("keyup", soltarTecla);
    
    teclasPressionadas = {};
    
    botaoReiniciar.style.display = "block";
    
    musicaFundo.pause();
    musicaFundo.currentTime = 0;
    poolTiros.forEach(som => {
        som.pause();
        som.currentTime = 0;
    });
    somMoeda.pause();
    somMoeda.currentTime = 0;
    
    if (intervaloBossTiro) {
        clearInterval(intervaloBossTiro);
        intervaloBossTiro = null;
    }
    
    if (mensagem.includes("perdeu") || mensagem.includes("atingido")) {
        somGameOver.play();
    }
    
    botaoReiniciar.onclick = () => {
        mensagemEl.style.display = "none";
        botaoReiniciar.style.display = "none";
        jogoTerminado = false;
        
        somGameOver.pause();
        somGameOver.currentTime = 0;

        const projeteis = document.querySelectorAll(".projetil, .projetil-boss");
        projeteis.forEach(projetil => {
            if (projetil.parentNode) {
                projetil.parentNode.removeChild(projetil);
            }
        });
        
        pontuacao = 0;
        vidaBoss = 100;
        boss.style.display = "block";
        
        inimigos.forEach((inimigo, index) => {
            inimigo.style.display = "block";
            
            const posX = Math.random() * (fundo.offsetWidth - 50);
            inimigo.style.left = `${posX}px`;
            inimigo.style.bottom = `${4 * 16}px`;

            const velocidadeBase = isMobile ? 0.5 * baseUnit : 0.8 * baseUnit;
            const variacao = Math.random() * 0.3;
            const direcaoInicial = Math.random() < 0.5 ? 1 : -1;
            velocidadesInimigos[index] = velocidadeBase * (1 + variacao) * direcaoInicial;
            inimigo.style.transform = `scaleX(${velocidadesInimigos[index] > 0 ? 1 : -1})`;
        });
        
        moedas.forEach(moeda => {
            moeda.style.display = "block";
            moeda.style.visibility = "visible";
        });
        
        personagem.style.left = "50px";
        personagem.style.bottom = `calc(4 * var(--base-unit))`;
        personagem.style.transform = "scaleX(1)";
        
        velocidadeVertical = 0;
        pulando = false;
        noChao = true;
        podePular = true;
        atirando = false;
        ladoVirado = "direita";
        podeAtirar = true;
        bossPodeAtirar = true;
        ultimoTiroBoss = 0;
        
        atualizarPontuacao();
        
        iniciarJogo();
    };
}

function verificarColisoesPlataformas() {
    const personagemRect = personagem.getBoundingClientRect();
    const margemColisao = isMobile ? 15 * escalaElementos : 10 * escalaElementos;
    let estaEmPlataforma = false;
    
    plataformas.forEach(plataforma => {
        const plataformaRect = plataforma.getBoundingClientRect();

        if (personagemRect.right - margemColisao > plataformaRect.left &&
            personagemRect.left + margemColisao < plataformaRect.right) {
            
            if (personagemRect.bottom >= plataformaRect.top - margemColisao &&
                personagemRect.bottom <= plataformaRect.top + velocidadeVertical + margemColisao &&
                velocidadeVertical >= 0) {
                personagem.style.top = (plataformaRect.top - personagemRect.height) + "px";
                velocidadeVertical = 0;
                pulando = false;
                noChao = true;
                podePular = true;
                estaEmPlataforma = true;
            }
            
            else if (personagemRect.top <= plataformaRect.bottom + margemColisao &&
                     personagemRect.top >= plataformaRect.bottom + velocidadeVertical - margemColisao &&
                     velocidadeVertical < 0) {
                personagem.style.top = (plataformaRect.bottom + 1) + "px";
                velocidadeVertical = 0;
            }
        }
    });

    if (!estaEmPlataforma && !noChao) {
        velocidadeVertical += grav;
    }
}

function verificarColisaoInimigo() {
    const personagemRect = personagem.getBoundingClientRect();
    const margemColisao = isMobile ? 8 * escalaElementos : 5 * escalaElementos;
    
    inimigos.forEach(inimigo => {
        if (inimigo.style.display === "none") return;
        
        const inimigoRect = inimigo.getBoundingClientRect();

        if (personagemRect.right - margemColisao > inimigoRect.left &&
            personagemRect.left + margemColisao < inimigoRect.right &&
            personagemRect.bottom - margemColisao > inimigoRect.top &&
            personagemRect.top + margemColisao < inimigoRect.bottom) {
            exibirMensagem("Você perdeu! Tente novamente.");
        }
    });
}

function verificarTiroInimigo(projetil) {
    const projetilRect = projetil.getBoundingClientRect();
    const margemColisao = isMobile ? 4 * escalaElementos : 2 * escalaElementos;
    
    const bossRect = boss.getBoundingClientRect();
    if (projetilRect.right - margemColisao > bossRect.left &&
        projetilRect.left + margemColisao < bossRect.right &&
        projetilRect.bottom - margemColisao > bossRect.top &&
        projetilRect.top + margemColisao < bossRect.bottom) {
        if (projetil.parentNode) {
            projetil.parentNode.removeChild(projetil);
        }
        vidaBoss -= 10;
        
        if (vidaBoss <= 0) {
            boss.style.display = "none";
            const inimigosRestantes = Array.from(inimigos).some(i => i.style.display !== "none");
            if (!inimigosRestantes) {
                exibirMensagem("Parabéns! Você venceu!");
            }
            return;
        }
    }
    
    inimigos.forEach(inimigo => {
        if (inimigo.style.display === "none") return;
        
        const inimigoRect = inimigo.getBoundingClientRect();

        if (projetilRect.right - margemColisao > inimigoRect.left &&
            projetilRect.left + margemColisao < inimigoRect.right &&
            projetilRect.bottom - margemColisao > inimigoRect.top &&
            projetilRect.top + margemColisao < inimigoRect.bottom) {
            if (projetil.parentNode) {
                projetil.parentNode.removeChild(projetil);
            }
            inimigo.style.display = "none";
            adicionarPontuacao(10);
            
            const inimigosRestantes = Array.from(inimigos).some(i => i.style.display !== "none");
            if (!inimigosRestantes && boss.style.display === "none") {
                exibirMensagem("Parabéns! Você venceu!");
            }
        }
    });
}

function verificarMoedas() {
    const personagemRect = personagem.getBoundingClientRect();
    const margemColisao = isMobile ? 4 * escalaElementos : 2 * escalaElementos;
    
    moedas.forEach(moeda => {
        if (moeda.style.display === "none") return;
        
        const moedaRect = moeda.getBoundingClientRect();

        if (personagemRect.right - margemColisao > moedaRect.left &&
            personagemRect.left + margemColisao < moedaRect.right &&
            personagemRect.bottom - margemColisao > moedaRect.top &&
            personagemRect.top + margemColisao < moedaRect.bottom) {
            moeda.style.display = "none";
            somMoeda.currentTime = 0;
            somMoeda.play();
            adicionarPontuacao(5);
        }
    });
}

function adicionarPontuacao(valor) {
    pontuacao += valor;
    if (pontuacao > recorde) {
        recorde = pontuacao;
        localStorage.setItem("recorde", recorde);
    }
    atualizarPontuacao();
}

function atualizarPontuacao() {
    pontuacaoEl.textContent = `Pontuação: ${pontuacao}`;
    recordeEl.textContent = `Recorde: ${recorde}`;
}

function atirar() {
    if (!podeAtirar || !jogoIniciado) return;

    podeAtirar = false;
    atirando = true;
    
    const somTiro = poolTiros[tiroAtual];
    somTiro.currentTime = 0;
    somTiro.play();
    tiroAtual = (tiroAtual + 1) % poolTiros.length;

    const projetil = document.createElement("div");
    projetil.classList.add("projetil");

    const posPersonagem = personagem.getBoundingClientRect();
    const fundoRect = fundo.getBoundingClientRect();
    
    projetil.style.left = `${posPersonagem.left + (ladoVirado === "direita" ? posPersonagem.width : 0) - fundoRect.left}px`;
    projetil.style.top = `${posPersonagem.top + (posPersonagem.height / 2) - 5 - fundoRect.top}px`;

    fundo.appendChild(projetil);

    const velocidadeProjetil = ladoVirado === "direita" ? (isMobile ? 15 * escalaElementos : 20 * escalaElementos) : (isMobile ? -15 * escalaElementos : -20 * escalaElementos);
    projetil.style.transform = ladoVirado === "direita" ? "scaleX(1)" : "scaleX(-1)";

    function moverProjetil() {
        if (!projetil.parentNode) return;
        
        const posicaoAtual = parseInt(projetil.style.left, 10);
        const novaEsquerda = posicaoAtual + velocidadeProjetil;

        if (posicaoAtual < 0 || posicaoAtual > fundo.offsetWidth) {
            if (projetil.parentNode) {
                projetil.parentNode.removeChild(projetil);
            }
        } else {
            projetil.style.left = `${novaEsquerda}px`;
            verificarTiroInimigo(projetil);
            requestAnimationFrame(moverProjetil);
        }
    }

    moverProjetil();

    setTimeout(() => {
        atirando = false;
    }, 200);

    setTimeout(() => {
        podeAtirar = true;
    }, isMobile ? 800 : 600);
}

function focarPersonagem() {
    const personagemRect = personagem.getBoundingClientRect();
    const telaLargura = window.innerWidth;

    let deslocamentoX = personagem.offsetLeft + personagem.offsetWidth / 2 - telaLargura / 2;
    deslocamentoX = Math.min(
        Math.max(deslocamentoX, 0),
        fundo.offsetWidth - telaLargura
    );

    fundo.style.transform = `translateX(${-deslocamentoX}px)`;
}

function atirarBoss() {
    if (!jogoIniciado || !bossPodeAtirar || boss.style.display === "none") return;
    
    bossPodeAtirar = false;
    const projetilBoss = document.createElement("div");
    projetilBoss.classList.add("projetil-boss");
    
    const posBoss = boss.getBoundingClientRect();
    const fundoRect = fundo.getBoundingClientRect();
    const personagemRect = personagem.getBoundingClientRect();
    
    projetilBoss.style.left = `${posBoss.left - fundoRect.left}px`;
    projetilBoss.style.top = `${posBoss.top + (posBoss.height / 2) - 5 - fundoRect.top}px`;
    
    fundo.appendChild(projetilBoss);
    
    const direcao = personagemRect.left < posBoss.left ? -1 : 1;
    const velocidadeProjetilBoss = (isMobile ? 8 : 10) * direcao;
    
    function moverProjetilBoss() {
        if (!projetilBoss.parentNode) return;
        
        const posicaoAtual = parseInt(projetilBoss.style.left, 10);
        const novaEsquerda = posicaoAtual + velocidadeProjetilBoss;
        
        const projetilRect = projetilBoss.getBoundingClientRect();
        const personagemRect = personagem.getBoundingClientRect();
        
        if (projetilRect.right > personagemRect.left &&
            projetilRect.left < personagemRect.right &&
            projetilRect.bottom > personagemRect.top &&
            projetilRect.top < personagemRect.bottom) {
            exibirMensagem("Você foi atingido pelo boss! Tente novamente.");
            if (projetilBoss.parentNode) {
                projetilBoss.parentNode.removeChild(projetilBoss);
            }
            return;
        }
        
        if (posicaoAtual < 0 || posicaoAtual > fundo.offsetWidth) {
            if (projetilBoss.parentNode) {
                projetilBoss.parentNode.removeChild(projetilBoss);
            }
        } else {
            projetilBoss.style.left = `${novaEsquerda}px`;
            requestAnimationFrame(moverProjetilBoss);
        }
    }
    
    moverProjetilBoss();
    
    setTimeout(() => {
        bossPodeAtirar = true;
        if (jogoIniciado && boss.style.display !== "none") {
            atirarBoss();
        }
    }, 2000); // Boss atira a cada 2 segundos
}

function loopJogo() {
    if (!jogoIniciado) return;

    aplicarGravidade();
    moverPersonagem();
    verificarColisoesPlataformas();
    verificarColisaoInimigo();
    verificarMoedas();
    
    requestAnimationFrame(loopJogo);
}

botaoAtirar.addEventListener("click", atirar);
document.getElementById("iniciar").addEventListener("click", iniciarJogo);