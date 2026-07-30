from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Synchronize PostgreSQL auto-increment sequences after manual data imports'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.relname
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relkind = 'S'
                  AND n.nspname = 'public'
                ORDER BY c.relname
            """)
            sequences = [row[0] for row in cursor.fetchall()]

            if not sequences:
                self.stdout.write(self.style.WARNING('No sequences found'))
                return

            self.stdout.write(f"Found {len(sequences)} sequences\n")

            for seq in sequences:
                table = seq.replace('_id_seq', '')
                cursor.execute(f"SELECT setval('{seq}', COALESCE((SELECT MAX(id) FROM \"{table}\"), 1))")
                new_val = cursor.fetchone()[0]
                self.stdout.write(self.style.SUCCESS(f'  ✓ {seq} → {new_val}'))

            self.stdout.write(self.style.SUCCESS('\nAll sequences synchronized'))
