from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'

    def ready(self):
        # Importa os sinais para garantir que eles sejam registrados
        import users.models
