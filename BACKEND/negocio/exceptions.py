from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        detail = response.data
        code = status.__dict__.get(f'HTTP_{response.status_code}', 'unknown')

        formatted = {
            'error': True,
            'detail': detail,
            'code': response.status_code,
        }

        if isinstance(detail, dict):
            formatted['fields'] = {
                k: v[0] if isinstance(v, list) else v
                for k, v in detail.items()
            }

        response.data = formatted

    else:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unhandled exception: {exc}", exc_info=True)

        response = Response(
            {
                'error': True,
                'detail': 'Error interno del servidor',
                'code': 500,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
