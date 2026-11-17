"""Create a deterministic synthetic PDF; never read credentials or customer files."""
from pathlib import Path
from hashlib import sha256
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
root=Path(__file__).resolve().parent/'fixtures'
root.mkdir(exist_ok=True)
file=root/'umber-private-upload-qa.pdf'
pdf=canvas.Canvas(str(file),pagesize=A4,invariant=1)
pdf.setTitle('UMBER QA - archivo sintetico')
pdf.setAuthor('UMBER QA')
pdf.setFont('Helvetica-Bold',18)
pdf.drawString(54,780,'UMBER QA - ARCHIVO SINTETICO')
pdf.setFont('Helvetica',11)
for i,line in enumerate(['Prueba de carga privada, vista previa y aislamiento de proyecto.',
 'No contiene datos de clientes, planos reales ni informacion bancaria.',
 'Proyecto permitido: e2e00000-0000-4000-8000-000000000001.',
 'Este archivo no es un entregable de obra ni una aprobacion.',
 'Marcador de evidencia: UMBER-UPLOAD-QA-20261117.']):
 pdf.drawString(54,740-i*24,line)
pdf.showPage();pdf.save()
raw=file.read_bytes()
print(file)
print('bytes:',len(raw))
print('sha256:',sha256(raw).hexdigest())
