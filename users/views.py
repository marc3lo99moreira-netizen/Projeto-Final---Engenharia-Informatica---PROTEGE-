from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib import messages
from .models import Perfil, Mensagem
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout
from django.db.models.signals import post_save
from django.dispatch import receiver
from .forms import EditarPerfilForm
from django.db import transaction 
from django.utils import translation



@login_required
def perfil(request):
    return render(request, 'users/perfil.html')


def home(request):
    return render(request, 'users/home.html')



def login_view(request):
    #o utilizador depois de carregar no botao login, o usrename e a paassword sao guardados e vao ser comparados para ver se correspondem
    if request.method == 'POST':
        username_login = request.POST.get("username")
        password_login = request.POST.get("password")
        user = authenticate(request, username=username_login, password=password_login)

        if user is not None:
            login(request, user) #a pass e o nome corresponderam e faz login

            
            lang = getattr(user.perfil, 'lingua', 'pt') #ou usa a lingua que esta no perfil ou usa pt por padrao
            translation.activate(lang)

            request.session['_language'] = lang  # Guarda a língua na sessão para o resto do site
            request.session['django_language'] = lang
            response = redirect('atividades:home2')


            response.set_cookie('django_language', lang)
            return response
        else:
            #mesagem de erro se a pass ou o nome nao der como na bd
            messages.error(request, "Credenciais inválidas. Tente novamente.")
            return render(request, 'users/login.html')
    return render(request, 'users/login.html')



def registar(request):
    #quando o utilizador carrega no registar esta em GET, e so ve os campos para preencher, depois de os preencher e submeter os dados sao mandados em POST
    if request.method == 'POST':
        dados = request.POST
        
        #so verifica se as passes sao iguais
        if dados.get('password') != dados.get('confirm_password'):
            messages.error(request, "As palavras-passe não coincidem!")
            return render(request, 'users/registar.html')
        
        #ve se o username ja existe
        if User.objects.filter(username=dados.get('username')).exists():
            messages.error(request, "Este nome de utilizador já está em uso.")
            return render(request, 'users/registar.html')


        #garante que o utilizador e criado completo, se falhar algo anula a criacao do utilizador
        try:
            with transaction.atomic():
                user = User.objects.create_user(#create_user ja mete automaticamente o hashing nas passes
                    username=dados.get('username'),
                    email=dados.get('email'),
                    password=dados.get('password')
                )
                
                Perfil.objects.create(
                    user=user, 
                    instituicao=dados.get('instituicao'), 
                    idade=dados.get('idade'), 
                    ano_letivo=dados.get('ano_letivo')
                )
            
            messages.success(request, "Conta criada com sucesso! Podes agora entrar.")
            return redirect('login') 
        except Exception as e:
            messages.error(request, "Ocorreu um erro ao criar a conta. Tente novamente.")
            return render(request, 'users/registar.html')

    return render(request, 'users/registar.html')




def sobrenos(request):

    #quando o utilizdor entre na sobre nos o metodo e get e ignora o if, so entra no if quando ele carrega no enviar mensagem
    if request.method == 'POST':
        
        #ve se esta com login feito
        if not request.user.is_authenticated:
            return HttpResponseForbidden('Autenticação necessária para enviar mensagens.')
        
        #guarda o que se escreve
        assunto = request.POST.get('assunto', '').strip()
        mensagem_texto = request.POST.get('mensagem', '').strip()
        
        #ve se os campos estao vazios ao enviar
        if not assunto or not mensagem_texto:
            messages.error(request, "Por favor, preenche todos os campos.")
            return render(request, 'users/sobrenos.html')
        
        #para nao escrever muito
        if len(assunto) > 200 or len(mensagem_texto) > 5000:
            messages.error(request, "Mensagem muito longa. Reduz o tamanho.")
            return render(request, 'users/sobrenos.html')
        

        #para mandar para a bd
        try:
            Mensagem.objects.create(
                user=request.user,
                assunto=assunto,
                mensagem=mensagem_texto
            )
            messages.success(request, "✅ Mensagem enviada com sucesso! Obrigado pelo feedback.")
            return redirect('atividades:home2')
        except Exception as e:
            messages.error(request, "❌ Ocorreu um erro ao enviar a mensagem. Tente novamente.")
            return render(request, 'users/sobrenos.html')
    
    return render(request, 'users/sobrenos.html')



def logout_view(request):

    lingua = 'pt' 
    if request.user.is_authenticated:
        lingua = getattr(request.user.perfil, 'lingua', 'pt')

    response = redirect('home')
    response.set_cookie('django_language', lingua) #guarda a lingua no cookie antes do logout assim fica na sessao e o utilizador vai estar na mesma lingua 
    logout(request)
    messages.info(request, "Sessão terminada com sucesso.")
    return response




@login_required
def salvar_acessibilidade(request):
    #guarda se e datonismo ou contraste e o tipo de daltonismo ou contraste
    tipo  = request.POST.get('tipo')
    valor = request.POST.get('valor')   

    #vai ao perfil do utilizador e guarda a preferencia
    perfil = request.user.perfil
    if tipo == 'daltonismo':
        perfil.daltonismo = valor 
    elif tipo == 'contraste':
        perfil.contraste = valor

    #guarda tipo update
    perfil.save()
    return JsonResponse({'status': 'success'})#o js sabe que de sucesso




@receiver(post_save, sender=User)
def criar_perfil_utilizador_social(sender, instance, created, **kwargs):
    if created:
        #quando inicio sessao com o google o prefil ficava sem idade, instituicao e ano loetivo, assim se entrar co google mete definicoes dfault
        Perfil.objects.get_or_create(
            user=instance,
            defaults={
                'filtro_daltonismo': 'normal',
                'filtro_contraste': 'normal',
                'instituicao': 'Não definida',
                'ano_letivo': 'Não definido',
                'idade': 0
            }
        )

@login_required
def editar_perfil(request):
    #identifica o perfil na bd
    perfil = request.user.perfil
    #se carregar em guardar alteracoes
    if request.method == 'POST':
        form = EditarPerfilForm(request.POST, instance=perfil)
        
        #valida se ta direito e atualiza na bd
        if form.is_valid():
            form.save()
            return redirect('perfil')
    else:
        #quando entra para editar
        form = EditarPerfilForm(instance=perfil)
    
    return render(request, 'users/editar_perfil.html', {'form': form})