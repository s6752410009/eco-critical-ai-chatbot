import { useMemo } from "react";
import {
  snapshot,
  useEcoData,
  useCourses,
  makeCourse,
  makeLesson,
  EMPTY,
  done,
} from "./context";
import { PERMISSIONS } from "./shared";
const currentUser = {
  id: "eco-student",
  username: "นักเรียน",
  permissions: [
    PERMISSIONS.LEARNING_PROGRESS_UPDATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_READ_ASSIGNED,
    PERMISSIONS.DASHBOARD_READ,
  ],
  roleSlugs: ["student"],
  studentModeCourseIds: [],
};
function nativeUser(bridge) {
  return bridge?.school
    ? {
        ...currentUser,
        id: bridge.school.user.id,
        username: bridge.school.user.displayName,
        roleSlugs: [bridge.school.user.role],
      }
    : currentUser;
}
export function useCurrentUser() {
  const bridge = useEcoData();
  return { data: nativeUser(bridge), isLoading: false };
}
export const currentUserQueryOptions = {
  queryKey: ["currentUser"],
  queryFn: async () => ({ data: nativeUser(snapshot) }),
};
export function useCourse(id) {
  const bridge = useEcoData();
  const data = useMemo(() => makeCourse(bridge, id), [bridge, id]);
  return { data, isLoading: false, isFetching: false, isError: false };
}
export function useLesson(id) {
  const bridge = useEcoData();
  const data = useMemo(() => makeLesson(bridge, id), [bridge, id]);
  return { data, isLoading: false, isFetching: false, isError: false };
}
export function lessonQueryOptions(id) {
  return {
    queryKey: ["lesson", id],
    queryFn: async () => makeLesson(snapshot, id),
  };
}
export const getCourseQueryKey = (id) => ["course", id];
export const courseQueryOptions = (id) => ({
  queryKey: getCourseQueryKey(id),
  queryFn: async () => makeCourse(snapshot, id),
});
function paginated(data) {
  return {
    data: {
      pages: [{ data, pagination: { totalItems: data.length, totalPages: 1 } }],
    },
    isLoading: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: done,
  };
}
export function useInfiniteStudentCourses() {
  const courses = useCourses();
  return useMemo(() => paginated(courses), [courses]);
}
export function useInfiniteAvailableCourses() {
  return useInfiniteStudentCourses();
}
export function useInfiniteAvailableCourseCategories() {
  return useMemo(() => paginated(EMPTY), []);
}
export function useTopCourses() {
  return { data: EMPTY, isLoading: false };
}
export function useGlobalSettings() {
  const bridge = useEcoData();
  return {
    data: {
      featuredCourseId:
        bridge.lesson?.id ||
        bridge.data.lastLesson?.lessonId ||
        bridge.available[0]?.id,
      courseListLayout: "modern",
      articlesEnabled: false,
      QAEnabled: false,
      newsEnabled: false,
    },
    isLoading: false,
  };
}
export const availableCoursesQueryOptions = () => ({
  queryKey: ["availableCourses"],
});
export const studentCoursesQueryOptions = () => ({
  queryKey: ["studentCourses"],
});
export const topCoursesQueryOptions = () => ({ queryKey: ["topCourses"] });
export const ALL_COURSES_QUERY_KEY = ["courses"];
export const allCoursesQueryOptions = () => ({
  queryKey: ALL_COURSES_QUERY_KEY,
  queryFn: async () =>
    snapshot.available.map((lesson) => makeCourse(snapshot, lesson.id)),
});
export const categoriesQueryOptions = () => ({
  queryKey: ["categories"],
  queryFn: async () => EMPTY,
});
export const companyInformationQueryOptions = {
  queryKey: ["companyInformation"],
  queryFn: async () => ({ data: { companyShortName: "Eco-Critical" } }),
};
