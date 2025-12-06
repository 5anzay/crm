from rest_framework import viewsets,status
from rest_framework.permissions import AllowAny
from base.models import Product, Customer, Supplier, PurchaseOrder,Sale, SaleItem,SupplierPayment,CustomerPayment, Expense, Return, ReturnItem
from .serializers import ProductSerializer, CustomerSerializer, SupplierSerializer,PurchaseOrderSerializer, SaleSerializer, SaleItemSerializer, SupplierPaymentSerializer, CustomerPaymentSerializer, ExpenseSerializer,ReportSerializer,DashboardSerializer, ReturnSerializer
from django.db import transaction
from .utils import generate_invoice_pdf
from .pdf_utils import generate_report_pdf
from datetime import datetime, timedelta
from django.db.models import Sum, F, Count
from decimal import Decimal
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.decorators import action
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

class AuthCheckView(APIView):
    permission_classes = [IsAuthenticated]  # Only accessible with valid JWT

    def get(self, request):
        return Response({"authenticated": True, "username": request.user.username})


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]


class CustomerPaymentViewSet(viewsets.ModelViewSet):
    queryset = CustomerPayment.objects.all().order_by("-id")
    serializer_class = CustomerPaymentSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def perform_destroy(self, instance):
        # Revert customer balance when deleting a payment
        customer = instance.customer
        customer.balance += instance.amount
        customer.save(update_fields=["balance"])
        instance.delete()

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [AllowAny]

class SupplierPaymentViewSet(viewsets.ModelViewSet):
    queryset = SupplierPayment.objects.all().order_by("-id")
    serializer_class = SupplierPaymentSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def perform_destroy(self, instance):
        supplier = instance.supplier
        supplier.balance += instance.amount  # revert balance
        supplier.save(update_fields=["balance"])
        instance.delete()

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def perform_destroy(self, instance):
        # 1️⃣ Restore product stock
        for item in instance.items.all():
            product = item.product
            if product:
                product.stock -= item.quantity
                product.save()

        # 2️⃣ Adjust supplier balance
        supplier = instance.supplier
        if supplier:
            supplier.balance -= instance.remaining_amount
            supplier.save(update_fields=['balance'])

        # 3️⃣ Delete the purchase order
        instance.delete()
#work
class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by("-id")
    serializer_class = SaleSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def perform_destroy(self, instance):
        # 1. Restore stock from all related returns
        sale_returns = Return.objects.filter(sale=instance)
        for ret in sale_returns:
            for item in ret.items.all():
                if item.product:
                    item.product.stock = item.product.stock - item.quantity
                    item.product.save()

        # 2. Restore stock from sale items
        for item in instance.items.all():
            if item.product:
                item.product.stock = item.product.stock + item.quantity
                item.product.save()

        # 3. Adjust customer balance (assuming balance = debt)
        if instance.customer:
            instance.customer.balance = instance.customer.balance - instance.remaining_amount
            instance.customer.save(update_fields=['balance'])

        # 4. Delete all linked returns
        sale_returns.delete()

        # 5. Delete the sale
        instance.delete()




class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]





class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        today = now().date()
        current_year = today.year

        # --- Status Cards ---
        total_sales_today = Sale.objects.filter(date=today).aggregate(total=Sum('total_amount'))['total'] or 0
        total_paid_today = Sale.objects.filter(date=today).aggregate(total=Sum('paid_amount'))['total'] or 0
        total_customer_payment_today = CustomerPayment.objects.filter(date=today).aggregate(total=Sum('amount'))['total'] or 0



        total_expense_today = Expense.objects.filter(date=today).aggregate(total=Sum('amount'))['total'] or 0
        total_supplier_payment_today = SupplierPayment.objects.filter(date=today).aggregate(total=Sum('amount'))['total'] or 0

        # Calculate total returns for today
        total_returns_today = 0
        for return_obj in Return.objects.filter(date=today).prefetch_related('items'):
            for item in return_obj.items.all():
                total_returns_today += item.quantity * item.unit_price

        total_sales_today =total_sales_today- total_returns_today

        money_in_today = total_paid_today + total_customer_payment_today

        money_out_today = total_expense_today + total_supplier_payment_today

        # --- Net Profit (for today's sales only) ---
        net_profit_today = 0
        today_sales = Sale.objects.prefetch_related('items__product').filter(date=today)
        for sale in today_sales:
            sale_profit = sum([
                item.quantity * (item.unit_price - (item.product.cost_price if item.product else 0))
                for item in sale.items.all()
            ])
            net_profit_today += sale_profit

        # Subtract profit loss from today's returns
        today_returns = Return.objects.prefetch_related('items__product').filter(date=today)
        for return_obj in today_returns:
            return_loss = sum([
                item.quantity * (item.unit_price - (item.product.cost_price if item.product else 0))
                for item in return_obj.items.all()
            ])
            net_profit_today -= return_loss

        total_customers = Customer.objects.count()

        status_cards = {
            "total_sales_today": total_sales_today,
            "money_in_today": money_in_today,
            "money_out_today": money_out_today,
            "net_profit": net_profit_today,  # ✅ profit for today's sales minus returns
            "total_customers": total_customers,
        }

        # --- Low Stock Products ---
        low_stock_qs = Product.objects.filter(stock__lte=10).values('name', 'stock')
        low_stock_products = [{"product": p['name'], "quantity": p['stock']} for p in low_stock_qs]

        # --- Recent Sales ---
        recent_sales_qs = Sale.objects.all().order_by("-date")[:5]
        recent_sales = []
        for s in recent_sales_qs:
            profit = sum(
                [
                    item.quantity * (item.unit_price - (item.product.cost_price if item.product else 0))
                    for item in s.items.all()
                ]
            )
            recent_sales.append({
                "date": s.nepal_date,
                "invoice_number": s.invoice_number,
                "customer_display": s.customer.name if s.customer else "N/A",
                "total": s.total_amount,
                "profit": profit,
            })

        # --- Chart Data ---
        chart_today = [{
            "name": today.strftime("%b %d"),
            "sales": total_sales_today,
            "expense": money_out_today
        }]

        # Monthly: weekly sales & expenses
        chart_monthly = []
        first_day_month = today.replace(day=1)
        for week in range(4):
            start = first_day_month + timedelta(days=week * 7)
            end = start + timedelta(days=7)
            sales_total = Sale.objects.filter(date__gte=start, date__lt=end).aggregate(total=Sum('total_amount'))['total'] or 0

            filtered_returns = Return.objects.filter(date__gte=start, date__lt=end)
            total_refund = sum([r.get_total_refund() for r in filtered_returns], Decimal(0))

            #return_total = Return.objects.filter(date__gte=start, date__lt=end).aggregate(total=Sum('total_refund'))['total'] or 0
            sales_total-=total_refund
            expense_total = Expense.objects.filter(date__gte=start, date__lt=end).aggregate(total=Sum('amount'))['total'] or 0
            chart_monthly.append({"name": f"Week {week+1}", "sales": sales_total, "expense": expense_total})

        # Yearly: monthly sales & expenses
        chart_yearly = []
        for month in range(1, 13):
            sales_total = Sale.objects.filter(date__year=current_year, date__month=month).aggregate(total=Sum('total_amount'))['total'] or 0

            filtered_returns = Return.objects.filter(date__year=current_year, date__month=month)
            total_refund = sum([r.get_total_refund() for r in filtered_returns], Decimal(0))
            sales_total-=total_refund
            expense_total = Expense.objects.filter(date__year=current_year, date__month=month).aggregate(total=Sum('amount'))['total'] or 0
            chart_yearly.append({
                "name": datetime(current_year, month, 1).strftime("%b"),
                "sales": sales_total,
                "expense": expense_total
            })

        chart = {"today": chart_today, "monthly": chart_monthly, "yearly": chart_yearly}

        data = {
            "status_cards": status_cards,
            "low_stock_products": low_stock_products,
            "recent_sales": recent_sales,
            "chart": chart,
        }
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


#for report






class ReportViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = ReportSerializer

    # ---------------- JSON Preview ----------------
    def list(self, request):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        report_type = serializer.validated_data["type"]
        month = serializer.validated_data.get("month")
        year = serializer.validated_data.get("year") or datetime.today().year

        data = self.get_report_data(report_type, month, year)
        return Response(data)

    # ---------------- PDF Download ----------------
    @action(detail=False, methods=["get"], url_path="download")
    def download_pdf(self, request):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        report_type = serializer.validated_data["type"]
        month = serializer.validated_data.get("month")
        year = serializer.validated_data.get("year") or datetime.today().year

        data = self.get_report_data(report_type, month, year)
        response = generate_report_pdf(report_type, data, month, year, inline=True)
        return response

    # ---------------- Report Handlers ----------------
    def get_report_data(self, report_type, month, year):
        handlers = {
            "product": self.get_product_report,
            "sales": self.get_sales_report,
            "purchaseorder": self.get_purchase_report,
            "customer": self.get_customer_report,
            "supplier": self.get_supplier_report,
            "expense": self.get_expense_report,
            "return": self.get_returns_report,
        }
        return handlers.get(report_type, lambda m, y: {"error": "Invalid report type"})(month, year)

    # Utility function to filter month/year or annual
    def _filter_by_date(self, qs, month, year):
        if month:
            return qs.filter(date__month=month, date__year=year)
        return qs.filter(date__year=year)

    # 1️⃣ Product Report
    # 1️⃣ Product Report - UPDATED
    def get_product_report(self, month, year):
        """
        Generates a product report accounting for returns.
        """
        # Sales filter
        sales_filter = {"sale__date__year": year}
        if month != 0:
            sales_filter["sale__date__month"] = month

        # Returns filter
        returns_filter = {"return_ref__date__year": year}
        if month != 0:
            returns_filter["return_ref__date__month"] = month

        # Fetch all sale items and return items
        sales = SaleItem.objects.filter(**sales_filter)
        returns = ReturnItem.objects.filter(**returns_filter)

        products = Product.objects.all()
        report = []
        total_sold_quantities = {}
        LOW_STOCK_THRESHOLD = 5

        for product in products:
            # Calculate sold quantity
            sold_items = sales.filter(product=product)
            total_sold_qty = sold_items.aggregate(total_qty=Sum("quantity"))["total_qty"] or 0

            # Subtract returned quantity
            returned_items = returns.filter(product=product)
            total_returned_qty = returned_items.aggregate(total_qty=Sum("quantity"))["total_qty"] or 0

            net_sold_qty = total_sold_qty - total_returned_qty

            # Calculate revenue (sold - returned)
            total_revenue = Decimal(
                sold_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"] or 0
            )
            returned_revenue = Decimal(
                returned_items.aggregate(total=Sum(F("quantity") * F("unit_price")))["total"] or 0
            )
            net_revenue = total_revenue - returned_revenue

            # Calculate cost and profit
            total_cost = Decimal(net_sold_qty) * Decimal(product.cost_price)
            profit = net_revenue - total_cost

            report.append({
                "product": product.name,
                "sold_quantity": float(net_sold_qty),
                "total_revenue": float(round(net_revenue, 2)),
                "total_cost": float(round(total_cost, 2)),
                "profit": float(round(profit, 2)),
                "remaining_stock": float(product.stock),
            })
            total_sold_quantities[product.name] = net_sold_qty

        # Summary Stats
        total_products = products.count()
        low_stock_count = products.filter(stock__lte=LOW_STOCK_THRESHOLD).count()
        most_sold_product = max(total_sold_quantities, key=total_sold_quantities.get) if total_sold_quantities else "N/A"
        product_revenues = {p["product"]: p["total_revenue"] for p in report}
        favorite_product = max(product_revenues, key=product_revenues.get) if product_revenues else "N/A"

        summary = {
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "most_sold_product": most_sold_product,
            "favorite_product": favorite_product,
        }

        return {
            "items": report,
            "summary": summary,
        }

    # 2️⃣ Sales Report - UPDATED
    def get_sales_report(self, month, year):
        sales_qs = self._filter_by_date(Sale.objects.all(), month, year)
        returns_qs = self._filter_by_date(Return.objects.all(), month, year)

        total_profit = 0
        items = []

        # Calculate sales
        for sale in sales_qs:
            sale_items = sale.items.all()
            sale_profit = sum(
                float((item.quantity or 0) * (item.unit_price or 0) - (item.quantity or 0) * (item.product.cost_price or 0))
                for item in sale_items if item.product
            )
            total_profit += sale_profit

            items.append({
                "date": sale.nepal_date,
                "invoice_number": sale.invoice_number,
                "customer_display": sale.customer.name if sale.customer else "N/A",
                "total": float(sale.total_amount),
                "profit": round(sale_profit, 2),
            })

        # Calculate total returns
        total_returns = 0
        returns_profit_loss = 0
        for return_obj in returns_qs:
            return_items = return_obj.items.all()
            for item in return_items:
                return_amount = float((item.quantity or 0) * (item.unit_price or 0))
                total_returns += return_amount

                if item.product:
                    profit_loss = float((item.quantity or 0) * (item.unit_price or 0) - (item.quantity or 0) * (item.product.cost_price or 0))
                    returns_profit_loss += profit_loss

        # Adjust totals for returns
        total_sales = float(sales_qs.aggregate(total=Sum("total_amount"))["total"] or 0)
        net_sales = total_sales - total_returns
        net_profit = total_profit - returns_profit_loss

        summary = {
            "total_sales": round(net_sales, 2),
            "sales_count": sales_qs.count(),
            "total_profit": round(net_profit, 2),
            "total_returns": round(total_returns, 2),  # Added for visibility
        }

        return {"summary": summary, "items": items}

    # 3️⃣ Customer Report - UPDATED
    def get_customer_report(self, month, year):
        customers = Customer.objects.all()
        items = []
        total_sales_all = 0
        total_paid_all = 0
        total_balance_all = 0
        total_sales_count_all = 0
        total_returns_all = 0

        for customer in customers:
            # Sales
            sales_qs = self._filter_by_date(Sale.objects.filter(customer=customer), month, year)
            total_sales = float(sales_qs.aggregate(total=Sum("total_amount"))["total"] or 0)
            total_paid_sales = float(sales_qs.aggregate(total=Sum("paid_amount"))["total"] or 0)
            sale_count = sales_qs.count()
            date = sales_qs.first().nepal_date if sales_qs.exists() else None

            # Payments
            payments_qs = self._filter_by_date(CustomerPayment.objects.filter(customer=customer), month, year)
            total_payments = float(payments_qs.aggregate(total=Sum("amount"))["total"] or 0)
            total_paid_combined = total_paid_sales + total_payments

            # Returns
            returns_qs = self._filter_by_date(Return.objects.filter(customer=customer), month, year)
            total_returns = 0
            for return_obj in returns_qs:
                for item in return_obj.items.all():
                    total_returns += float((item.quantity or 0) * (item.unit_price or 0))

            # Net sales after returns
            net_sales = total_sales

            items.append({
                "date": date,
                "customer": customer.name,
                "total_sales": round(net_sales, 2),
                "total_paid": total_paid_combined,
                "balance": float(customer.balance),

                "total_returns": round(total_returns, 2),  # Added for visibility
            })

            total_sales_all += net_sales
            total_paid_all += total_paid_combined
            total_balance_all += float(customer.balance)
            total_sales_count_all += sale_count
            total_returns_all += total_returns

        summary = {
            "total_customers": customers.count(),
            "total_sales": round(total_sales_all, 2),
            "total_paid": total_paid_all,
            "total_balance": total_balance_all,

            "total_returns": round(total_returns_all, 2),  # Added for visibility
        }

        return {"summary": summary, "items": items}


    # 3️⃣ Purchase Report
    def get_purchase_report(self, month, year):
        purchases_qs = self._filter_by_date(PurchaseOrder.objects.all(), month, year)

        summary = {
            "total_purchase": float(purchases_qs.aggregate(total=Sum("total_amount"))["total"] or 0),
            "total_paid": float(purchases_qs.aggregate(total=Sum("paid_amount"))["total"] or 0),
            "total_due": float(purchases_qs.aggregate(total=Sum("remaining_amount"))["total"] or 0),
            "purchase_count": purchases_qs.count(),
        }

        items = [
            {
                "date": po.nepal_date,
                "invoice_number": po.invoice_number,
                "supplier_display": po.supplier.name if po.supplier else "N/A",
                "total": float(po.total_amount),
                "paid": float(po.paid_amount),
                "due": float(po.remaining_amount),
            }
            for po in purchases_qs
        ]

        return {"summary": summary, "items": items}


    # 5️⃣ Supplier Report
    def get_supplier_report(self, month, year):
        suppliers = Supplier.objects.all()
        items = []

        total_purchase_all = 0
        total_paid_all = 0
        total_balance_all = 0
        total_purchase_count_all = 0

        for supplier in suppliers:
            purchases_qs = self._filter_by_date(PurchaseOrder.objects.filter(supplier=supplier), month, year)
            total_purchase = float(purchases_qs.aggregate(total=Sum("total_amount"))["total"] or 0)
            total_paid_po = float(purchases_qs.aggregate(total=Sum("paid_amount"))["total"] or 0)
            purchase_count = purchases_qs.count()

            payments_qs = self._filter_by_date(SupplierPayment.objects.filter(supplier=supplier), month, year)
            total_supplier_payments = float(payments_qs.aggregate(total=Sum("amount"))["total"] or 0)
            total_paid_combined = total_paid_po + total_supplier_payments
            date = purchases_qs.first().nepal_date if purchases_qs.exists() else None

            items.append({
                "date": date,
                "supplier": supplier.name,
                "total_purchase": total_purchase,
                "total_paid": total_paid_combined,
                "balance": float(supplier.balance),
                "purchase_count": purchase_count,
            })

            total_purchase_all += total_purchase
            total_paid_all += total_paid_combined
            total_balance_all += float(supplier.balance)
            total_purchase_count_all += purchase_count

        summary = {
            "total_suppliers": suppliers.count(),
            "total_purchase": total_purchase_all,
            "total_paid": total_paid_all,
            "total_balance": total_balance_all,
            "purchase_count": total_purchase_count_all,
        }

        return {"summary": summary, "items": items}

    # 6️⃣ Expense Report
    def get_expense_report(self, month, year):
        expenses_qs = self._filter_by_date(Expense.objects.all(), month, year)

        total_expense = float(expenses_qs.aggregate(total=Sum("amount"))["total"] or 0)
        summary = {
            "total_expense": total_expense,
            "expense_count": expenses_qs.count(),
        }

        items = [
            {
                "category": b["category"],
                "total": float(b["total"]),
                "count": b["count"],
            }
            for b in expenses_qs.values("category").annotate(
                total=Sum("amount"),
                count=Count("id")
            )
        ]

        return {"summary": summary, "items": items}


    # 7️⃣ Returns Report
    def get_returns_report(self, month, year):
        returns_qs = self._filter_by_date(Return.objects.all(), month, year)

        items = []
        total_refund_all = 0

        for return_obj in returns_qs:
            return_items = return_obj.items.all()
            total_refund = sum(
                float((item.quantity or 0) * (item.unit_price or 0))
                for item in return_items
            )

            items.append({
                "date": return_obj.nepal_date,
                "invoice_number": return_obj.sale.invoice_number if return_obj.sale else "N/A",
                "customer": return_obj.customer.name if return_obj.customer else "N/A",
                "total_refund": round(total_refund, 2),
                "comment": return_obj.comment or "",
            })

            total_refund_all += total_refund

        summary = {
            "total_returns": returns_qs.count(),
            "total_refund": round(total_refund_all, 2),
        }

        return {"summary": summary, "items": items}



#returns

class ReturnViewSet(viewsets.ModelViewSet):
    queryset = Return.objects.all().order_by('-id')
    serializer_class = ReturnSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        items_data = serializer.validated_data.pop("items", [])
        return_obj = Return.objects.create(**serializer.validated_data)

        total_refund = Decimal(0)

        for item in items_data:
            return_item = ReturnItem.objects.create(
                return_ref=return_obj,
                **item
            )

            line_total = return_item.quantity * return_item.unit_price
            total_refund += line_total

            if return_item.product:
                return_item.product.stock += return_item.quantity
                return_item.product.save()

            sale = return_obj.sale
            if sale:
                #sale.total_amount -= line_total
                #sale.remaining_amount -= line_total
                #sale.paid_amount -=line_total
                sale.save()

            if return_obj.customer:
                return_obj.customer.balance -= line_total
                return_obj.customer.save()

        response_data = ReturnSerializer(return_obj).data
        response_data["total_refund"] = total_refund

        return Response(response_data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return Response({"detail": "Updating returns is not allowed."}, status=400)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return_obj = self.get_object()

        for item in return_obj.items.all():
            line_total = item.quantity * item.unit_price

            if item.product:
                item.product.stock -= item.quantity
                item.product.save()

            if return_obj.sale:
                #return_obj.sale.total_amount += line_total
                #return_obj.sale.remaining_amount += line_total
                #return_obj.sale.paid_amount += line_total
                return_obj.sale.save()

            if return_obj.customer:
                return_obj.customer.balance += line_total
                return_obj.customer.save()

        return_obj.delete()
        return Response({"detail": "Return deleted and stock/sale/customer restored."}, status=204)
