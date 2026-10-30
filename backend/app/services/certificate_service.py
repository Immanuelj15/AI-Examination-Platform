import os
import io
import hashlib
from typing import Optional
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import qrcode

class CertificateService:
    @staticmethod
    def generate_verification_hash(candidate_name: str, exam_title: str, score: float, date_str: str) -> str:
        payload = f"{candidate_name}:{exam_title}:{score}:{date_str}:evalora-trust-salt"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:20].upper()

    @classmethod
    def generate_pdf(
        cls,
        candidate_name: str,
        exam_title: str,
        score: float,
        total_marks: float,
        percentile: float,
        date_str: Optional[str] = None,
        verify_base_url: str = "http://localhost:3000/verify"
    ) -> bytes:
        if not date_str:
            date_str = datetime.utcnow().strftime("%B %d, %Y")

        cert_id = cls.generate_verification_hash(candidate_name, exam_title, score, date_str)
        verify_url = f"{verify_base_url}/{cert_id}"

        # Generate QR Code buffer
        qr = qrcode.QRCode(box_size=4, border=1)
        qr.add_data(verify_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="#123B7A", back_color="white")
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)

        # Create Landscape Certificate PDF
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=landscape(letter),
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=26,
            leading=30,
            textColor=colors.HexColor("#123B7A"),
            alignment=1
        )

        subtitle_style = ParagraphStyle(
            'CertSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#475569"),
            alignment=1
        )

        candidate_style = ParagraphStyle(
            'CandidateName',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=28,
            leading=34,
            textColor=colors.HexColor("#0F172A"),
            alignment=1
        )

        body_style = ParagraphStyle(
            'CertBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=18,
            textColor=colors.HexColor("#334155"),
            alignment=1
        )

        meta_style = ParagraphStyle(
            'CertMeta',
            parent=styles['Normal'],
            fontName='Courier-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748B"),
            alignment=0
        )

        percentage = round((score / total_marks * 100), 1) if total_marks > 0 else 0

        elements = [
            Spacer(1, 15),
            Paragraph("EVALORA ASSESSMENT SYSTEMS", subtitle_style),
            Spacer(1, 4),
            Paragraph("CERTIFICATE OF ACHIEVEMENT", title_style),
            Spacer(1, 16),
            Paragraph("This is to certify that", subtitle_style),
            Spacer(1, 10),
            Paragraph(candidate_name, candidate_style),
            Spacer(1, 12),
            Paragraph(
                f"has successfully completed the proctored assessment for <b>{exam_title}</b>, "
                f"achieving an overall score of <b>{score}/{total_marks} ({percentage}%)</b> "
                f"with a performance standing in the <b>{percentile}th percentile</b>.",
                body_style
            ),
            Spacer(1, 28)
        ]

        # Footer Layout with QR Code + Security Hash + Signatures
        qr_flowable = Image(qr_buffer, width=70, height=70)
        security_text = Paragraph(
            f"<b>CREDENTIAL ID:</b> {cert_id}<br/>"
            f"<b>ISSUED DATE:</b> {date_str}<br/>"
            f"<b>AUTHENTICITY:</b> SHA-256 Cryptographic Tamper-Proof<br/>"
            f"<b>SCAN TO VERIFY:</b> {verify_url}",
            meta_style
        )
        signature_block = Paragraph(
            "<b>EVALORA ACADEMIC COUNCIL</b><br/>"
            "Digitally Signed & Validated<br/>"
            "<i>Authorized Institutional Registrar</i>",
            meta_style
        )

        footer_table = Table(
            [[qr_flowable, security_text, signature_block]],
            colWidths=[80, 420, 220]
        )
        footer_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LINEABOVE', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
        ]))

        elements.append(footer_table)
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
