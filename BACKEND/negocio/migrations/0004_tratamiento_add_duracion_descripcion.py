from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('negocio', '0003_remove_tratamiento_descripcion_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tratamiento',
            name='descripcion',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='tratamiento',
            name='duracion',
            field=models.PositiveIntegerField(default=60, help_text='Duración en minutos'),
        ),
    ]
