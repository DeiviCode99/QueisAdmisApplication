import time
import jwt
import requests
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Create a user in Supabase Auth'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str)
        parser.add_argument('password', type=str)

    def handle(self, *args, **options):
        service_token = jwt.encode(
            {
                'role': 'service_role',
                'iss': 'supabase',
                'iat': int(time.time()),
                'exp': int(time.time()) + 300,
            },
            settings.SUPABASE_JWT_SECRET,
            algorithm='HS256',
        )

        url = f'https://{settings.SUPABASE_PROJECT_REF}.supabase.co/auth/v1/admin/users'
        headers = {
            'apikey': settings.SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {service_token}',
            'Content-Type': 'application/json',
        }
        payload = {
            'email': options['email'],
            'password': options['password'],
            'email_confirm': True,
        }

        resp = requests.post(url, json=payload, headers=headers)

        if resp.status_code == 200:
            self.stdout.write(self.style.SUCCESS(f'User {options["email"]} created in Supabase Auth'))
        else:
            self.stdout.write(self.style.ERROR(f'Error: {resp.status_code} {resp.text}'))
