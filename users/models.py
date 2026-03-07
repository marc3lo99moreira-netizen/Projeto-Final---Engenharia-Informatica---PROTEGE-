from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.utils import translation


class Perfil(models.Model):
    OPCOES_DALTONISMO = [
        ('normal', 'Padrão'),
        ('protanopia', 'Protanopia'),
        ('deuteranopia', 'Deuteranopia'),
        ('tritanopia', 'Tritanopia'),
        ('achromatopsia', 'P&B'),
    ]
    CONTRASTE_CHOICES = [
        ('normal', 'Padrão'),
        ('alto-contraste', 'Alto Contraste'),
        ('contraste-invertido', 'Invertido'),
        ('modo-escuro', 'Modo Escuro'),
    ]
    LINGUA_CHOICES = [
        ('pt', 'Português'),
        ('en', 'English'),
    ]
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    instituicao = models.CharField(max_length=200)
    idade = models.PositiveIntegerField()
    ano_letivo = models.CharField(max_length=50)
    nivel_geral = models.IntegerField(default=1)
    xp_geral = models.IntegerField(default=0)
    nivel_quiz = models.IntegerField(default=1)
    quizzes_realizados = models.PositiveIntegerField(default=0)
    soma_percentagens = models.FloatField(default=0.0)
    pontuacao_total_quiz = models.IntegerField(default=0)

    nivel_simulador = models.IntegerField(default=1)
    simuladores_realizados = models.PositiveIntegerField(default=0)
    pontuacao_total_simulador = models.IntegerField(default=0)
    
    filtro_daltonismo = models.CharField(max_length=20, choices=OPCOES_DALTONISMO, default='normal')
    filtro_contraste = models.CharField(max_length=20, choices=CONTRASTE_CHOICES, default='normal')
    lingua = models.CharField(max_length=20, choices=LINGUA_CHOICES, default='pt')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def precisao_media(self):
        if self.quizzes_realizados == 0:
            return 0
        return round(self.soma_percentagens / self.quizzes_realizados, 1)

    def __str__(self):
        return f"Perfil de {self.user.username}"
    
    @receiver(user_logged_in)
    def sincronizar_lingua_pos_login(sender, request, user, **kwargs):
        if hasattr(user, 'perfil'):
            lang = user.perfil.lingua
            # Ativamos a língua na sessão que o Django acabou de criar para este user
            translation.activate(lang)
            request.session['_language'] = lang
            request.session.modified = True
            


class Mensagem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assunto = models.CharField(max_length=200)
    mensagem = models.TextField()
    criada_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-criada_em']
    
    def __str__(self):
        return f"{self.assunto} - {self.user.username}"


