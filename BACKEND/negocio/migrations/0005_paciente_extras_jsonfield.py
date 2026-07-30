import json
from django.db import migrations, models


def convert_extras_to_json(apps, schema_editor):
    Paciente = apps.get_model('negocio', 'Paciente')
    for p in Paciente.objects.all():
        if p.extras is None:
            continue
        if isinstance(p.extras, str):
            raw = p.extras.strip()
            if not raw:
                p.extras = json.dumps([])
            elif raw.startswith('['):
                p.extras = raw
            else:
                lines = [line.strip() for line in raw.replace('- ', '').split('\n') if line.strip()]
                p.extras = json.dumps(lines) if lines else json.dumps([])
            p.save(update_fields=['extras'])


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0004_tratamiento_add_duracion_descripcion'),
    ]

    operations = [
        migrations.RunPython(convert_extras_to_json, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='paciente',
            name='extras',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]
