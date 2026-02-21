//Nesta funcao ao fazer o logout os filtros sao atualizados para o defaul para o proximo utilizador nao entrar com os filtros do outro
function fazerLogout(logoutUrl) {
    // Limpar localStorage
    localStorage.removeItem('modoDaltonismo');
    localStorage.removeItem('modoContraste');
    
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    document.body.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    
    console.log('✓ Filtros limpos. Redirecionando...');
    
    if (!logoutUrl) {
        logoutUrl = '/logout/';
    }
    
    // Redireciona para logout
    setTimeout(() => {
        window.location.href = logoutUrl;
    }, 100);
}




//basicamente ao carregar no carregar  no botao do perfil os outros menus que estiverem abertos fecham -se para nao ficarem 2 ou 3 menus abertos ao mesmo tempo
function PerfilMenu() {
    const menu = document.getElementById('perfil-menu');
    if (menu) {

        //fecha os outros menus de acessibilidade quando menu abre
        document.getElementById('daltonismo-menu')?.classList.add('hidden');
        document.getElementById('contraste-menu')?.classList.add('hidden');
        console.log('PerfilMenu() called — menu before toggle:', menu.classList.contains('hidden'));
        menu.classList.toggle('hidden');
        console.log('PerfilMenu() after toggle — hidden:', menu.classList.contains('hidden'));
    }
}




//serve para detetar cliques se o clique for na area de algum botao ele cintinua aberto, se for fora da area onde esta o botao ele é fechado
window.addEventListener('click', function(e) {
    const daltMenu = document.getElementById('daltonismo-menu');
    const contMenu = document.getElementById('contraste-menu');
    const perfMenu = document.getElementById('perfil-menu');
    
    //se carregar dentro da area do perfil a dropbox nao fecha
    if (e.target.closest('.profile-area')) {
        return; 
    }

    //se carregarmos dentro de um menu na acessibilidade o menu nao fecha
    if (e.target.closest('.accessibility-pill') || e.target.closest('.accessibility-menu')) {
        return;
    }

    //.hidden é para fechar o menu se detetar um clique fora da area
    if (perfMenu) perfMenu.classList.add('hidden');
    if (daltMenu) daltMenu.classList.add('hidden');
    if (contMenu) contMenu.classList.add('hidden');
});




//igual ao perfil, para ver se ha menus abertos e fecha los antes de abrir o menu do datonismo ou do contraste
function toggleDaltonismoMenu() {
    document.getElementById('perfil-menu')?.classList.add('hidden');
    document.getElementById('contraste-menu')?.classList.add('hidden');
    const menu = document.getElementById('daltonismo-menu');
    menu.classList.toggle('hidden');
}

function toggleContrasteMenu() {
    document.getElementById('perfil-menu')?.classList.add('hidden');
    document.getElementById('daltonismo-menu')?.classList.add('hidden');
    const menu = document.getElementById('contraste-menu');
    menu.classList.toggle('hidden');
}





//comunica com o backend via AJAX
//no post manda para o servidor os dados, o tipo de filtro e depois o valor que escolheram
//o X-CRFSTOKEN e para o django aceitar a requisicao, serve para dar seguranca
function guardarFiltroNoServidor(tipo, valor) {
    console.log(`Guardar filtro: ${tipo} = ${valor}`);
    
    fetch('/atividades/api/atualizar-filtros/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            tipo: tipo,
            valor: valor
        })
    })
    .then(response => {
        console.log(`Response status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Resposta do servidor:', data);
        if (data.status === 'sucesso') {
            console.log('✓ ' + data.mensagem);
        } else {
            console.error('✗ Erro ao guardar filtro:', data.mensagem);
        }
    })
    .catch(error => {
        console.error('✗ Erro na requisição:', error);
    });
}





//usada para obter o crftoken
function getCookie(name) {
    let input = document.querySelector(`input[name="${name}"]`);
    if (input && input.value) {
        return input.value;
    }
    
    if (name === 'csrftoken') {
        input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (input && input.value) {
            return input.value;
        }
    }
    
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


//aplica as mudancas do visual em tempo real
//depois de carregar no filtro de datonismo ou contraste, vai ser verificado se ta com sessao iniciada, se tiver o filtro e guardado na bd, senao e guardado na localstorage
function setDaltonismo(tipo) {
    document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    if (tipo !== 'normal') document.body.classList.add(tipo);
    
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    
    if (isAuthenticated) {
        guardarFiltroNoServidor('daltonismo', tipo);
    } else {
        localStorage.setItem('modoDaltonismo', tipo);
    }
    
    document.getElementById('daltonismo-menu').classList.add('hidden');
}

function setContraste(tipo) {
    document.body.classList.remove('alto-contraste', 'contraste-invertido', 'modo-escuro');
    if (tipo !== 'normal') document.body.classList.add(tipo);
    
    const isAuthenticated = document.body.dataset.authenticated === 'true';

    if (isAuthenticated) {
        guardarFiltroNoServidor('contraste', tipo);
    } else {
        localStorage.setItem('modoContraste', tipo);
    }
    
    document.getElementById('contraste-menu').classList.add('hidden');
}




//aqui vamos ver se o utilizador ta autenticado, se tiver as preferencias dele sao aplicadas, senao vai a localstorage ver
document.addEventListener('DOMContentLoaded', () => {
    //ver se ta autenticado
    const isAuthenticated = document.body.dataset.authenticated === 'true';
    
    if (isAuthenticated) {
        localStorage.removeItem('modoDaltonismo');
        localStorage.removeItem('modoContraste');
    } else {
        const daltSalvo = localStorage.getItem('modoDaltonismo');
        if (daltSalvo && daltSalvo !== 'normal') {
            document.body.classList.add(daltSalvo);
        }
        const contSalvo = localStorage.getItem('modoContraste');
        if (contSalvo && contSalvo !== 'normal') {
            document.body.classList.add(contSalvo);
        }
    }

    //liga o botao do avatar ao meno do perfil
    const avatarBtn = document.getElementById('btn-avatar-trigger');
    if (avatarBtn) {
        console.log('avatarBtn found, attaching listener');
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('avatarBtn clicked');
            PerfilMenu();
        });
    } else {
        console.log('avatarBtn NOT found on DOMContentLoaded');
    }
});

//instrucoes que aparecem quando o utilizador precisa de ver os passos para o ajudar me caso de emergencia
const guias = {
            phishing: {
                titulo: gettext("Cliquei num link ou descarreguei algo:"),
                passos: [
                    gettext("Desliga a Internet (Wi-Fi ou Dados) imediatamente."),
                    gettext("Não introduzas mais nenhuma palavra-passe nesse dispositivo."),
                    gettext("Corre um antivírus completo para verificar se há malware."),
                    gettext("Se meteste dados num site, muda a password original noutro dispositivo seguro.")
                ]
            },
            password: {
                titulo: gettext("Perdi o acesso ou detetei login estranho:"),
                passos: [
                    gettext("Tenta fazer 'Reset Password' imediatamente."),
                    gettext("Usa a opção 'Terminar sessão em todos os dispositivos'."),
                    gettext("Ativa a Autenticação de Dois Fatores (2FA)."),
                    gettext("Verifica se o teu email de recuperação foi alterado.")
                ]
            },
            banco: {
                titulo: gettext("Exposição de Cartão ou MBWay:"),
                passos: [
                    gettext("Liga para a linha de cancelamento do teu banco (disponível 24h)."),
                    gettext("Bloqueia o cartão temporariamente através da App do banco."),
                    gettext("Verifica o extrato por movimentos que não reconheças."),
                    gettext("Faz queixa na polícia se houver roubo de dinheiro efetivo.")
                ]
            },
            phishing_vazio: {
                titulo: gettext("🔒 Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")
                ]
            },

            password_vazio: {
                titulo: gettext("🔒 Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")

                ]
            },

            banco_vazio: {
                titulo: gettext("🔒 Tens alguma dúvida?"),
                passos: [
                    gettext("Para nos enviares uma mensagem e obteres suporte personalizado, precisas de ter sessão iniciada.")
                ]
            }
            };
//para conseguir traduzir as instruçoes tenho que usar o gettext para o django identificar as str e mete las no ficheiro .po de traducoes
//o ficheiro de msg de traducao para o js é o makemessages -d django -l en
//o phishing, password e banco _vazio e para quando o utilizador esta sem login, quando tenta ver os passos tem de fazer login para os ver
    
function mostrarInstrucoes(tipo) {

            const painel = document.getElementById('painel-passos');
            const lista = document.getElementById('lista-passos');
            const titulo = document.getElementById('titulo-incidente');
            
            titulo.innerText = guias[tipo].titulo;
            lista.innerHTML = guias[tipo].passos.map(p => `<div class="step-item">${p}</div>`).join('');

            // quando o utilizador ta sem login e tenta ver os passos
            if (tipo === 'phishing_vazio' || tipo === 'password_vazio' || tipo === 'banco_vazio') {
            const loginBtn = document.createElement('a');
            loginBtn.href = "/login/";
            loginBtn.className = "btn-cta";
            loginBtn.style.marginTop = "20px";
            loginBtn.style.display = "inline-block";
            loginBtn.innerText = "Fazer Login Agora";
            lista.appendChild(loginBtn);
            
            //o botao de imprimir escondesse porque nao da para imp
            document.querySelector('#painel-passos button').style.display = 'none';
            } else {
                document.querySelector('#painel-passos button').style.display = 'block';
            }
            
            painel.style.display = 'block';
            window.scrollTo({ top: painel.offsetTop - 50, behavior: 'smooth' });
        }

//para fechar o popup no quiz final meti para redirecionar para a propria pagina e deu erro porque dava refresh e o quiz indice nao existe e manda para a home2
//acho que fica melhor fechar o popup e ficar na pagina do fim do que ir po home
function fecharpopup(){
    document.querySelector('.overlay').style.display = 'none';
}