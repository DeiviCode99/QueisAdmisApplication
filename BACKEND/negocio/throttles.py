from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class RegisterAnonThrottle(AnonRateThrottle):
    scope = 'register'


class ReportUserThrottle(UserRateThrottle):
    scope = 'report'


class LoginAnonThrottle(AnonRateThrottle):
    scope = 'login'


class BurstUserThrottle(UserRateThrottle):
    scope = 'burst'
