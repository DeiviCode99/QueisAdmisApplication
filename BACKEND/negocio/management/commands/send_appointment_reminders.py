import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from pywebpush import webpush, WebPushException
from negocio.models import PushSubscription, Cita


class Command(BaseCommand):
    help = 'Send push notifications for upcoming appointments'

    def add_arguments(self, parser):
        parser.add_argument('--type', choices=['daily', 'hourly'], default='hourly')

    def handle(self, *args, **options):
        now = timezone.localtime()
        reminder_type = options['type']

        if reminder_type == 'daily':
            tomorrow = now.date() + timezone.timedelta(days=1)
            citas = Cita.objects.filter(
                fecha_hora=tomorrow,
                estado='PEND'
            ).select_related('paciente', 'servicio')
            title = 'Recordatorio de citas para mañana'
            body_template = 'Mañana tienes {count} cita(s) pendiente(s)'
        else:
            hour_ahead = now + timezone.timedelta(hours=1)
            citas = Cita.objects.filter(
                fecha_hora=hour_ahead.date(),
                hora__hour=hour_ahead.hour,
                estado='PEND'
            ).select_related('paciente', 'servicio')
            title = 'Cita en 1 hora'
            body_template = 'Tienes una cita con {paciente} a las {hora}'

        if not citas.exists():
            self.stdout.write('No pending appointments found for reminder')
            return

        subscriptions = PushSubscription.objects.all()
        if not subscriptions.exists():
            self.stdout.write(self.style.WARNING('No push subscriptions found'))
            return

        for cita in citas:
            if reminder_type == 'daily':
                body = body_template.format(count=citas.count())
            else:
                body = body_template.format(
                    paciente=f"{cita.paciente.nombres} {cita.paciente.apellidos}",
                    hora=cita.hora.strftime('%H:%M')
                )

            payload = json.dumps({
                'title': title,
                'body': body,
                'icon': '/pwa-192x192.png',
                'badge': '/pwa-192x192.png',
                'tag': f'appointment-{cita.id}',
                'data': {
                    'url': '/citas',
                    'appointmentId': cita.id,
                }
            })

            for sub in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            'endpoint': sub.endpoint,
                            'keys': {
                                'auth': sub.auth_key,
                                'p256dh': sub.p256dh_key,
                            }
                        },
                        data=payload,
                        vapid_private_key=settings.VAPID_PRIVATE_KEY,
                        vapid_claims=settings.VAPID_CLAIMS,
                    )
                except WebPushException as e:
                    if e.response and e.response.status_code in (410, 404):
                        sub.delete()
                        self.stdout.write(self.style.WARNING(f'Removed expired subscription {sub.id}'))
                    else:
                        self.stdout.write(self.style.ERROR(f'Push failed for sub {sub.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Sent {len(subscriptions)} notifications for {citas.count()} appointments'))
