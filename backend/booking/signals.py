from django.dispatch import receiver
from allauth.account.signals import user_signed_up, password_changed
from django.core.mail import send_mail
from django.conf import settings

@receiver(user_signed_up)
def envoyer_email_bienvenue(request, user, **kwargs):
    try:
        send_mail(
            subject="Bienvenue sur le portail Synchrotron SOLEIL",
            message=f"Bonjour,\n\nVotre compte a été créé avec succès avec l'adresse {user.email}.\nVous pouvez dès à présent réserver vos lignes de lumière.\n\nL'équipe Synchrotron.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Erreur SMTP (Bienvenue) : {e}")

@receiver(password_changed)
def envoyer_email_mot_de_passe_modifie(request, user, **kwargs):
    try:
        send_mail(
            subject="Modification de votre mot de passe",
            message=f"Bonjour,\n\nNous vous confirmons que votre mot de passe a bien été mis à jour.\nSi vous n'êtes pas à l'origine de cette action, contactez-nous immédiatement.\n\nL'équipe Synchrotron.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        print(f"Erreur SMTP (Mot de passe) : {e}")