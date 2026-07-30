from django.db import models
    
    #TRATAMIENTO

class Tratamiento(models.Model):
    """Tratamiento médico o estético ofrecido en el establecimiento."""
    nombre = models.CharField(max_length=100)
    duracion = models.PositiveIntegerField(default=60, help_text="Duración en minutos")
    descripcion = models.TextField(blank=True, default='')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
    
    #APERITIVO

class Aperitivo(models.Model):
    """Bebida o aperitivo disponible para incluir en una cita."""
    nombre = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre 

#TRABAJADOR


class Colaborador(models.Model):
    """Empleado o profesional que presta servicios en el establecimiento."""
    DOCUMENT_TYPES = [
        ('CC', 'Cédula de ciudadanía'),
        ('CE', 'Cédula de extranjería'),
    ]
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    tipo_documento = models.CharField(
        max_length=2,
        choices=DOCUMENT_TYPES,
        default='CC'
    )
    numero_documento = models.CharField(max_length=10, unique=True)
    celular = models.CharField(max_length=20)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

#SERVICIO

class Servicio(models.Model):
    """Servicio ofrecido que puede incluir múltiples tratamientos."""
    nombre = models.CharField(max_length=100)
    duracion = models.PositiveIntegerField(default=60, help_text="Duración en minutos")
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tratamientos = models.ManyToManyField(Tratamiento, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre
    
#PACIENTE

class Paciente(models.Model):
    """Cliente o paciente registrado en el sistema."""
    DOCUMENT_TYPES = [
        ('CC', 'Cédula de ciudadanía'),
        ('TI', 'Tarjeta de identidad'),
        ('CE', 'Cédula de extranjería'),
    ]

    ETIQUETAS = [
        ('NUV', 'Cliente Nuevo'),
        ('ANT', 'Cliente Antiguo'),
        ('PPN', 'Cliente Pago Pendiente'),
        ('JOD', 'Cliente Jodido'),
    ]

    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)

    tipo_documento = models.CharField(
        max_length=2,
        choices=DOCUMENT_TYPES,
        default='CC',
        null=True,
    )

    etiquetas_pac = models.CharField(
        max_length=3,
        choices=ETIQUETAS,
        default='ANT',
        null=True,
    )

    numero_documento = models.CharField(max_length=10, null=True)
    celular = models.CharField(max_length=20)
    direccion = models.CharField(max_length=100, blank=True, null=True)
    fecha_nacimiento = models.DateField(null=True)
    #-------------------------------------------
    emergencia_nombre = models.CharField(max_length=500, blank=True, null=True)
    emergencia_number = models.CharField(max_length=10, blank=True, null=True)
    #-------------------------------------------
    condiciones_medicas = models.TextField(blank=True, null=True)
    alergias = models.TextField(blank=True, null=True)
    extras = models.JSONField(blank=True, null=True, default=list)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
    
#CITA

class Cita(models.Model):
    """Cita agendada entre paciente y colaborador para un servicio."""
    ESTADOS_TYPES = [
        ('PEND', 'Pendiente'),
        ('REAL', 'Realizada'),
        ('CANC', 'Cancelada'),
        ('RETR', 'Atrasada'),
    ]

    paciente = models.ForeignKey(Paciente, on_delete=models.CASCADE)
    colaborador = models.ForeignKey(Colaborador, on_delete=models.CASCADE)
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)
    aperitivos = models.ManyToManyField(Aperitivo, blank=True)
    fecha_hora = models.DateField()
    hora = models.TimeField()
    estado = models.CharField(max_length=4, choices=ESTADOS_TYPES, default='PEND')
    notas = models.TextField(blank=True, null=True)
    saldo_pend = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cita de {self.paciente} - {self.fecha_hora.strftime('%Y-%m-%d %H:%M')}"

   # HISTORIA CLÍNICA

class HistoriaClinica(models.Model):
    """Historial clínico asociado a un paciente."""
    paciente = models.OneToOneField(Paciente, on_delete=models.CASCADE, related_name='historia_clinica')
    observaciones = models.TextField(blank=True, null=True)
    recomendaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Historia clínica - {self.paciente}"


class PushSubscription(models.Model):
    """Suscripción push del navegador para notificaciones."""
    endpoint = models.TextField(unique=True)
    auth_key = models.CharField(max_length=255)
    p256dh_key = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Push sub {self.id}"