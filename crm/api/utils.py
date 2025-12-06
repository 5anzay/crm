import os
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
def generate_invoice_pdf(sale):
    """Generate and save invoice PDF to MEDIA_ROOT/invoices/"""
    try:
        invoices_dir = os.path.join(settings.MEDIA_ROOT, "invoices")
        os.makedirs(invoices_dir, exist_ok=True)

        filename = f"invoice_{sale.invoice_number}.pdf"
        filepath = os.path.join(invoices_dir, filename)

        # Remove old file if exists
        if os.path.exists(filepath):
            os.remove(filepath)

        c = canvas.Canvas(filepath, pagesize=A4)
        width, height = A4

        # --- draw invoice content ---
        c.setFont("Helvetica-Bold", 16)
        c.drawString(30 * mm, height - 30 * mm, f"INVOICE #{sale.invoice_number}")
        c.setFont("Helvetica", 10)
        c.drawString(30 * mm, height - 40 * mm, f"Date: {sale.date}")
        c.drawString(30 * mm, height - 47 * mm, f"Customer: {sale.customer.name if sale.customer else '-'}")

        y = height - 70 * mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(30 * mm, y, "Item")
        c.drawString(100 * mm, y, "Qty")
        c.drawString(120 * mm, y, "Price")
        c.drawString(150 * mm, y, "Total")

        y -= 10
        c.setFont("Helvetica", 10)
        for item in sale.items.all():
            if y < 40 * mm:
                c.showPage()
                y = height - 30 * mm
            c.drawString(30 * mm, y, item.product_name or (item.product.name if item.product else "-"))
            c.drawString(100 * mm, y, str(item.quantity))
            c.drawString(120 * mm, y, f"${item.unit_price:.2f}")
            c.drawString(150 * mm, y, f"${item.quantity * item.unit_price:.2f}")
            y -= 8

        y -= 15
        c.setFont("Helvetica-Bold", 11)
        c.drawString(30 * mm, y, f"Total Amount: ${sale.total_amount:.2f}")
        y -= 10
        c.drawString(30 * mm, y, f"Paid: ${sale.paid_amount:.2f}")
        y -= 10
        c.drawString(30 * mm, y, f"Remaining: ${sale.remaining_amount:.2f}")

        y -= 20
        c.setFont("Helvetica", 9)
        c.drawString(30 * mm, y, f"Generated on {timezone.now().strftime('%Y-%m-%d %H:%M')}")

        c.showPage()
        c.save()

        # Update sale with invoice PDF path
        sale.invoice_pdf = f"invoices/{filename}"
        sale.save(update_fields=["invoice_pdf"])

    except Exception as e:
        print(f"⚠️ Failed to generate PDF: {e}")
