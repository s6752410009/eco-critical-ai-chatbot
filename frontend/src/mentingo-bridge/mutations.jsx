import { done } from "./context";
const idle={mutate:()=>{},mutateAsync:done,isPending:false};
export const useEnrollCourse=()=>idle;
export const useMarkCourseOpened=()=>idle;
// The existing quiz/activities remain the authority for completion; no automatic 100% on render.
export const useMarkLessonAsCompleted=()=>idle;
export const useRepeatCourse=()=>idle;
export const useToggleCourseStudentMode=()=>idle;
