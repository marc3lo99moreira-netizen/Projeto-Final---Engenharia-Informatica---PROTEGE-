from django import forms
from .models import Perfil

class EditarPerfilForm(forms.ModelForm):
    class Meta:
        model = Perfil
        fields = ['instituicao', 'ano_letivo', 'idade']
        widgets = {
            'instituicao': forms.TextInput(attrs={'class': 'caixa-texto-protege'}),
            'ano_letivo': forms.TextInput(attrs={'class': 'caixa-texto-protege'}),
            'idade': forms.NumberInput(attrs={'class': 'caixa-texto-protege'}),
        }