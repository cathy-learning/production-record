import Quartz
import sys

def read_pdf(file_path):
    pdf_url = Quartz.CFURLCreateFromFileSystemRepresentation(None, file_path.encode('utf-8'), len(file_path.encode('utf-8')), False)
    if not pdf_url:
        return "Could not create URL"
        
    pdf_doc = Quartz.PDFDocument.alloc().initWithURL_(pdf_url)
    
    if not pdf_doc:
         return "Could not read PDF"
    
    text = ""
    for i in range(pdf_doc.pageCount()):
        page = pdf_doc.pageAtIndex_(i)
        if page and page.string():
            text += page.string() + "\n"
    return text

if __name__ == "__main__":
    print(read_pdf("生产记录.pdf"))
