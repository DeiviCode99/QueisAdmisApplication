from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Cita, HistoriaClinica

@receiver(post_save, sender=Cita)
def crear_historia_clinica(sender, instance, created, **kwargs):
    if created:
        paciente = instance.paciente
        if not HistoriaClinica.objects.filter(paciente=paciente).exists():
            HistoriaClinica.objects.create(paciente=paciente)
