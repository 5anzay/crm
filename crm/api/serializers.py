# serializers.py
from rest_framework import serializers
from base.models import Customer, Product, Supplier, POItem, PurchaseOrder,Sale, SaleItem, SupplierPayment,CustomerPayment, Expense, Return,ReturnItem
from django.db import transaction
from api.utils import generate_invoice_pdf


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class CustomerPaymentSerializer(serializers.ModelSerializer):
    customer_display = serializers.CharField(source="customer.name", read_only=True)
    customer_balance = serializers.DecimalField(
        source="customer.balance", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = CustomerPayment
        fields = [
            "id",
            "customer",
            "customer_display",
            "customer_balance",
            "amount",

            "date",
            "comment",
            "nepal_date",
        ]

    @transaction.atomic
    def create(self, validated_data):
        payment = CustomerPayment.objects.create(**validated_data)
        customer = payment.customer
        # Ensure balance decreases correctly
        customer.balance = (customer.balance or 0) - (payment.amount or 0)
        customer.save(update_fields=["balance"])
        return payment

    @transaction.atomic
    def update(self, instance, validated_data):
        old_customer = instance.customer
        old_amount = instance.amount or 0

        new_customer = validated_data.get("customer", old_customer)
        new_amount = validated_data.get("amount", old_amount) or 0

        if old_customer != new_customer:
            # Revert old payment from old customer
            old_customer.balance = (old_customer.balance or 0) + old_amount
            old_customer.save(update_fields=["balance"])

            # Apply new payment to new customer
            new_customer.balance = (new_customer.balance or 0) - new_amount
            new_customer.save(update_fields=["balance"])
        else:
            # Same customer, adjust balance by difference
            delta = new_amount - old_amount
            old_customer.balance = (old_customer.balance or 0) - delta
            old_customer.save(update_fields=["balance"])

        return super().update(instance, validated_data)

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"

# serializers.py

class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_display = serializers.CharField(source="supplier.name", read_only=True)
    supplier_balance = serializers.DecimalField(source="supplier.balance", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SupplierPayment
        fields = [
            "id",
            "supplier",
            "supplier_display",
            "supplier_balance",
            "amount",
            "receipt_number",
            "date",
            "comment",
            "nepal_date",
        ]

    @transaction.atomic
    def create(self, validated_data):
        payment = SupplierPayment.objects.create(**validated_data)
        supplier = payment.supplier
        supplier.balance -= payment.amount  # subtract payment
        supplier.save(update_fields=["balance"])
        return payment

    @transaction.atomic
    def update(self, instance, validated_data):
        old_supplier = instance.supplier
        old_amount = instance.amount

        new_supplier = validated_data.get("supplier", old_supplier)
        new_amount = validated_data.get("amount", old_amount)

        # If supplier changed
        if old_supplier != new_supplier:
            old_supplier.balance += old_amount  # revert old payment
            old_supplier.save(update_fields=["balance"])

            new_supplier.balance -= new_amount  # apply new payment
            new_supplier.save(update_fields=["balance"])
        else:
            # Same supplier, apply delta
            delta = old_amount - new_amount
            old_supplier.balance += delta
            old_supplier.save(update_fields=["balance"])

        # Update other fields
        return super().update(instance, validated_data)





class POItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = POItem
        fields = ['id', 'product', 'product_name', 'quantity', 'cost_price']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = POItemSerializer(many=True)
    supplier_display = serializers.CharField(source='supplier.name', read_only=True)
    supplier_balance = serializers.DecimalField(source="supplier.balance", max_digits=10, decimal_places=2, read_only=True)
    date = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"], required=False, allow_null=True)
    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'invoice_number',
            'supplier',
            'supplier_display',
            'paid_amount',
            'total_amount',
            'remaining_amount',
            'items',
            'date',
            'comment',
            'supplier_balance',
            'nepal_date'
        ]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        supplier = validated_data.get('supplier')

        po = PurchaseOrder.objects.create(**validated_data)
        total_amount = 0

        for item in items_data:
            product = item['product']
            qty = item.get('quantity', 0)
            cost_price = item.get('cost_price', 0)

            if product:
                product.stock += qty
                product.save()

            POItem.objects.create(purchase_order=po, **item)
            total_amount += qty * cost_price

        po.total_amount = total_amount
        po.remaining_amount = total_amount - po.paid_amount
        po.save()

        # ✅ Update supplier balance (subtract remaining amount)
        if supplier:
            supplier.balance += po.remaining_amount
            supplier.save(update_fields=['balance'])

        return po

    @transaction.atomic
    def update(self, instance, validated_data):
        new_items = validated_data.pop('items', [])
        old_supplier = instance.supplier
        old_remaining = instance.remaining_amount

        # Update basic fields
        instance.supplier = validated_data.get('supplier', instance.supplier)
        instance.invoice_number = validated_data.get('invoice_number', instance.invoice_number)
        instance.paid_amount = validated_data.get('paid_amount', instance.paid_amount)
        instance.date = validated_data.get('date', instance.date)
        instance.comment = validated_data.get('comment', instance.comment)

        # Track old items for stock adjustment
        old_items = {item.product.id: item.quantity for item in instance.items.all()}
        instance.items.all().delete()

        total_amount = 0
        updated_products = set()

        # Re-create items and update product stock
        for item in new_items:
            product = item['product']
            old_qty = old_items.get(product.id, 0) if product else 0
            qty = item.get('quantity', 0)
            cost_price = item.get('cost_price', 0)

            if product:
                delta = qty - old_qty
                product.stock += delta
                product.save()
                updated_products.add(product.id)

            POItem.objects.create(purchase_order=instance, **item)
            total_amount += qty * cost_price

        # Adjust stock for removed products
        for pid, qty in old_items.items():
            if pid not in updated_products:
                try:
                    product = Product.objects.get(id=pid)
                    product.stock -= qty
                    product.save()
                except Product.DoesNotExist:
                    continue

        # Calculate new remaining amount
        new_remaining = total_amount - instance.paid_amount

        # Update PO totals
        instance.total_amount = total_amount
        instance.remaining_amount = new_remaining
        instance.save()

        # Adjust supplier balance by delta
        if instance.supplier:
            if old_supplier == instance.supplier:
                # same supplier: adjust by difference
                delta_balance = new_remaining - old_remaining
                instance.supplier.balance += delta_balance
            else:
                # different supplier: revert old, apply new
                if old_supplier:
                    old_supplier.balance -= old_remaining
                    old_supplier.save(update_fields=['balance'])
                instance.supplier.balance += new_remaining

            instance.supplier.save(update_fields=['balance'])

        return instance



class SaleItemSerializer(serializers.ModelSerializer):
    product_display = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_display",
            "product_name",
            "quantity",
            "unit_price",
        ]
        extra_kwargs = {
            "product": {"required": False, "allow_null": True},
            "product_name": {"required": False, "allow_blank": True},
        }

    def validate(self, data):
        """Ensure quantity and unit_price are valid."""
        if data.get("quantity", 0) < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        if data.get("unit_price", 0) < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return data






class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    customer_display = serializers.CharField(source="customer.name", read_only=True)
    date = serializers.DateField(
        format="%Y-%m-%d",
        input_formats=["%Y-%m-%d"],
        required=False,
        allow_null=True,
    )
    nepal_date = serializers.CharField(required=False, allow_blank=True)
    comment = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "invoice_number",
            "customer",
            "customer_display",
            "total_amount",
            "paid_amount",
            "remaining_amount",
            "items",
            "date",
            "nepal_date",
            "comment",
            "invoice_pdf",
        ]
        read_only_fields = ["invoice_number", "invoice_pdf"]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        sale = Sale.objects.create(**validated_data)

        total_amount = 0
        for item in items_data:
            product = item.get("product")
            qty = item["quantity"]
            price = item["unit_price"]

            if product:
                product.stock -= qty
                product.save()

            SaleItem.objects.create(
                sale=sale,
                product=product,
                product_name=item.get("product_name") or (product.name if product else None),
                quantity=qty,
                unit_price=price,
            )

            total_amount += qty * price

        sale.total_amount = total_amount
        sale.remaining_amount = total_amount - sale.paid_amount
        sale.save()

        # Adjust customer balance
        if sale.customer:
            sale.customer.balance += sale.remaining_amount
            sale.customer.save()


        return sale

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", [])

        # Track old items for stock adjustments
        old_items = {i.product.id if i.product else None: i.quantity for i in instance.items.all()}

        # New product IDs
        new_product_ids = {item.get("product").id for item in items_data if item.get("product")}

        # Restore stock for removed products
        for product_id, qty in old_items.items():
            if product_id and product_id not in new_product_ids:
                product = Product.objects.get(id=product_id)
                product.stock += qty
                product.save()

        # Delete old items
        instance.items.all().delete()

        # Update sale fields
        instance.customer = validated_data.get("customer", instance.customer)
        instance.paid_amount = validated_data.get("paid_amount", instance.paid_amount)
        instance.date = validated_data.get("date", instance.date)
        instance.nepal_date = validated_data.get("nepal_date", instance.nepal_date)
        instance.comment = validated_data.get("comment", instance.comment)

        total_amount = 0

        for item in items_data:
            product = item.get("product")
            qty = item["quantity"]
            price = item["unit_price"]
            old_qty = old_items.get(product.id if product else None, 0)

            if product:
                delta = qty - old_qty
                product.stock -= delta
                product.save()

            SaleItem.objects.create(
                sale=instance,
                product=product,
                product_name=item.get("product_name") or (product.name if product else None),
                quantity=qty,
                unit_price=price,
            )

            total_amount += qty * price

        # Update totals
        old_remaining = instance.remaining_amount
        instance.total_amount = total_amount
        instance.remaining_amount = total_amount - instance.paid_amount
        instance.save()



        # Adjust customer balance based on delta
        if instance.customer:
            delta_balance = instance.remaining_amount - old_remaining
            instance.customer.balance += delta_balance
            instance.customer.save()

        return instance



class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            "id",
            "amount",
            "category",
            "date",
            "nepal_date",
            "notes",
        ]
        read_only_fields = ["id"]



from rest_framework import serializers


class DashboardChartSerializer(serializers.Serializer):
    name = serializers.CharField()
    sales = serializers.FloatField()
    expense = serializers.FloatField()


class StatusCardSerializer(serializers.Serializer):
    total_sales_today = serializers.FloatField()
    money_in_today = serializers.FloatField()
    money_out_today = serializers.FloatField()
    net_profit = serializers.FloatField()
    total_customers = serializers.IntegerField()


class LowStockProductSerializer(serializers.Serializer):
    product = serializers.CharField()
    quantity = serializers.IntegerField()


class RecentSaleSerializer(serializers.Serializer):
    date = serializers.DateField()
    invoice_number = serializers.CharField()
    customer_display = serializers.CharField()
    total = serializers.FloatField()
    profit = serializers.FloatField()


class DashboardSerializer(serializers.Serializer):
    status_cards = StatusCardSerializer()
    low_stock_products = LowStockProductSerializer(many=True)
    recent_sales = RecentSaleSerializer(many=True)
    chart = serializers.DictField(
        child=DashboardChartSerializer(many=True)
    )






# for report onlyt

class ReportSerializer(serializers.Serializer):
    month = serializers.IntegerField(required=False)
    year = serializers.IntegerField(required=False)
    type = serializers.ChoiceField(
        choices=["product", "sales", "purchaseorder", "customer", "supplier", "expense","return"]
    )



#returns

class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(required=False, allow_blank=True, read_only=True)

    class Meta:
        model = ReturnItem
        fields = [
            "id",
            "sale_item",
            "product",
            "product_name",
            "quantity",
            "unit_price",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        """Add product_name when reading data"""
        data = super().to_representation(instance)
        data['product_name'] = instance.product.name if instance.product else ""
        return data


class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True)
    invoice_number = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    total_refund = serializers.SerializerMethodField()  # Change this line

    class Meta:
        model = Return
        fields = [
            "id",
            "sale",
            "customer",
            "date",
            "nepal_date",
            "comment",
            "items",
            "total_refund",
            "invoice_number",
            "customer_name",

        ]
        read_only_fields = ["id", "total_refund", "invoice_number", "customer_name","get_total_refund"]

    def get_invoice_number(self, obj):
        return obj.sale.invoice_number if obj.sale else "-"

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else "-"

    def get_total_refund(self, obj):
        """Calculate total refund from items"""
        from decimal import Decimal
        total = Decimal(0)
        for item in obj.items.all():
            total += item.quantity * item.unit_price
        return total
