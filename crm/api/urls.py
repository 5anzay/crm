from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import AuthCheckView

router = DefaultRouter()
router.register("products", views.ProductViewSet)
router.register("customers", views.CustomerViewSet)
router.register("suppliers", views.SupplierViewSet)
router.register(r"purchase-orders", views.PurchaseOrderViewSet, basename="purchase-order")
router.register(r"sales", views.SaleViewSet, basename="sales")
router.register(r'supplier-payments', views.SupplierPaymentViewSet)
router.register(r'customer-payments', views.CustomerPaymentViewSet)
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'reports', views.ReportViewSet, basename='reports')
router.register(r'dashboard', views.DashboardViewSet, basename='dashboard')
router.register(r'returns', views.ReturnViewSet, basename='return')
urlpatterns = [
    path("", include(router.urls)),
    path("auth-check/", AuthCheckView.as_view(), name="auth-check"),
]
