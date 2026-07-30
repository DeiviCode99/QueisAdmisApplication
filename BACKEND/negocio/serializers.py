from rest_framework import serializers
from django.core.validators import RegexValidator, MaxLengthValidator, MinLengthValidator
from django.utils import timezone
from datetime import date
from .models import Paciente, Colaborador, Servicio, Tratamiento, Cita, HistoriaClinica, Aperitivo, PushSubscription

alpha_re = RegexValidator(
    regex=r'^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$',
    message='Solo se permiten letras y espacios'
)
digits_re = RegexValidator(
    regex=r'^\d+$',
    message='Solo se permiten números'
)


def validate_meaningful_name(value):
    """Valida que el nombre tenga al menos 3 caracteres y no sean todos repetidos."""
    stripped = value.strip()
    if len(stripped) < 3:
        raise serializers.ValidationError('Debe tener al menos 3 caracteres')
    unique_chars = set(stripped.lower().replace(' ', ''))
    if len(unique_chars) < 2:
        raise serializers.ValidationError('El nombre no puede consistir solo de caracteres repetidos')
    return value


class TratamientoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Tratamiento."""
    nombre = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )

    class Meta:
        model = Tratamiento
        fields = '__all__'


class AperitivoSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Aperitivo."""

    class Meta:
        model = Aperitivo
        fields = '__all__'


class ServicioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Servicio con tratamientos relacionados."""
    tratamientos = TratamientoSerializer(many=True, read_only=True)
    tratamientos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Tratamiento.objects.all(),
        source='tratamientos',
    )
    nombre = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )

    class Meta:
        model = Servicio
        fields = '__all__'

    def create(self, validated_data):
        tratamientos = validated_data.pop('tratamientos', [])
        instance = Servicio.objects.create(**validated_data)
        if tratamientos:
            instance.tratamientos.set(tratamientos)
            instance.duracion = sum(t.duracion for t in tratamientos)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        tratamientos = validated_data.pop('tratamientos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if tratamientos is not None:
            instance.tratamientos.set(tratamientos)
            instance.duracion = sum(t.duracion for t in tratamientos)
        instance.save()
        return instance


class PacienteSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Paciente con validaciones de datos personales."""
    nombres = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )
    apellidos = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )
    celular = serializers.CharField(
        validators=[digits_re, MaxLengthValidator(20)]
    )
    numero_documento = serializers.CharField(
        required=False, allow_blank=True, allow_null=True,
        validators=[digits_re, MaxLengthValidator(10)]
    )
    emergencia_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True,
        validators=[digits_re, MaxLengthValidator(10)]
    )
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Paciente
        fields = '__all__'

    def validate_fecha_nacimiento(self, value):
        if value is None:
            return value
        if value > date.today():
            raise serializers.ValidationError('La fecha de nacimiento no puede ser futura')
        age = date.today().year - value.year - (
            (date.today().month, date.today().day) < (value.month, value.day)
        )
        if age < 15:
            raise serializers.ValidationError('El paciente debe tener al menos 15 años')
        return value


class ColaboradorSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Colaborador con validaciones de datos personales."""
    nombres = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )
    apellidos = serializers.CharField(
        validators=[alpha_re, MinLengthValidator(3), validate_meaningful_name]
    )
    celular = serializers.CharField(
        validators=[digits_re, MaxLengthValidator(20)]
    )
    numero_documento = serializers.CharField(
        validators=[digits_re, MaxLengthValidator(10)]
    )

    class Meta:
        model = Colaborador
        fields = '__all__'


class CitaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Cita con manejo de relaciones y cálculo de saldo."""
    paciente = PacienteSerializer(read_only=True)
    colaborador = ColaboradorSerializer(read_only=True)
    servicio = ServicioSerializer(read_only=True)

    paciente_id = serializers.PrimaryKeyRelatedField(queryset=Paciente.objects.all(), write_only=True)
    colaborador_id = serializers.PrimaryKeyRelatedField(queryset=Colaborador.objects.all(), write_only=True)
    servicio_id = serializers.PrimaryKeyRelatedField(queryset=Servicio.objects.all(), write_only=True)

    aperitivos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Aperitivo.objects.all(),
        write_only=True
    )

    aperitivos_info = AperitivoSerializer(many=True, read_only=True, source='aperitivos')
    saldo_pend = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id',
            'paciente', 'paciente_id',
            'colaborador', 'colaborador_id',
            'servicio', 'servicio_id',
            'aperitivos', 'aperitivos_info',
            'fecha_hora', 'hora',
            'notas', 'estado', 'saldo_pend',
            'created_at'
        ]

    def validate(self, attrs):
        fecha_hora = attrs.get('fecha_hora')
        instance = getattr(self, 'instance', None)
        if fecha_hora and fecha_hora < date.today():
            if not instance or instance.estado != 'RETR':
                raise serializers.ValidationError(
                    {'fecha_hora': 'No se puede crear una cita en una fecha pasada'}
                )
        return attrs

    def create(self, validated_data):
        paciente = validated_data.pop('paciente_id')
        colaborador = validated_data.pop('colaborador_id')
        servicio = validated_data.pop('servicio_id')
        aperitivos = validated_data.pop('aperitivos', [])

        total_aperitivos = sum([a.precio for a in aperitivos])
        cita = Cita.objects.create(
            paciente=paciente,
            colaborador=colaborador,
            servicio=servicio,
            saldo_pend=servicio.precio + total_aperitivos,
            **validated_data
        )
        cita.aperitivos.set(aperitivos)

        return cita

    def update(self, instance, validated_data):
        if instance.estado in ('REAL', 'CANC'):
            raise serializers.ValidationError(
                {'estado': 'No se puede modificar una cita que ya fue realizada o cancelada'}
            )

        if 'estado' in validated_data and validated_data['estado'] in ('REAL', 'CANC'):
            if instance.estado == 'RETR':
                instance.estado = validated_data.pop('estado')
                instance.save(update_fields=['estado'])
                return instance

        if 'paciente_id' in validated_data:
            instance.paciente = validated_data.pop('paciente_id')
        if 'colaborador_id' in validated_data:
            instance.colaborador = validated_data.pop('colaborador_id')
        if 'servicio_id' in validated_data:
            instance.servicio = validated_data.pop('servicio_id')
        if 'aperitivos' in validated_data:
            aperitivos = validated_data.pop('aperitivos')
            instance.aperitivos.set(aperitivos)
        else:
            aperitivos = instance.aperitivos.all()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if 'saldo_pend' not in validated_data:
            total = 0
            if instance.servicio:
                total += float(instance.servicio.precio or 0)
            total += sum(float(ap.precio or 0) for ap in aperitivos)
            instance.saldo_pend = total

        instance.save()
        return instance


class HistoriaClinicaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo HistoriaClinica."""
    class Meta:
        model = HistoriaClinica
        fields = '__all__'


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo PushSubscription de notificaciones push."""
    class Meta:
        model = PushSubscription
        fields = ['id', 'endpoint', 'auth_key', 'p256dh_key']
        extra_kwargs = {
            'endpoint': {'required': True},
            'auth_key': {'required': True},
            'p256dh_key': {'required': True},
        }
