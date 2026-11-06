export async function uploadImageFile(file, school) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("รองรับ JPG, PNG และ WebP เท่านั้น");
  if (file.size > 10 * 1024 * 1024) throw new Error("เลือกรูปไม่เกิน 10 MB ต่อไฟล์");
  if (!school) throw new Error("กรุณาเข้าสู่ระบบเพื่ออัปโหลดรูป");
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let image;
    for (const quality of [0.85, 0.7, 0.5, 0.3]) {
      image = canvas.toDataURL("image/webp", quality);
      if (image.length < 680000) break;
    }
    if (image.length >= 680000) throw new Error("รูปนี้มีรายละเอียดมากเกินไป กรุณาย่อรูปก่อนอัปโหลด");
    return (await school.request("/images", { method: "POST", body: {image} })).image;
  } finally { bitmap.close(); }
}
export default function Images({ images = [] }) {
  if (!images.length) return null;
  return <div className="lesson-image-gallery">{images.map((image, index) => <figure key={image.id}>
    <a href={`/api/school/images/${image.id}`} target="_blank" rel="noreferrer" aria-label={`เปิดรูปขนาดเต็ม ${index + 1}`}>
      <img src={`/api/school/images/${image.id}`} alt={image.caption || `ภาพประกอบที่ครูเพิ่ม ${index + 1}`} loading="lazy" />
    </a>
    {image.caption && <figcaption>{image.caption}</figcaption>}
  </figure>)}</div>;
}
