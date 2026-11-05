import i18n from "i18next";
import nativeEnglish from "../mentingo/locales/en/translation.json";
i18n.addResourceBundle("th","common",nativeEnglish,true,false);
const translations={
 studentCoursesView:{modernView:{continueLearning:"เรียนต่อ",topCourses:"บทเรียนยอดนิยม",lessonsCount:"{{count}} บทเรียน",lessonsCount_one:"{{count}} บทเรียน",lessonsCount_other:"{{count}} บทเรียน",hero:{moreInfo:"ดูบทเรียน",info:"รายละเอียด"}},breadcrumbs:{courses:"บทเรียน"},other:{cannotFindCourses:"ยังไม่มีบทเรียนในห้องนี้"}},
 studentCourseView:{sideSection:{button:{startLearning:"เริ่มเรียน",continueLearning:"เรียนต่อ",repeatLessons:"ทบทวนบทเรียน"}},studentMode:{bannerTitle:"มุมมองนักเรียน"}},
 studentLessonView:{other:{chapter:"บทที่"},sideSection:{header:"เนื้อหาในบทเรียน",other:{courseProgress:"ความก้าวหน้า"}},button:{previous:"ก่อนหน้า",next:"ถัดไป",finish:"จบบทเรียน"},error:{notAuthorizedTitle:"เปิดบทเรียนไม่สำเร็จ",notAuthorizedDescription:"ตรวจสอบห้องเรียนที่เลือก",goBackToCourse:"กลับไปบทเรียน"}},
 common:{button:{next:"ถัดไป",previous:"ก่อนหน้า",back:"กลับ",cancel:"ยกเลิก"},other:{dueDate:"ครบกำหนด {{date}}"}},
};
i18n.addResourceBundle("th","common",translations,true,true);
