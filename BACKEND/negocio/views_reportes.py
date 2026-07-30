from io import BytesIO
from datetime import datetime
from collections import defaultdict

from django.db.models import Count, Sum
from django.http import HttpResponse

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework import status

from .models import Cita, Paciente
from .throttles import ReportUserThrottle


@api_view(['GET'])
def report_months(request):
    months = (
        Cita.objects
        .dates('fecha_hora', 'month', order='DESC')
    )
    result = []
    for m in months:
        label = m.strftime('%B %Y').capitalize()
        total = Cita.objects.filter(
            fecha_hora__year=m.year, fecha_hora__month=m.month
        ).count()
        ingresos = (
            Cita.objects
            .filter(fecha_hora__year=m.year, fecha_hora__month=m.month, estado='REAL')
            .aggregate(t=Sum('saldo_pend'))['t'] or 0
        )
        result.append({
            'mes': m.strftime('%Y-%m'),
            'label': label,
            'total_citas': total,
            'ingresos': float(ingresos),
        })
    return Response(result)


@api_view(['GET'])
def report_month_detail(request, mes):
    try:
        year, month = map(int, mes.split('-'))
    except (ValueError, IndexError):
        return Response({'error': 'Formato inválido. Use YYYY-MM'}, status=status.HTTP_400_BAD_REQUEST)

    citas = Cita.objects.filter(fecha_hora__year=year, fecha_hora__month=month)
    total = citas.count()
    realizadas = citas.filter(estado='REAL').count()
    canceladas = citas.filter(estado='CANC').count()
    pendientes = citas.filter(estado='PEND').count()
    ingresos = float(citas.filter(estado='REAL').aggregate(t=Sum('saldo_pend'))['t'] or 0)

    # Pacientes nuevos en el mes
    nuevos = Paciente.objects.filter(
        created_at__year=year, created_at__month=month
    ).count()

    # Por servicio
    por_servicio = (
        citas.values('servicio__nombre')
        .annotate(cantidad=Count('id'), ingresos=Sum('saldo_pend'))
        .order_by('-cantidad')
    )
    servicios = [
        {'servicio': s['servicio__nombre'], 'cantidad': s['cantidad'], 'ingresos': float(s['ingresos'] or 0)}
        for s in por_servicio
    ]

    # Por colaborador
    por_colaborador = (
        citas.values('colaborador__nombres', 'colaborador__apellidos')
        .annotate(cantidad=Count('id'), ingresos=Sum('saldo_pend'))
        .order_by('-cantidad')
    )
    colaboradores = [
        {
            'colaborador': f"{c['colaborador__nombres']} {c['colaborador__apellidos']}",
            'cantidad': c['cantidad'],
            'ingresos': float(c['ingresos'] or 0),
        }
        for c in por_colaborador
    ]

    return Response({
        'mes': mes,
        'resumen': {
            'total_citas': total,
            'realizadas': realizadas,
            'canceladas': canceladas,
            'pendientes': pendientes,
            'ingresos_totales': ingresos,
            'nuevos_pacientes': nuevos,
        },
        'por_servicio': servicios,
        'por_colaborador': colaboradores,
    })


@api_view(['GET'])
@throttle_classes([ReportUserThrottle])
def report_pdf(request, mes):
    try:
        year, month = map(int, mes.split('-'))
    except (ValueError, IndexError):
        return HttpResponse('Formato inválido', status=400)

    citas = Cita.objects.filter(fecha_hora__year=year, fecha_hora__month=month)
    realizadas = citas.filter(estado='REAL')
    total = citas.count()
    n_realizadas = realizadas.count()
    n_canceladas = citas.filter(estado='CANC').count()
    n_pendientes = citas.filter(estado='PEND').count()
    ingresos = float(realizadas.aggregate(t=Sum('saldo_pend'))['t'] or 0)

    # Top 5 servicios
    top_servicios = (
        realizadas.values('servicio__nombre')
        .annotate(cantidad=Count('id'), total=Sum('saldo_pend'))
        .order_by('-cantidad')[:5]
    )

    # Top 5 colaboradores
    top_colaboradores = (
        realizadas.values('colaborador__nombres', 'colaborador__apellidos')
        .annotate(cantidad=Count('id'), total=Sum('saldo_pend'))
        .order_by('-cantidad')[:5]
    )

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('Title2', parent=styles['Title'], fontSize=18, spaceAfter=6))
    styles.add(ParagraphStyle('Normal2', parent=styles['Normal'], fontSize=10, spaceAfter=4))

    elements = []

    # Header
    elements.append(Paragraph('Belleza Plena SPA', styles['Title2']))
    elements.append(Paragraph('Sistema de Gestión - Reporte Mensual', styles['Normal2']))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#059669')))
    elements.append(Spacer(1, 12))

    mes_label = datetime(year, month, 1).strftime('%B %Y').capitalize()
    elements.append(Paragraph(f'<b>Período:</b> {mes_label}', styles['Normal2']))
    elements.append(Spacer(1, 16))

    # Resumen table
    resumen_data = [
        ['Métrica', 'Valor'],
        ['Total de citas', str(total)],
        ['Realizadas', str(n_realizadas)],
        ['Canceladas', str(n_canceladas)],
        ['Pendientes', str(n_pendientes)],
        ['Ingresos totales', f'${ingresos:,.0f}'],
    ]
    t = Table(resumen_data, colWidths=[3*inch, 1.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
        ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Top servicios
    if top_servicios:
        elements.append(Paragraph('<b>Top Servicios</b>', styles['Normal2']))
        elements.append(Spacer(1, 6))
        svc_data = [['Servicio', 'Cantidad', 'Ingresos']]
        for s in top_servicios:
            svc_data.append([s['servicio__nombre'], str(s['cantidad']), f'${float(s["total"] or 0):,.0f}'])
        t = Table(svc_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

    # Top colaboradores
    if top_colaboradores:
        elements.append(Paragraph('<b>Top Colaboradores</b>', styles['Normal2']))
        elements.append(Spacer(1, 6))
        col_data = [['Colaborador', 'Citas', 'Ingresos']]
        for c in top_colaboradores:
            name = f"{c['colaborador__nombres']} {c['colaborador__apellidos']}"
            col_data.append([name, str(c['cantidad']), f'${float(c["total"] or 0):,.0f}'])
        t = Table(col_data, colWidths=[2.5*inch, 1*inch, 1.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
        ]))
        elements.append(t)

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width='100%', thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph('Generado por Belleza Plena SPA - Sistema de Gestión', ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)))

    doc.build(elements)
    buf.seek(0)

    response = HttpResponse(buf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Reporte-{mes}.pdf"'
    return response


@api_view(['GET'])
def report_list(request):
    months = Cita.objects.dates('fecha_hora', 'month', order='DESC')
    result = []
    for m in months:
        mes = m.strftime('%Y-%m')
        label = m.strftime('%B %Y').capitalize()
        total = Cita.objects.filter(fecha_hora__year=m.year, fecha_hora__month=m.month).count()
        result.append({
            'nombre': f'Reporte {label}',
            'mes': mes,
            'total_citas': total,
            'pdf_url': f'/api/reportes/meses/{mes}/pdf/',
        })
    return Response(result)
