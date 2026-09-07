from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("checkout", views.checkout, name="checkout"),
    path("complete", views.complete, name="complete"),
    path("cancel", views.cancel, name="cancel"),
    path("health", views.health, name="health"),
]
