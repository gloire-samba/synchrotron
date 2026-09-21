from django.contrib import admin

# Register your models here.

from .models import User, Expert, TimeSlot, Appointment

# Enregistrement des modèles pour pouvoir les manipuler depuis /admin/
admin.site.register(User)
admin.site.register(Expert)
admin.site.register(TimeSlot)
admin.site.register(Appointment)
