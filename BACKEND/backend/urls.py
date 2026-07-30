from django.contrib import admin
from django.http import HttpResponse
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny, IsAuthenticated
from negocio.throttles import LoginAnonThrottle

def health_check(request):
    return HttpResponse("ok")

urlpatterns = [
    path('', health_check),
    path('admin/', admin.site.urls),
    path('api/', include('negocio.urls')),
    path('api/token/', TokenObtainPairView.as_view(throttle_classes=[LoginAnonThrottle]), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(throttle_classes=[LoginAnonThrottle]), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[IsAuthenticated]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[IsAuthenticated]), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[IsAuthenticated]), name='redoc'),
]
