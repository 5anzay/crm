from django.db import models
import os
from django.conf import settings
from django.utils import timezone
import re
from decimal import Decimal

# Create your models here.

class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return self.name


class CustomerPayment(models.Model):

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    comment = models.TextField(blank=True)
    date = models.DateField(default=timezone.now, null=True, blank=True)
    nepal_date = models.TextField(blank=True)

    def __str__(self):
        return f"{self.customer.name} - {self.amount}"

# base/models.py

class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # new field
    stock = models.IntegerField(default=0)
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



class Supplier(models.Model):
    name = models.CharField(max_length=200)
    email = models.CharField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return self.name

class SupplierPayment(models.Model):
    receipt_number = models.CharField(max_length=100, blank=True, null=True)  # NEW
    supplier = models.ForeignKey("Supplier", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
      # keep as text field for flexible date input
    comment = models.TextField(blank=True)
    date = models.DateField(null=True, blank=True,default=timezone.now)
    nepal_date = models.TextField(blank=True)

    def __str__(self):
        return f"{self.supplier.name} - {self.amount}"




class PurchaseOrder(models.Model):
    invoice_number = models.CharField(max_length=255)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField(null=True, blank=True, default=timezone.now)
    nepal_date = models.TextField(blank=True)  # only date, no timestamp
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"PO-{self.invoice_number}"


class POItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField(default=1)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.product_name} ({self.quantity})"


def invoice_upload_to(instance, filename):
    # invoices/sale_<id>/invoice_<invoice_number>.pdf
    folder = os.path.join("invoices", f"sale_{instance.id or 'temp'}")
    return os.path.join(folder, filename)

class Sale(models.Model):
    invoice_number = models.CharField(max_length=255, unique=True, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales",
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    date = models.DateField(null=True, blank=True, default=timezone.now)
    nepal_date = models.TextField(blank=True)
    comment = models.TextField(blank=True)
    invoice_pdf = models.FileField(upload_to=invoice_upload_to, null=True, blank=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Sale"
        verbose_name_plural = "Sales"

    def __str__(self):
        return f"Sale-{self.invoice_number}"

    def save(self, *args, **kwargs):
        """
        Automatically generate invoice number with prefix "INV-".
        Starts from INV-00001 and increments sequentially.
        """
        if not self.invoice_number:
            prefix = "JSMT-"
            last_sale = Sale.objects.filter(invoice_number__startswith=prefix).order_by("-id").first()

            if last_sale:
                match = re.search(r"(\d+)$", last_sale.invoice_number)
                next_number = int(match.group(1)) + 1 if match else 1
            else:
                next_number = 1

            # Add zero-padding (zfill 5 → INV-00001)
            self.invoice_number = f"{prefix}{str(next_number).zfill(5)}"

        super().save(*args, **kwargs)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def line_total(self):
        return (self.quantity or 0) * float(self.unit_price or 0)

    def __str__(self):
        return f"{self.sale.invoice_number} — {self.product_name or (self.product and self.product.name) or 'Unknown'}"



class Return(models.Model):
    sale = models.ForeignKey('Sale', on_delete=models.CASCADE, related_name='returns')
    customer = models.ForeignKey(
        'Customer',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='returns'
    )
    date = models.DateField(default=timezone.now)
    nepal_date = models.CharField(max_length=50, blank=True)
    comment = models.TextField(blank=True, null=True)

    def get_total_refund(self):
        total = Decimal(0)
        for item in self.items.all():  # assuming related_name='items'
            total += item.quantity * item.unit_price
        return total

    def __str__(self):
        return f"Return-{self.id} | Sale: {self.sale.invoice_number} | Customer: {self.customer.name if self.customer else 'Unknown'}"


class ReturnItem(models.Model):
    return_ref = models.ForeignKey(Return, on_delete=models.CASCADE, related_name='items')
    sale_item = models.ForeignKey('SaleItem', on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def line_total(self):
        return self.quantity * self.unit_price  # Decimal calculation

    def __str__(self):
        product_name = self.product.name if self.product else "Unknown"
        return f"{product_name} | Qty: {self.quantity}"



class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("Home", "Home"),
        ("Salary", "Salary"),
        ("Shop", "Shop"),
        ("Maintenance", "Maintenance"),
        ("Other", "Other"),
    ]

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="other")
    date = models.DateField(default=timezone.now, null=True, blank=True)
    nepal_date = models.TextField(blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.category} - {self.amount}"
