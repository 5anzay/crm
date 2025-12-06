from io import BytesIO
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


def generate_report_pdf(report_type: str, data: dict | list, month: int, year: int, inline=False) -> HttpResponse:
    """
    Generate a PDF for any report type with dynamic table columns,
    summary section, column width adjustments, and text wrapping.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    # Styles
    styles = getSampleStyleSheet()
    normal = styles["Normal"]
    title_style = styles["Title"]
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], spaceAfter=6)
    wrap_style = ParagraphStyle("Wrap", parent=normal, alignment=TA_LEFT)

    elements = []

    # ---------------- TITLE ----------------
    title_text = f"{report_type.capitalize()} Report - {month}/{year}"
    elements.append(Paragraph(f"<b>{title_text}</b>", title_style))
    elements.append(Spacer(1, 12))

    # ---------------- SUMMARY ----------------
    summary = {}
    items = []

    if isinstance(data, dict):
        summary = data.get("summary", {})
        items = data.get("items", [])
    elif isinstance(data, list):
        items = data

    if summary:
        elements.append(Paragraph("<b>Summary:</b>", heading_style))

        # Define keys that are counts (no $)
        count_keys = ["total_customers", "total_suppliers", "sales_count", "purchase_count","expense_count","total_products"]

        for key, value in summary.items():
            if key in count_keys:
                display_value = str(value)  # just number, no $
            elif isinstance(value, (int, float)):
                display_value = f"${value:,.2f}"  # monetary fields
            else:
                display_value = str(value)

            elements.append(Paragraph(f"{key.replace('_', ' ').capitalize()}: {display_value}", normal))

        elements.append(Spacer(1, 12))

    # ---------------- TABLE ----------------
    table_data = []
    col_alignments = []

    if items and isinstance(items, list):
        # Dynamic headers
        headers = list(items[0].keys())
        table_data.append([Paragraph(h.replace("_", " ").capitalize(), styles["Normal"]) for h in headers])

        for item in items:
            row = []
            for h in headers:
                value = item.get(h, "")
                if isinstance(value, float) and ("total" in h or "balance" in h or "paid" in h):
                    row.append(Paragraph(f"${value:,.2f}", wrap_style))
                else:
                    row.append(Paragraph(str(value), wrap_style))
            table_data.append(row)

        # Determine alignment per column
        col_alignments = []
        for h in headers:
            if "total" in h or "balance" in h or "paid" in h or "amount" in h or "qty" in h:
                col_alignments.append("RIGHT")
            else:
                col_alignments.append("LEFT")

    else:
        table_data.append([Paragraph("No data available", normal)])
        col_alignments.append("CENTER")

    # ---------------- TABLE STYLING ----------------
    table = Table(table_data, repeatRows=1, hAlign="LEFT")
    n_cols = len(table_data[0])

    # Build alignment list
    alignment_list = [(i, 0, i, -1) for i in range(n_cols)]
    for i, align in enumerate(col_alignments):
        table.setStyle([("ALIGN", (i, 0), (i, -1), align)])

    # General style
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#475569")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
    ]))

    # Optional: adjust column widths based on number of columns
    page_width = A4[0] - 4 * cm  # total width minus margins
    col_width = page_width / n_cols
    table._argW = [col_width] * n_cols

    elements.append(table)

    # ---------------- BUILD PDF ----------------
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()

    response = HttpResponse(pdf_data, content_type="application/pdf")
    response["Content-Length"] = len(pdf_data)
    disposition = "inline" if inline else "attachment"
    response["Content-Disposition"] = f'{disposition}; filename="{report_type}_report_{month}_{year}.pdf"'

    return response
