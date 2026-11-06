import Images from "./Images";
export async function readPdfData(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error("PDF ต้องไม่เกิน 5 MB และ 20 หน้า");
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("อ่านไฟล์ PDF ไม่สำเร็จ"));
    reader.onload=()=>resolve(`data:application/pdf;base64,${String(reader.result).split(",")[1]}`);
    reader.readAsDataURL(file);
  });
}
export async function extractFile(school, input, setStage) {
  setStage?.("กำลังบันทึกต้นฉบับ…");
  const {document}=await school.request("/ocr/files",{method:"POST",body:input});
  setStage?.("GPT กำลังอ่านข้อความและแยกหน้า…");
  try {
    return (await school.request(`/ocr/${document.extractionId}/process`,{method:"POST"})).document;
  } catch(error) {
    return {...document,ocrStatus:"failed",ocrError:error.message,status:"ocr_pending"};
  }
}
export default function OcrDocumentContent({document}) {
  return <>
    <Images images={document.images} />
    {document.extractionId && <div className="ocr-document-note">
      <a href={`/api/school/ocr/${document.extractionId}/file`} target="_blank" rel="noreferrer">เปิดต้นฉบับ{document.type === "PDF" ? " PDF" : "รูปภาพ"}</a>
      <p>{document.ocrStatus === "ready" ? "ข้อความอ่านด้วย GPT · ตรวจเทียบต้นฉบับเมื่อใช้ตัวเลขหรือข้อความสำคัญ" : document.ocrError || "กำลังรออ่านข้อความ"}</p>
    </div>}
    {document.pages?.length ? document.pages.map(page=><section className="ocr-page" key={page.page}>
      <h3>หน้า {page.page}</h3><p>{page.text || "หน้านี้ไม่มีข้อความ"}</p>
    </section>) : <p>{document.text}</p>}
  </>;
}
