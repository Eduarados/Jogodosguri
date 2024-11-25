const personagem = document.getElementById("personagem");
const chao = document.getElementById("chao");
const plataformas = document.querySelectorAll(".plataforma");
const blocos = document.querySelectorAll(".bloco"); // Adicionado seletor dos blocos
const fundo = document.getElementById("fundo");
const botaoAtirar = document.getElementById("atirar");
const inimigos = document.querySelectorAll(".inimigo"); // Alterado para pegar todos os inimigos
const moedas = document.querySelectorAll(".moeda");
const pontuacaoEl = document.getElementById("pontuacao");
const recordeEl = document.getElementById("recorde");
const botaoReiniciar = document.getElementById("reiniciar");

let grav = 0.4;
let forcaPulo = 12;
let velocidadeMovimento = 3;
const velocidadeCorrida = 20;
let pulando = false;
let velocidadeVertical = 0;
let teclasPressionadas = {};
let jogoIniciado = false;
let podeAtirar = true;
let ladoVirado = "direita";
let pontuacao = 0;

// Recupera o recorde do localStorage, ou define como 0 se não existir
let recorde = parseInt(localStorage.getItem("recorde")) || 0;
let inimigoVelocidade = 2;

// Array para armazenar as velocidades de cada inimigo
const velocidadesInimigos = new Array(inimigos.length).fill(inimigoVelocidade);

recordeEl.textContent = `Recorde: ${recorde}`;

function iniciarJogo() {
    if (jogoIniciado) return;
    jogoIniciado = true;

    // Reseta todas as teclas pressionadas
    teclasPressionadas = {};
    
    personagem.style.left = "10dvw";
    personagem.style.top = "80dvh";
    velocidadeVertical = 0;
    pulando = false;
    
    // Reseta a direção do personagem
    personagem.style.transform = "scaleX(1)";
    ladoVirado = "direita";

    pontuacao = 0;
    atualizarPontuacao();

    // Posiciona todos os inimigos
    inimigos.forEach((inimigo, index) => {
        inimigo.style.left = `${50 + (index * 20)}vw`;
        inimigo.style.display = "block";
    });
    
    moverInimigos();

    moedas.forEach(moeda => {
        moeda.style.display = "block";
        moeda.style.visibility = "visible";
    });

    document.addEventListener("keydown", pressionarTecla);
    document.addEventListener("keyup", soltarTecla);

    setInterval(loopJogo, 16);
}

function pressionarTecla(event) {
    teclasPressionadas[event.key.toLowerCase()] = true;

    if (event.key === "Shift") velocidadeMovimento = velocidadeCorrida;

    if (event.key === " " && !pulando) {
        velocidadeVertical = -forcaPulo;
        pulando = true;
    }

    if (event.key === "a") ladoVirado = "esquerda";
    if (event.key === "d") ladoVirado = "direita";
}

function soltarTecla(event) {
    teclasPressionadas[event.key.toLowerCase()] = false;

    if (event.key === "Shift") velocidadeMovimento = 3;
}

function verificarColisaoBlocos(elemento, novaEsquerda, largura) {
    let podePassar = true;
    const elementoRect = elemento.getBoundingClientRect();
    const elementoTop = elemento.offsetTop;
    const elementoBottom = elementoTop + elemento.offsetHeight;
    
    // Verifica colisão com blocos
    blocos.forEach(bloco => {
        const blocoRect = bloco.getBoundingClientRect();
        const blocoTop = bloco.offsetTop;
        const blocoBottom = blocoTop + bloco.offsetHeight;
        
        if (elementoBottom > blocoTop && elementoTop < blocoBottom) {
            // Colisão com a lateral esquerda do bloco
            if (novaEsquerda + largura > blocoRect.left && novaEsquerda < blocoRect.left) {
                podePassar = false;
                elemento.style.left = (blocoRect.left - largura) + "px";
            }
            
            // Colisão com a lateral direita do bloco
            if (novaEsquerda < blocoRect.right && novaEsquerda + largura > blocoRect.right) {
                podePassar = false;
                elemento.style.left = blocoRect.right + "px";
            }
            
            // Colisão vertical
            if (novaEsquerda + largura > blocoRect.left && novaEsquerda < blocoRect.right) {
                // Colisão por cima
                if (elementoBottom >= blocoTop && elementoTop < blocoTop) {
                    elemento.style.top = (blocoTop - elemento.offsetHeight) + "px";
                    velocidadeVertical = 0;
                    pulando = false;
                }
                // Colisão por baixo
                else if (elementoTop <= blocoBottom && elementoBottom > blocoBottom) {
                    elemento.style.top = blocoBottom + "px";
                    velocidadeVertical = 0;
                }
            }
        }
    });

    // Verifica colisão com plataformas
    plataformas.forEach(plataforma => {
        const plataformaRect = plataforma.getBoundingClientRect();
        const plataformaTop = plataforma.offsetTop;
        const plataformaBottom = plataformaTop + plataforma.offsetHeight;
        
        if (elementoBottom > plataformaTop && elementoTop < plataformaBottom) {
            // Colisão com a lateral esquerda da plataforma
            if (novaEsquerda + largura > plataformaRect.left && novaEsquerda < plataformaRect.left) {
                podePassar = false;
                elemento.style.left = (plataformaRect.left - largura) + "px";
            }
            
            // Colisão com a lateral direita da plataforma
            if (novaEsquerda < plataformaRect.right && novaEsquerda + largura > plataformaRect.right) {
                podePassar = false;
                elemento.style.left = plataformaRect.right + "px";
            }
        }
    });
    
    return podePassar;
}

function moverInimigos() {
    if (!jogoIniciado) return;
    
    inimigos.forEach((inimigo, index) => {
        const inimigoRect = inimigo.getBoundingClientRect();
        const novaEsquerda = inimigo.offsetLeft + velocidadesInimigos[index];

        if (novaEsquerda <= 0 || 
            novaEsquerda >= fundo.offsetWidth - inimigoRect.width ||
            !verificarColisaoBlocos(inimigo, novaEsquerda, inimigoRect.width)) {
            velocidadesInimigos[index] *= -1;
            
            // Inverte a direção do inimigo quando colide
            if(velocidadesInimigos[index] > 0) {
                inimigo.style.transform = "scaleX(1)";
            } else {
                inimigo.style.transform = "scaleX(-1)";
            }
        }

        inimigo.style.left = `${inimigo.offsetLeft + velocidadesInimigos[index]}px`;
    });
    requestAnimationFrame(moverInimigos);
}

function aplicarGravidade() {
    const personagemRect = personagem.getBoundingClientRect();
    const chaoRect = chao.getBoundingClientRect();

    if (personagemRect.bottom < chaoRect.top || velocidadeVertical < 0) {
        personagem.style.top = personagem.offsetTop + velocidadeVertical + "px";
        velocidadeVertical += grav;
    } else {
        personagem.style.top = chaoRect.top - personagemRect.height + "px";
        velocidadeVertical = 0;
        pulando = false;
    }
}

function moverPersonagem() {
    let deslocamentoX = 0;

    if (teclasPressionadas["a"]) deslocamentoX = -velocidadeMovimento;
    if (teclasPressionadas["d"]) deslocamentoX = velocidadeMovimento;

    if (teclasPressionadas["Shift"]) deslocamentoX *= 1.5;

    const novaEsquerda = personagem.offsetLeft + deslocamentoX;
    const personagemRect = personagem.getBoundingClientRect();

    if (novaEsquerda >= 0 && 
        novaEsquerda <= fundo.offsetWidth - personagem.offsetWidth &&
        verificarColisaoBlocos(personagem, novaEsquerda, personagemRect.width)) {
        personagem.style.left = `${novaEsquerda}px`;
    }

    // Atualiza a direção do sprite do personagem
    if(deslocamentoX > 0) {
        personagem.style.transform = "scaleX(1)";
    } else if(deslocamentoX < 0) {
        personagem.style.transform = "scaleX(-1)";
    }

    focarPersonagem();
}

function exibirMensagem(mensagem) {
    const mensagemEl = document.getElementById("mensagem");
    mensagemEl.textContent = mensagem;
    mensagemEl.style.display = "block";
    mensagemEl.style.position = "fixed";
    mensagemEl.style.top = "50%";
    mensagemEl.style.left = "50%";
    mensagemEl.style.transform = "translate(-50%, -50%)";
    mensagemEl.style.zIndex = "1000";
    
    jogoIniciado = false;
    document.removeEventListener("keydown", pressionarTecla);
    document.removeEventListener("keyup", soltarTecla);
    
    // Reseta todas as teclas pressionadas
    teclasPressionadas = {};
    
    botaoReiniciar.style.display = "block";
    botaoReiniciar.style.position = "fixed";
    botaoReiniciar.style.top = "60%";
    botaoReiniciar.style.left = "50%";
    botaoReiniciar.style.transform = "translate(-50%, -50%)";
    botaoReiniciar.style.zIndex = "1000";
    
    botaoReiniciar.onclick = () => {
        mensagemEl.style.display = "none";
        botaoReiniciar.style.display = "none";
        location.reload();
    };
}

function verificarColisoesPlataformas() {
    const personagemRect = personagem.getBoundingClientRect();
    plataformas.forEach(plataforma => {
        const plataformaRect = plataforma.getBoundingClientRect();

        // Ajuste na colisão superior
        if (personagemRect.bottom >= plataformaRect.top &&
            personagemRect.top <= plataformaRect.top &&
            personagemRect.right > plataformaRect.left + 5 &&
            personagemRect.left < plataformaRect.right - 5 &&
            velocidadeVertical >= 0) {
            personagem.style.top = plataformaRect.top - personagemRect.height + "px";
            velocidadeVertical = 0;
            pulando = false;
        }

        // Ajuste na colisão inferior
        if (personagemRect.top <= plataformaRect.bottom &&
            personagemRect.bottom >= plataformaRect.bottom &&
            personagemRect.right > plataformaRect.left + 5 &&
            personagemRect.left < plataformaRect.right - 5 &&
            velocidadeVertical < 0) {
            personagem.style.top = plataformaRect.bottom + "px";
            velocidadeVertical = 0;
        }
    });
}

function verificarColisaoInimigo() {
    const personagemRect = personagem.getBoundingClientRect();
    
    inimigos.forEach(inimigo => {
        if (inimigo.style.display === "none") return;
        
        const inimigoRect = inimigo.getBoundingClientRect();

        if (personagemRect.bottom - 5 > inimigoRect.top &&
            personagemRect.top + 5 < inimigoRect.bottom &&
            personagemRect.right - 5 > inimigoRect.left &&
            personagemRect.left + 5 < inimigoRect.right) {
            exibirMensagem("Você perdeu! Tente novamente.");
        }
    });
}

function verificarTiroInimigo(projetil) {
    const projetilRect = projetil.getBoundingClientRect();
    
    inimigos.forEach(inimigo => {
        if (inimigo.style.display === "none") return;
        
        const inimigoRect = inimigo.getBoundingClientRect();

        if (projetilRect.right > inimigoRect.left &&
            projetilRect.left < inimigoRect.right &&
            projetilRect.bottom > inimigoRect.top &&
            projetilRect.top < inimigoRect.bottom) {
            fundo.removeChild(projetil);
            inimigo.style.display = "none";
            adicionarPontuacao(10);
            
            // Verifica se todos os inimigos foram derrotados
            const inimigosRestantes = Array.from(inimigos).some(i => i.style.display !== "none");
            if (!inimigosRestantes) {
                exibirMensagem("Parabéns! Você venceu!");
            }
        }
    });
}

function verificarMoedas() {
    const personagemRect = personagem.getBoundingClientRect();
    
    moedas.forEach(moeda => {
        if (moeda.style.display === "none") return;
        
        const moedaRect = moeda.getBoundingClientRect();

        if (personagemRect.right - 5 > moedaRect.left &&
            personagemRect.left + 5 < moedaRect.right &&
            personagemRect.bottom - 5 > moedaRect.top &&
            personagemRect.top + 5 < moedaRect.bottom) {
            moeda.style.display = "none";
            const somMoeda = document.getElementById("som-moeda");
            somMoeda.play();
            adicionarPontuacao(5);
        }
    });
}

function adicionarPontuacao(valor) {
    pontuacao += valor;
    if (pontuacao > recorde) {
        recorde = pontuacao;
        localStorage.setItem("recorde", recorde);  // Salva o novo recorde no localStorage
    }
    atualizarPontuacao();
}

function atualizarPontuacao() {
    pontuacaoEl.textContent = `Pontuação: ${pontuacao}`;
    recordeEl.textContent = `Recorde: ${recorde}`;
}

function atirar() {
    if (!podeAtirar) return;

    podeAtirar = false;

    const projetil = document.createElement("div");
    projetil.classList.add("projetil");

    const posPersonagem = personagem.getBoundingClientRect();
    const fundoRect = fundo.getBoundingClientRect();
    
    // Ajuste para o tiro sair do meio do personagem
    const meioPersonagemX = posPersonagem.left + (posPersonagem.width / 2);
    const meioPersonagemY = posPersonagem.top + (posPersonagem.height / 2);
    
    projetil.style.left = `${meioPersonagemX - fundoRect.left}px`;
    projetil.style.top = `${meioPersonagemY - fundoRect.top}px`;

    fundo.appendChild(projetil);

    const velocidadeProjetil = ladoVirado === "direita" ? 10 : -10;
    projetil.style.transform = ladoVirado === "direita" ? "scaleX(1)" : "scaleX(-1)";

    function moverProjetil() {
        const posicaoAtual = parseInt(projetil.style.left, 10);
        const novaEsquerda = posicaoAtual + velocidadeProjetil;

        if (posicaoAtual < 0 || 
            posicaoAtual > fundo.offsetWidth ||
            !verificarColisaoBlocos(projetil, novaEsquerda, projetil.offsetWidth)) {
            fundo.removeChild(projetil);
        } else {
            projetil.style.left = `${novaEsquerda}px`;
            verificarTiroInimigo(projetil);
            requestAnimationFrame(moverProjetil);
        }

    }

    moverProjetil();

    setTimeout(() => {
        podeAtirar = true;
    }, 500);
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

function loopJogo() {
    if (!jogoIniciado) return;

    aplicarGravidade();
    moverPersonagem();
    verificarColisoesPlataformas();
    verificarColisaoInimigo();
    verificarMoedas();
}

botaoAtirar.addEventListener("click", atirar);
document.getElementById("iniciar").addEventListener("click", iniciarJogo);
