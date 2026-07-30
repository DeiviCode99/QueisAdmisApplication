from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Enable RLS and create deny-all policies on all public tables for Supabase'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            """)
            tables = [row[0] for row in cursor.fetchall()]

            if not tables:
                self.stdout.write(self.style.WARNING('No tables found in public schema'))
                return

            self.stdout.write(f"Found {len(tables)} tables in public schema\n")

            for table in tables:
                self.stdout.write(f"Processing: {table}...")

                cursor.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY')

                cursor.execute(f'''
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM pg_policies
                            WHERE schemaname = 'public'
                            AND tablename = '{table}'
                            AND policyname = 'deny_all'
                        ) THEN
                            DROP POLICY "deny_all" ON public."{table}";
                        END IF;
                    END
                    $$;
                ''')

                cursor.execute(f'''
                    CREATE POLICY "deny_all" ON public."{table}"
                    AS PERMISSIVE
                    FOR ALL
                    TO public
                    USING (false)
                    WITH CHECK (false)
                ''')

                self.stdout.write(self.style.SUCCESS(f'  ✓ RLS enabled + deny_all policy'))

            self.stdout.write(self.style.SUCCESS(
                f'\nDone! {len(tables)} tables secured. '
                'Supabase REST API access is now blocked for all tables.\n'
                'Django backend continues to work normally via direct DB connection.'
            ))
