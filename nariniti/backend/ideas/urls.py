from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.AnalyzeIdeaView.as_view(), name='ideas-analyze'),
    path('analyze-audio/', views.AnalyzeAudioView.as_view(), name='ideas-analyze-audio'),
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='ideas-dashboard-stats'),
    path('', views.BusinessIdeaListView.as_view(), name='ideas-list'),
    path('<int:pk>/', views.BusinessIdeaDetailView.as_view(), name='ideas-detail'),
    path('<int:pk>/save/', views.SaveIdeaView.as_view(), name='ideas-save'),
]
